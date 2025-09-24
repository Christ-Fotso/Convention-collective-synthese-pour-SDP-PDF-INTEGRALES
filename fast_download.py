#!/usr/bin/env python3
"""
Téléchargement RAPIDE avec 10 téléchargements simultanés
"""

import json
import requests
import os
import time
from pathlib import Path
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

def clean_filename(filename):
    """Nettoie le nom de fichier"""
    forbidden_chars = '<>:"/\\|?*'
    for char in forbidden_chars:
        filename = filename.replace(char, '_')
    filename = re.sub(r'\s+', '_', filename)
    if len(filename) > 200:
        filename = filename[:200]
    return filename

def fix_url(url):
    """Corrige les URLs malformées"""
    if url.startswith('https://,'):
        url = url[8:]
    return url.strip()

# Variables globales pour le suivi
lock = threading.Lock()
stats = {'success': 0, 'error': 0, 'skipped': 0, 'total': 0}

def download_single_pdf(args):
    """Télécharge un seul PDF"""
    i, convention, extraction_folder, downloaded_files = args
    
    try:
        idcc = convention.get('IDCC', '').strip()
        nom = convention.get('Nom De la Convention', 'Sans titre').strip()
        url = convention.get('Link', '').strip()
        
        if not url or url == " ":
            with lock:
                stats['skipped'] += 1
            return f"[{i}] ⏭️ Pas d'URL: {nom}"
        
        # Créer nom de fichier
        if idcc and idcc != " ":
            filename = f"{idcc}_{nom}.pdf"
        else:
            filename = f"{nom}.pdf"
        
        clean_name = clean_filename(filename)
        
        # Vérifier si déjà téléchargé
        if clean_name in downloaded_files:
            with lock:
                stats['skipped'] += 1
            return f"[{i}] ✅ Déjà téléchargé: {clean_name}"
        
        # Créer session pour ce thread
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Télécharger
        url = fix_url(url)
        response = session.get(url, timeout=20)
        response.raise_for_status()
        
        # Sauvegarder
        file_path = extraction_folder / clean_name
        with open(file_path, 'wb') as f:
            f.write(response.content)
        
        size_mb = len(response.content) / (1024*1024)
        
        with lock:
            stats['success'] += 1
            
        return f"[{i}] ✅ {clean_name} ({size_mb:.1f} MB)"
        
    except Exception as e:
        with lock:
            stats['error'] += 1
        return f"[{i}] ❌ Erreur {nom}: {str(e)[:50]}"

def main():
    print("🚀 TÉLÉCHARGEMENT RAPIDE AVEC 10 THREADS PARALLÈLES")
    print("=" * 60)
    
    # Configuration
    EXTRACTION_FOLDER = Path("extraction_2025-09-24")
    JSON_FILE = "attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json"
    MAX_WORKERS = 10  # 10 téléchargements simultanés !
    
    # Charger les données
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        conventions = json.load(f)
    
    stats['total'] = len(conventions)
    print(f"📋 Total conventions: {len(conventions)}")
    
    # Fichiers déjà téléchargés
    EXTRACTION_FOLDER.mkdir(exist_ok=True)
    downloaded_files = {f for f in os.listdir(EXTRACTION_FOLDER) if f.endswith('.pdf')}
    print(f"📁 Déjà téléchargés: {len(downloaded_files)}")
    print(f"⚡ Téléchargement parallèle avec {MAX_WORKERS} threads")
    print()
    
    start_time = time.time()
    
    # Préparer les arguments pour chaque thread
    tasks = []
    for i, convention in enumerate(conventions, 1):
        tasks.append((i, convention, EXTRACTION_FOLDER, downloaded_files))
    
    # Lancer le téléchargement parallèle
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Soumettre toutes les tâches
        futures = {executor.submit(download_single_pdf, task): task for task in tasks}
        
        # Traiter les résultats au fur et à mesure
        for future in as_completed(futures):
            result = future.result()
            print(result)
            
            # Afficher progression tous les 20 téléchargements
            total_processed = stats['success'] + stats['error'] + stats['skipped']
            if total_processed % 20 == 0:
                elapsed = time.time() - start_time
                speed = total_processed / elapsed if elapsed > 0 else 0
                remaining = stats['total'] - total_processed
                eta = remaining / speed if speed > 0 else 0
                
                print(f"\n📊 Progression: {total_processed}/{stats['total']} "
                      f"({total_processed/stats['total']*100:.1f}%)")
                print(f"⚡ Vitesse: {speed:.1f} PDFs/seconde")
                print(f"⏱️  ETA: {eta/60:.1f} minutes")
                print(f"✅ Succès: {stats['success']}, ❌ Erreurs: {stats['error']}, "
                      f"⏭️  Ignorés: {stats['skipped']}")
                print("-" * 40)
    
    # Résultats finaux
    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("🏁 TÉLÉCHARGEMENT TERMINÉ!")
    print("=" * 60)
    print(f"⏱️  Temps total: {elapsed/60:.1f} minutes")
    print(f"✅ Succès: {stats['success']}")
    print(f"❌ Erreurs: {stats['error']}")
    print(f"⏭️  Ignorés (déjà téléchargés): {stats['skipped']}")
    print(f"⚡ Vitesse moyenne: {stats['success']/elapsed:.1f} PDFs/seconde")
    
    # Vérification finale
    final_count = len([f for f in os.listdir(EXTRACTION_FOLDER) if f.endswith('.pdf')])
    print(f"📁 Total PDFs dans le dossier: {final_count}")

if __name__ == "__main__":
    main()