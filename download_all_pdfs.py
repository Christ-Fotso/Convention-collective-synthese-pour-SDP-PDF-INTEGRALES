#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Téléchargement complet de TOUTES les conventions collectives
"""
import os
import json
import requests
import csv
from pathlib import Path
from datetime import datetime
import concurrent.futures as cf
from typing import Tuple, List
import time

def sanitize_filename(name: str) -> str:
    """Nettoie le nom de fichier pour le système de fichiers"""
    for char in '<>:"|?*\\/':
        name = name.replace(char, '_')
    return name.strip()

def clean_url(url: str) -> str:
    """Nettoie les URLs malformées"""
    if url.startswith('https://,https://'):
        return url.replace('https://,https://', 'https://')
    elif url.startswith('http://,http://'):
        return url.replace('http://,http://', 'http://')
    return url.strip()

def download_one(session: requests.Session, convention: dict, out_dir: Path) -> Tuple[str, str, dict]:
    """Télécharge une convention. Retourne (status, message, convention)"""
    try:
        raw_url = convention.get('Link', '').strip()
        if not raw_url:
            return ("ERROR", "URL manquante", convention)
        
        # Nettoyer l'URL
        url = clean_url(raw_url)
        
        # Nom de fichier
        nom = convention.get('Nom De la Convention', 'Convention')
        idcc = convention.get('IDCC', 'Sans_IDCC')
        filename = sanitize_filename(f"{idcc}_{nom}.pdf")
        filepath = out_dir / filename
        
        # Vérifier si déjà téléchargé
        if filepath.exists() and filepath.stat().st_size > 1000:
            return ("SKIP", f"Déjà présent: {filename}", convention)
        
        # Télécharger avec retry automatique
        max_retries = 3
        response = None
        for attempt in range(max_retries):
            try:
                response = session.get(url, timeout=45, stream=True)
                if response.status_code == 200:
                    break
                elif response.status_code in [429, 503, 504]:  # Rate limit ou serveur occupé
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Backoff exponentiel
                        continue
                return ("ERROR", f"HTTP {response.status_code} après {max_retries} tentatives", convention)
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                return ("ERROR", "Timeout après plusieurs tentatives", convention)
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                return ("ERROR", f"Erreur réseau: {str(e)}", convention)
        
        if response is None or response.status_code != 200:
            return ("ERROR", "Impossible d'obtenir une réponse valide", convention)
        
        # Sauvegarder
        tmp_filepath = filepath.with_suffix('.tmp')
        try:
            with open(tmp_filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=16384):
                    if chunk:
                        f.write(chunk)
            
            size = tmp_filepath.stat().st_size
            if size < 1000:
                tmp_filepath.unlink(missing_ok=True)
                return ("ERROR", f"Fichier trop petit ({size} octets)", convention)
            
            # Renommer une fois terminé
            tmp_filepath.rename(filepath)
            return ("SUCCESS", f"Téléchargé: {filename} ({size:,} octets)", convention)
            
        except Exception as e:
            tmp_filepath.unlink(missing_ok=True)
            return ("ERROR", f"Erreur sauvegarde: {str(e)}", convention)
        
    except Exception as e:
        return ("ERROR", f"Erreur générale: {str(e)}", convention)

def main():
    # Configuration pour téléchargement complet
    MAX_WORKERS = 6  # Parallélisme modéré pour éviter la surcharge serveur
    
    # Dossier de sortie
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    out_dir = Path(f"resultats_telechargements/complet_{timestamp}")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Journal CSV
    log_file = out_dir / "journal_complet.csv"
    progress_file = out_dir / "progression.txt"
    
    print(f"📁 Dossier: {out_dir}")
    print(f"⚡ Parallélisme: {MAX_WORKERS} workers")
    print(f"🎯 Objectif: TOUTES les conventions disponibles")
    
    # Charger le JSON
    try:
        with open("conventions_collectives_integrales_lienpdf_nettoye.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"📄 JSON chargé: {len(data)} conventions à télécharger")
    except Exception as e:
        print(f"❌ Erreur JSON: {e}")
        return
    
    start_time = time.time()
    
    # Session HTTP optimisée
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    # Téléchargement parallèle
    results = {"SUCCESS": 0, "ERROR": 0, "SKIP": 0}
    processed = 0
    total = len(data)
    
    # Initialiser les fichiers de suivi
    with open(log_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, delimiter=';')
        writer.writerow(['horodatage', 'statut', 'message', 'idcc', 'nom', 'url'])
        
        with cf.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Soumettre toutes les tâches
            futures = [
                executor.submit(download_one, session, conv, out_dir) 
                for conv in data
            ]
            
            # Traiter les résultats au fur et à mesure
            for future in cf.as_completed(futures):
                status, message, conv = future.result()
                results[status] += 1
                processed += 1
                
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
                
                # Progression toutes les 10 conventions
                if processed % 10 == 0 or processed == total:
                    elapsed = time.time() - start_time
                    rate = processed / elapsed if elapsed > 0 else 0
                    eta = (total - processed) / rate if rate > 0 else 0
                    
                    progress = f"[{processed:3d}/{total}] ✅{results['SUCCESS']} ⏭️{results['SKIP']} ❌{results['ERROR']} | {rate:.1f}/s | ETA: {eta/60:.1f}min"
                    print(progress)
                    
                    # Sauvegarder progression
                    with open(progress_file, 'w') as pf:
                        pf.write(f"{progress}\nDernière MAJ: {datetime.now().isoformat()}\n")
                
                # Affichage détaillé pour erreurs importantes
                if status == "ERROR" and processed % 50 == 0:
                    print(f"❌ ERREUR récente: {conv.get('IDCC', 'N/A')} - {message[:80]}...")
    
    # Résumé final
    elapsed = time.time() - start_time
    print(f"\n🎉 TÉLÉCHARGEMENT TERMINÉ en {elapsed/60:.1f} minutes")
    print(f"📊 RÉSULTATS FINAUX:")
    print(f"  ✅ Succès: {results['SUCCESS']}")
    print(f"  ⏭️  Ignorés: {results['SKIP']}")
    print(f"  ❌ Erreurs: {results['ERROR']}")
    print(f"  📈 Taux de succès: {results['SUCCESS']/total*100:.1f}%")
    
    # Statistiques finales
    pdf_files = list(out_dir.glob("*.pdf"))
    total_size = sum(f.stat().st_size for f in pdf_files)
    print(f"  📋 Fichiers PDF: {len(pdf_files)}")
    print(f"  💾 Taille totale: {total_size/1024/1024/1024:.2f} GB")
    print(f"  📁 Dossier: {out_dir}")
    print(f"  📄 Journal: {log_file}")
    
    # Sauvegarder résumé final
    with open(out_dir / "resume_final.txt", 'w', encoding='utf-8') as f:
        f.write(f"Téléchargement complet terminé le {datetime.now().isoformat()}\n")
        f.write(f"Durée: {elapsed/60:.1f} minutes\n")
        f.write(f"Succès: {results['SUCCESS']}/{total} ({results['SUCCESS']/total*100:.1f}%)\n")
        f.write(f"Fichiers: {len(pdf_files)} PDFs\n")
        f.write(f"Taille: {total_size/1024/1024/1024:.2f} GB\n")

if __name__ == "__main__":
    main()