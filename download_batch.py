#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Téléchargement batch des conventions collectives avec limitation
"""
import os
import json
import requests
import csv
from pathlib import Path
from datetime import datetime
import concurrent.futures as cf
from typing import Tuple, List

def sanitize_filename(name: str) -> str:
    """Nettoie le nom de fichier pour le système de fichiers"""
    for char in '<>:"|?*\\/':
        name = name.replace(char, '_')
    return name.strip()

def download_one(session: requests.Session, convention: dict, out_dir: Path) -> Tuple[str, str, dict]:
    """Télécharge une convention. Retourne (status, message, convention)"""
    try:
        url = convention.get('Link', '').strip()
        if not url:
            return ("ERROR", "URL manquante", convention)
        
        # Nom de fichier
        nom = convention.get('Nom De la Convention', 'Convention')
        idcc = convention.get('IDCC', 'Sans_IDCC')
        filename = sanitize_filename(f"{idcc}_{nom}.pdf")
        filepath = out_dir / filename
        
        # Vérifier si déjà téléchargé
        if filepath.exists() and filepath.stat().st_size > 1000:
            return ("SKIP", f"Déjà présent: {filename}", convention)
        
        # Télécharger
        response = session.get(url, timeout=30, stream=True)
        if response.status_code != 200:
            return ("ERROR", f"HTTP {response.status_code}", convention)
        
        # Sauvegarder
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        size = filepath.stat().st_size
        if size < 1000:
            filepath.unlink(missing_ok=True)
            return ("ERROR", f"Fichier trop petit ({size} octets)", convention)
        
        return ("SUCCESS", f"Téléchargé: {filename} ({size:,} octets)", convention)
        
    except Exception as e:
        return ("ERROR", f"Erreur: {str(e)}", convention)

def main():
    # Configuration
    MAX_WORKERS = 4  # Parallélisme limité pour ne pas surcharger le serveur
    LIMIT_CONVENTIONS = 50  # Limiter à 50 conventions pour le test
    
    # Dossier de sortie
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    out_dir = Path(f"resultats_telechargements/batch_{timestamp}")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Journal CSV
    log_file = out_dir / "journal.csv"
    
    print(f"📁 Dossier: {out_dir}")
    print(f"📊 Limite: {LIMIT_CONVENTIONS} conventions")
    print(f"⚡ Parallélisme: {MAX_WORKERS} workers")
    
    # Charger le JSON
    try:
        with open("conventions_collectives_integrales_lienpdf_nettoye.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"📄 JSON chargé: {len(data)} conventions disponibles")
    except Exception as e:
        print(f"❌ Erreur JSON: {e}")
        return
    
    # Limiter le nombre de conventions
    conventions = data[:LIMIT_CONVENTIONS]
    print(f"📥 Traitement de {len(conventions)} conventions")
    
    # Session HTTP
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    
    # Téléchargement parallèle
    results = {"SUCCESS": 0, "ERROR": 0, "SKIP": 0}
    
    # Initialiser le CSV
    with open(log_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, delimiter=';')
        writer.writerow(['horodatage', 'statut', 'message', 'idcc', 'nom', 'url'])
        
        with cf.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Soumettre toutes les tâches
            futures = [
                executor.submit(download_one, session, conv, out_dir) 
                for conv in conventions
            ]
            
            # Traiter les résultats
            for i, future in enumerate(cf.as_completed(futures), 1):
                status, message, conv = future.result()
                results[status] += 1
                
                # Log CSV
                writer.writerow([
                    datetime.now().isoformat(),
                    status,
                    message,
                    conv.get('IDCC', ''),
                    conv.get('Nom De la Convention', ''),
                    conv.get('Link', '')
                ])
                csvfile.flush()
                
                # Affichage progression
                if status == "SUCCESS":
                    print(f"✅ [{i:2d}/{len(conventions)}] {conv.get('IDCC', 'N/A')} - {conv.get('Nom De la Convention', 'N/A')[:50]}...")
                elif status == "SKIP":
                    print(f"⏭️  [{i:2d}/{len(conventions)}] SKIP - {conv.get('IDCC', 'N/A')}")
                else:
                    print(f"❌ [{i:2d}/{len(conventions)}] ERREUR - {conv.get('IDCC', 'N/A')} - {message}")
    
    # Résumé final
    print(f"\n📊 RÉSULTATS:")
    print(f"  ✅ Succès: {results['SUCCESS']}")
    print(f"  ⏭️  Ignorés: {results['SKIP']}")
    print(f"  ❌ Erreurs: {results['ERROR']}")
    print(f"  📁 Dossier: {out_dir}")
    print(f"  📄 Journal: {log_file}")
    
    # Lister les fichiers téléchargés
    pdf_files = list(out_dir.glob("*.pdf"))
    total_size = sum(f.stat().st_size for f in pdf_files)
    print(f"  📋 Fichiers PDF: {len(pdf_files)} ({total_size/1024/1024:.1f} MB)")

if __name__ == "__main__":
    main()