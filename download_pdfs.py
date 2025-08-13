#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Téléchargement accéléré des PDF des conventions collectives depuis un JSON.
- Dossier de sortie daté du jour (telechargements_CCN_YYYY-MM-DD)
- Nettoyage/validation des URLs
- Téléchargements parallèles avec retries
- Journal CSV des succès/erreurs
- Reprise: saute les fichiers déjà présents
"""
from __future__ import annotations
import os
import re
import json
import csv
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, List
import concurrent.futures as cf

import requests
from requests.adapters import HTTPAdapter
try:
    # urllib3 v2
    from urllib3.util.retry import Retry
except Exception:
    # fallback for some environments
    from requests.packages.urllib3.util.retry import Retry  # type: ignore

JSON_PATH = os.environ.get("JSON_CCN_PATH", "conventions_collectives_integrales_lienpdf_nettoye.json")
# NB: fuseau non nécessaire ici, on utilise la date locale de la machine
OUT_DIR = Path(os.environ.get("OUT_BASE", ".")) / f"telechargements_CCN_{datetime.now().strftime('%Y-%m-%d')}"
LOG_CSV = OUT_DIR / "journal_telechargements.csv"
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", "8"))
TIMEOUT = int(os.environ.get("REQ_TIMEOUT", "30"))
RETRY_TOTAL = int(os.environ.get("RETRY_TOTAL", "3"))
RETRY_BACKOFF = float(os.environ.get("RETRY_BACKOFF", "0.5"))

HTTP_OK = 200

URL_REGEX = re.compile(r"https?://[^\s,\"\']+")
PDF_REGEX = re.compile(r"\.pdf($|\?)", re.IGNORECASE)

def make_session() -> requests.Session:
    s = requests.Session()
    retry = Retry(
        total=RETRY_TOTAL,
        connect=RETRY_TOTAL,
        read=RETRY_TOTAL,
        backoff_factor=RETRY_BACKOFF,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=MAX_WORKERS, pool_maxsize=MAX_WORKERS)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    s.headers.update({
        "User-Agent": "CCN-PDF-Downloader/1.0"
    })
    return s

def sanitize_filename(name: str) -> str:
    # remplace caractères interdits et trim
    base = re.sub(r"[^\w\-\s\.]", "_", name, flags=re.UNICODE)
    base = re.sub(r"\s+", " ", base, flags=re.UNICODE).strip()
    return base or "fichier"

def pick_best_url(raw_link: str) -> Optional[str]:
    """Extrait la première URL plausible vers un PDF à partir d'un champ Link possiblement sale."""
    if not raw_link:
        return None
    candidates = URL_REGEX.findall(raw_link)
    if not candidates and raw_link.startswith(("http://", "https://")):
        candidates = [raw_link]
    # priorité aux liens finissant par .pdf
    pdfs = [u for u in candidates if PDF_REGEX.search(u)]
    if pdfs:
        return pdfs[0]
    # sinon retourne la première URL si présente
    return candidates[0] if candidates else None

def ensure_outdir() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

def load_rows() -> List[dict]:
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Le JSON racine doit être une liste d'objets.")
    return data

def target_path(row: dict) -> Path:
    nom = row.get("Nom De la Convention") or row.get("Nom") or "Convention"
    idcc = (row.get("IDCC") or "").strip()
    brochure = (row.get("No Brochure") or "").strip()
    # Compose: IDCC_NOM.pdf (brochure en suffixe si utile)
    base = sanitize_filename(f"{idcc}_{nom}".strip("_"))
    if brochure:
        base = f"{base}_brochure_{sanitize_filename(brochure)}"
    return OUT_DIR / f"{base}.pdf"

def download_one(session: requests.Session, row: dict) -> Tuple[str, str]:
    """Retourne (statut, message). statut ∈ {'OK','SKIP','ERR'}"""
    url = pick_best_url((row.get("Link") or "").strip())
    dest = target_path(row)
    if dest.exists() and dest.stat().st_size > 0:
        return ("SKIP", f"Déjà présent: {dest.name}")
    if not url:
        return ("ERR", "URL manquante ou invalide")
    # requête
    try:
        with session.get(url, stream=True, timeout=TIMEOUT, allow_redirects=True) as r:
            if r.status_code != HTTP_OK:
                # parfois 200 après redirection, sinon erreur
                return ("ERR", f"HTTP {r.status_code} pour {url}")
            # vérification simple contenu
            ctype = r.headers.get("Content-Type", "").lower()
            if "pdf" not in ctype and not PDF_REGEX.search(url):
                # on télécharge quand même mais on avertit
                warn = True
            else:
                warn = False
            tmp_path = dest.with_suffix(".part")
            with open(tmp_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 15):
                    if chunk:
                        f.write(chunk)
            size = tmp_path.stat().st_size
            if size < 1024:  # < 1 Ko => suspect
                tmp_path.unlink(missing_ok=True)
                return ("ERR", f"Taille suspecte ({size} o) pour {url}")
            tmp_path.rename(dest)
            if warn:
                return ("OK", f"Téléchargé (type inconnu): {dest.name}")
            return ("OK", f"Téléchargé: {dest.name}")
    except requests.exceptions.RequestException as e:
        return ("ERR", f"Erreur réseau: {e.__class__.__name__}: {e}")
    except OSError as e:
        return ("ERR", f"Erreur fichier: {e.__class__.__name__}: {e}")

def main() -> None:
    ensure_outdir()
    rows = load_rows()
    session = make_session()

    # Préparer journal
    log_exists = LOG_CSV.exists()
    with open(LOG_CSV, "a", encoding="utf-8", newline="") as logf:
        writer = csv.writer(logf, delimiter=";")
        if not log_exists:
            writer.writerow(["horodatage", "statut", "message", "idcc", "nom", "lien"])

        def task(row: dict) -> Tuple[str, str, dict]:
            statut, msg = download_one(session, row)
            return statut, msg, row

        with cf.ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futures = [ex.submit(task, row) for row in rows]
            for fut in cf.as_completed(futures):
                statut, msg, row = fut.result()
                writer.writerow([
                    datetime.now().isoformat(timespec="seconds"),
                    statut,
                    msg,
                    (row.get("IDCC") or "").strip(),
                    (row.get("Nom De la Convention") or row.get("Nom") or "").strip(),
                    (row.get("Link") or "").strip(),
                ])
                # flush progress
                logf.flush()

if __name__ == "__main__":
    main()