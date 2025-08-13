#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test pour télécharger quelques PDFs de conventions collectives
"""
import os
import json
import requests
from pathlib import Path
from datetime import datetime

def test_download():
    # Créer le dossier de sortie
    out_dir = Path(f"resultats_telechargements/test_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Dossier de sortie créé: {out_dir}")
    
    # Charger le JSON
    try:
        with open("conventions_collectives_integrales_lienpdf_nettoye.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"JSON chargé avec {len(data)} conventions")
    except Exception as e:
        print(f"Erreur lors du chargement du JSON: {e}")
        return
    
    # Tester avec les 5 premières conventions
    test_conventions = data[:5]
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    
    for i, conv in enumerate(test_conventions, 1):
        print(f"\n[{i}/5] Traitement: {conv.get('Nom De la Convention', 'N/A')}")
        print(f"IDCC: {conv.get('IDCC', 'N/A')}")
        print(f"URL: {conv.get('Link', 'N/A')}")
        
        url = conv.get('Link', '').strip()
        if not url:
            print("❌ URL manquante")
            continue
            
        # Nom de fichier sécurisé
        nom = conv.get('Nom De la Convention', 'Convention').replace('/', '_').replace('\\', '_')
        idcc = conv.get('IDCC', 'Sans_IDCC')
        filename = f"{idcc}_{nom}.pdf"
        
        # Nettoyer le nom de fichier
        for char in '<>:"|?*':
            filename = filename.replace(char, '_')
        
        filepath = out_dir / filename
        
        try:
            print(f"Téléchargement en cours...")
            response = session.get(url, timeout=30, stream=True)
            print(f"Status HTTP: {response.status_code}")
            
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                size = filepath.stat().st_size
                print(f"✅ Téléchargé avec succès - Taille: {size:,} octets")
                
                if size < 1000:
                    print("⚠️  Attention: fichier très petit, possiblement corrompu")
                    
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                
        except requests.RequestException as e:
            print(f"❌ Erreur réseau: {e}")
        except Exception as e:
            print(f"❌ Erreur: {e}")
    
    print(f"\nTest terminé. Fichiers dans: {out_dir}")
    
    # Lister les fichiers téléchargés
    files = list(out_dir.glob("*.pdf"))
    print(f"Fichiers téléchargés: {len(files)}")
    for f in files:
        size = f.stat().st_size
        print(f"  - {f.name} ({size:,} octets)")

if __name__ == "__main__":
    test_download()