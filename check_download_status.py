#!/usr/bin/env python3
"""
Script pour vérifier l'état du téléchargement des PDFs
"""

import os
import json
from pathlib import Path

def check_status():
    # Configuration
    extraction_folder = Path("extraction_2025-09-24")
    json_file = "attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json"
    
    # Compter les PDFs téléchargés
    if extraction_folder.exists():
        downloaded_files = [f for f in os.listdir(extraction_folder) if f.endswith('.pdf')]
        downloaded_count = len(downloaded_files)
    else:
        downloaded_count = 0
    
    # Compter le total dans le JSON
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            total_conventions = len(json.load(f))
    except:
        total_conventions = 530  # Valeur par défaut connue
    
    # Calculer le pourcentage
    if total_conventions > 0:
        percentage = (downloaded_count / total_conventions) * 100
    else:
        percentage = 0
    
    # Calculer la taille du dossier
    total_size = 0
    if extraction_folder.exists():
        for pdf_file in extraction_folder.glob("*.pdf"):
            total_size += pdf_file.stat().st_size
    
    # Convertir en MB/GB
    if total_size > 1024*1024*1024:  # > 1GB
        size_str = f"{total_size/(1024*1024*1024):.1f} GB"
    else:
        size_str = f"{total_size/(1024*1024):.0f} MB"
    
    # Afficher le résultat
    print("=" * 50)
    print("📊 ÉTAT DU TÉLÉCHARGEMENT DES PDFs")
    print("=" * 50)
    print(f"📁 Dossier: extraction_2025-09-24")
    print(f"📊 Progrès: {downloaded_count}/{total_conventions} PDFs ({percentage:.1f}%)")
    print(f"💾 Taille: {size_str}")
    print(f"📈 Barre de progression: {'█' * int(percentage/5)}{'░' * (20-int(percentage/5))} {percentage:.1f}%")
    
    if downloaded_count >= total_conventions:
        print("🎉 TÉLÉCHARGEMENT TERMINÉ!")
        print("✅ Tous les PDFs ont été téléchargés avec succès")
    else:
        remaining = total_conventions - downloaded_count
        print(f"⏳ En cours... Restant: {remaining} PDFs")
    
    print("=" * 50)
    return downloaded_count >= total_conventions

if __name__ == "__main__":
    check_status()