#!/usr/bin/env python3
"""
Version simplifiée pour continuer le téléchargement
"""

import json
import requests
import os
import time
from pathlib import Path
import re

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

# Configuration
EXTRACTION_FOLDER = Path("extraction_2025-09-24")
JSON_FILE = "attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json"

# Charger les données
with open(JSON_FILE, 'r', encoding='utf-8') as f:
    conventions = json.load(f)

print(f"Total conventions: {len(conventions)}")

# Créer session
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

# Compter les déjà téléchargés
downloaded_files = {f for f in os.listdir(EXTRACTION_FOLDER) if f.endswith('.pdf')}
print(f"Déjà téléchargés: {len(downloaded_files)}")

success_count = 0
error_count = 0

for i, convention in enumerate(conventions, 1):
    try:
        idcc = convention.get('IDCC', '').strip()
        nom = convention.get('Nom De la Convention', 'Sans titre').strip()
        url = convention.get('Link', '').strip()
        
        if not url or url == " ":
            continue
            
        # Créer nom de fichier
        if idcc and idcc != " ":
            filename = f"{idcc}_{nom}.pdf"
        else:
            filename = f"{nom}.pdf"
        
        clean_name = clean_filename(filename)
        
        # Vérifier si déjà téléchargé
        if clean_name in downloaded_files:
            print(f"[{i}/{len(conventions)}] Déjà téléchargé: {clean_name}")
            continue
        
        print(f"[{i}/{len(conventions)}] Téléchargement: {clean_name}")
        
        # Télécharger
        url = fix_url(url)
        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
            
            with open(EXTRACTION_FOLDER / clean_name, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Téléchargé: {len(response.content):,} bytes")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            error_count += 1
        
        time.sleep(0.3)
        
    except KeyboardInterrupt:
        print("\nInterrompu par l'utilisateur")
        break
    except Exception as e:
        print(f"Erreur convention {i}: {e}")
        error_count += 1

print(f"\nTerminé! Succès: {success_count}, Erreurs: {error_count}")