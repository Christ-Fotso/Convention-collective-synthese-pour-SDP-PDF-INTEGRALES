#!/usr/bin/env python3
"""
Vérifier le mapping entre les conventions JSON et les PDFs téléchargés
"""

import json
import os
from pathlib import Path
import re

def clean_filename(filename):
    """Nettoie le nom de fichier pour la comparaison"""
    forbidden_chars = '<>:"/\\|?*'
    for char in forbidden_chars:
        filename = filename.replace(char, '_')
    filename = re.sub(r'\s+', '_', filename)
    if len(filename) > 200:
        filename = filename[:200]
    return filename

def main():
    # Charger les données JSON
    with open('attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json', 'r', encoding='utf-8') as f:
        conventions = json.load(f)
    
    # Lister les PDFs téléchargés
    pdf_folder = Path('extraction_2025-09-24')
    downloaded_pdfs = {f for f in os.listdir(pdf_folder) if f.endswith('.pdf')}
    
    print("🔍 ANALYSE DU MAPPING CONVENTIONS ↔ PDFs")
    print("=" * 60)
    print(f"📋 Conventions dans JSON: {len(conventions)}")
    print(f"📁 PDFs téléchargés: {len(downloaded_pdfs)}")
    print()
    
    # Analyser les correspondances
    mapping_with_idcc = []
    mapping_without_idcc = []
    problemes_mapping = []
    
    for conv in conventions:
        idcc = conv.get('IDCC', '').strip()
        nom = conv.get('Nom De la Convention', '').strip()
        
        # Générer le nom de fichier attendu
        if idcc and idcc != ' ':
            expected_filename = f"{idcc}_{nom}.pdf"
            category = "avec_idcc"
        else:
            expected_filename = f"{nom}.pdf"
            category = "sans_idcc"
        
        expected_clean = clean_filename(expected_filename)
        
        # Vérifier si le PDF existe
        if expected_clean in downloaded_pdfs:
            if category == "avec_idcc":
                mapping_with_idcc.append({
                    'idcc': idcc,
                    'nom': nom,
                    'filename': expected_clean,
                    'mapping_key': idcc  # L'IDCC sert de clé
                })
            else:
                mapping_without_idcc.append({
                    'idcc': None,
                    'nom': nom,
                    'filename': expected_clean,
                    'mapping_key': expected_clean.replace('.pdf', '')  # Le nom de fichier sert de clé
                })
        else:
            problemes_mapping.append({
                'idcc': idcc if idcc != ' ' else None,
                'nom': nom,
                'expected_filename': expected_clean
            })
    
    print("✅ CONVENTIONS AVEC IDCC - Mapping par IDCC:")
    print(f"   Nombre: {len(mapping_with_idcc)}")
    print("   Exemples:")
    for item in mapping_with_idcc[:5]:
        print(f"     IDCC {item['idcc']} → {item['filename']}")
    print()
    
    print("⚠️  CONVENTIONS SANS IDCC - Mapping par nom de fichier:")
    print(f"   Nombre: {len(mapping_without_idcc)}")
    print("   Exemples:")
    for item in mapping_without_idcc[:5]:
        print(f"     '{item['mapping_key']}' → {item['filename']}")
    print()
    
    if problemes_mapping:
        print("❌ PROBLÈMES DE MAPPING:")
        print(f"   Nombre: {len(problemes_mapping)}")
        for prob in problemes_mapping[:5]:
            print(f"     IDCC {prob['idcc']}: {prob['nom']} → {prob['expected_filename']} (MANQUANT)")
        print()
    
    print("💡 SOLUTION POUR LE MAPPING:")
    print("=" * 60)
    print("1. Pour les conventions AVEC IDCC:")
    print("   - Utiliser l'IDCC comme clé de mapping")
    print("   - Chercher le PDF: {IDCC}_{nom}.pdf")
    print()
    print("2. Pour les conventions SANS IDCC:")
    print("   - Utiliser le nom nettoyé comme clé de mapping")  
    print("   - Chercher le PDF: {nom_nettoye}.pdf")
    print()
    print("3. Dans la base de données:")
    print("   - ID = IDCC (pour celles qui en ont)")
    print("   - ID = nom_nettoye (pour celles sans IDCC)")
    print()
    
    # Créer un mapping JSON pour référence
    mapping_data = {
        'conventions_avec_idcc': mapping_with_idcc,
        'conventions_sans_idcc': mapping_without_idcc,
        'problemes': problemes_mapping,
        'total_mappable': len(mapping_with_idcc) + len(mapping_without_idcc),
        'total_problemes': len(problemes_mapping)
    }
    
    with open('mapping_analyse.json', 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, ensure_ascii=False, indent=2)
    
    print(f"📊 RÉSUMÉ:")
    print(f"   ✅ Mappable: {mapping_data['total_mappable']}/{len(conventions)} ({mapping_data['total_mappable']/len(conventions)*100:.1f}%)")
    print(f"   ❌ Problèmes: {mapping_data['total_problemes']}")
    print(f"   📄 Détails sauvés: mapping_analyse.json")

if __name__ == "__main__":
    main()