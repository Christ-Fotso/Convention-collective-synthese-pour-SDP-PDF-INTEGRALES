#!/usr/bin/env python3
"""
Créer un import des conventions avec mapping correct pour la base de données
"""

import json
import re
from pathlib import Path

def clean_filename_for_id(filename):
    """Nettoie le nom pour créer un ID unique"""
    forbidden_chars = '<>:"/\\|?*'
    for char in forbidden_chars:
        filename = filename.replace(char, '_')
    filename = re.sub(r'\s+', '_', filename)
    filename = filename.replace('(', '_').replace(')', '_')
    filename = re.sub(r'_+', '_', filename)  # Remplacer multiples underscores
    filename = filename.strip('_')  # Enlever underscores en début/fin
    if len(filename) > 100:  # Limiter pour les IDs
        filename = filename[:100]
    return filename

def main():
    print("🔧 CRÉATION DU MAPPING POUR LA BASE DE DONNÉES")
    print("=" * 60)
    
    # Charger les données JSON
    with open('attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json', 'r', encoding='utf-8') as f:
        conventions = json.load(f)
    
    # Créer le mapping pour l'import
    conventions_for_db = []
    
    for conv in conventions:
        idcc = conv.get('IDCC', '').strip()
        nom = conv.get('Nom De la Convention', '').strip()
        url = conv.get('Link', '').strip()
        
        if not nom or not url:
            continue
            
        # Déterminer l'ID de la convention
        if idcc and idcc != ' ':
            # Convention avec IDCC - utiliser l'IDCC
            convention_id = idcc
            filename_pattern = f"{idcc}_{nom}"
        else:
            # Convention sans IDCC - utiliser le nom nettoyé
            convention_id = clean_filename_for_id(nom)
            filename_pattern = nom
            
        conventions_for_db.append({
            'id': convention_id,
            'name': nom,
            'url': url,
            'has_idcc': bool(idcc and idcc != ' '),
            'filename_pattern': filename_pattern,
            'idcc': idcc if idcc and idcc != ' ' else None
        })
    
    # Trier pour avoir d'abord les conventions avec IDCC
    conventions_for_db.sort(key=lambda x: (not x['has_idcc'], x['id']))
    
    print(f"📋 Conventions préparées pour import: {len(conventions_for_db)}")
    print(f"   • Avec IDCC: {len([c for c in conventions_for_db if c['has_idcc']])}")
    print(f"   • Sans IDCC: {len([c for c in conventions_for_db if not c['has_idcc']])}")
    print()
    
    print("✅ EXEMPLES DE MAPPING:")
    print("Conventions AVEC IDCC:")
    for conv in conventions_for_db[:5]:
        if conv['has_idcc']:
            print(f"   ID: {conv['id']} → PDF: {conv['filename_pattern']}.pdf")
    
    print("\nConventions SANS IDCC:")
    for conv in conventions_for_db:
        if not conv['has_idcc']:
            print(f"   ID: {conv['id']} → PDF: {conv['filename_pattern']}.pdf")
            break
    
    # Sauvegarder le mapping
    with open('conventions_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(conventions_for_db, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Mapping sauvegardé: conventions_mapping.json")
    print()
    
    print("🔑 GUIDE D'UTILISATION POUR LE CHATBOT:")
    print("=" * 60)
    print("1. Dans l'interface utilisateur:")
    print("   - Afficher le nom complet de la convention")
    print("   - En arrière-plan, utiliser l'ID pour chercher le PDF")
    print()
    print("2. Pour trouver le PDF correspondant:")
    print("   - Si has_idcc=true → chercher {idcc}_{nom}.pdf")
    print("   - Si has_idcc=false → chercher {nom_nettoye}.pdf")
    print()
    print("3. L'utilisateur ne voit que le nom, jamais l'ID technique")
    print("   Exemple: 'Assurances : courtage' (pas IDCC 2247)")

if __name__ == "__main__":
    main()