#!/usr/bin/env python3
"""
Script de téléchargement des PDFs de conventions collectives
Crée un nouveau dossier d'extraction pour le 24 septembre 2025
Utilise le fichier de liens intégral pour télécharger tous les PDFs
"""

import json
import requests
import os
import time
import logging
from pathlib import Path
from urllib.parse import urlparse
import sys
import re

# Configuration
EXTRACTION_FOLDER = "extraction_2025-09-24"
JSON_FILE = "attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json"
DELAY_BETWEEN_DOWNLOADS = 0.5  # secondes entre chaque téléchargement
MAX_RETRIES = 3
TIMEOUT = 30  # secondes

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{EXTRACTION_FOLDER}_log.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)

class PDFDownloader:
    def __init__(self, extraction_folder, json_file):
        self.extraction_folder = Path(extraction_folder)
        self.json_file = json_file
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Créer le dossier d'extraction
        self.extraction_folder.mkdir(exist_ok=True)
        logging.info(f"Dossier d'extraction créé : {self.extraction_folder}")
    
    def load_conventions(self):
        """Charge la liste des conventions depuis le fichier JSON"""
        try:
            with open(self.json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logging.info(f"Chargé {len(data)} conventions depuis {self.json_file}")
                return data
        except Exception as e:
            logging.error(f"Erreur lors du chargement du fichier JSON : {e}")
            return []
    
    def clean_filename(self, filename):
        """Nettoie le nom de fichier pour le système de fichiers"""
        # Caractères interdits dans les noms de fichiers
        forbidden_chars = '<>:"/\\|?*'
        for char in forbidden_chars:
            filename = filename.replace(char, '_')
        
        # Remplacer les espaces par des underscores
        filename = re.sub(r'\s+', '_', filename)
        
        # Limiter la longueur du nom de fichier
        if len(filename) > 200:
            filename = filename[:200]
            
        return filename
    
    def fix_url(self, url):
        """Corrige les URLs malformées"""
        if url.startswith('https://,'):
            url = url[8:]  # Enlever "https://,"
        return url.strip()
    
    def download_pdf(self, url, filename, convention_id=None):
        """Télécharge un PDF depuis une URL"""
        try:
            # Corriger l'URL si nécessaire
            url = self.fix_url(url)
            
            if not url or url == " ":
                logging.warning(f"URL vide pour {filename}")
                return False
            
            # Nettoyer le nom de fichier
            clean_filename = self.clean_filename(filename)
            if not clean_filename.endswith('.pdf'):
                clean_filename += '.pdf'
            
            file_path = self.extraction_folder / clean_filename
            
            # Vérifier si le fichier existe déjà
            if file_path.exists():
                logging.info(f"Fichier déjà existant, ignoré : {clean_filename}")
                return True
            
            logging.info(f"Téléchargement : {clean_filename}")
            logging.info(f"URL : {url}")
            
            for attempt in range(MAX_RETRIES):
                try:
                    response = self.session.get(url, timeout=TIMEOUT)
                    response.raise_for_status()
                    
                    # Vérifier que c'est bien un PDF
                    content_type = response.headers.get('content-type', '').lower()
                    if 'pdf' not in content_type and len(response.content) < 1000:
                        logging.warning(f"Contenu suspect pour {clean_filename} (type: {content_type}, taille: {len(response.content)} bytes)")
                    
                    # Sauvegarder le fichier
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    
                    file_size = len(response.content)
                    logging.info(f"✅ Téléchargé : {clean_filename} ({file_size:,} bytes)")
                    return True
                    
                except requests.exceptions.RequestException as e:
                    logging.warning(f"Tentative {attempt + 1}/{MAX_RETRIES} échouée pour {clean_filename}: {e}")
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(2)
                    else:
                        logging.error(f"❌ Échec définitif : {clean_filename}")
                        return False
                        
        except Exception as e:
            logging.error(f"Erreur inattendue lors du téléchargement de {filename}: {e}")
            return False
    
    def run(self):
        """Lance le processus de téléchargement"""
        logging.info("=== DÉBUT DU TÉLÉCHARGEMENT DES PDFs ===")
        logging.info(f"Date : 24 septembre 2025")
        logging.info(f"Dossier de destination : {self.extraction_folder}")
        
        conventions = self.load_conventions()
        if not conventions:
            logging.error("Aucune convention à télécharger")
            return
        
        total_conventions = len(conventions)
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for i, convention in enumerate(conventions, 1):
            try:
                # Extraire les informations de la convention
                idcc = convention.get('IDCC', '').strip()
                nom = convention.get('Nom De la Convention', 'Sans titre').strip()
                url = convention.get('Link', '').strip()
                
                if not url or url == " ":
                    logging.warning(f"[{i}/{total_conventions}] Pas d'URL pour IDCC {idcc}: {nom}")
                    skipped_count += 1
                    continue
                
                # Créer le nom de fichier
                if idcc and idcc != " ":
                    filename = f"{idcc}_{nom}"
                else:
                    filename = nom
                
                logging.info(f"[{i}/{total_conventions}] IDCC {idcc}: {nom}")
                
                if self.download_pdf(url, filename, idcc):
                    success_count += 1
                else:
                    error_count += 1
                
                # Pause entre les téléchargements
                if i < total_conventions:
                    time.sleep(DELAY_BETWEEN_DOWNLOADS)
                    
            except Exception as e:
                logging.error(f"Erreur lors du traitement de la convention {i}: {e}")
                error_count += 1
                continue
        
        # Résumé final
        logging.info("=== RÉSUMÉ DU TÉLÉCHARGEMENT ===")
        logging.info(f"Total conventions : {total_conventions}")
        logging.info(f"Téléchargements réussis : {success_count}")
        logging.info(f"Erreurs : {error_count}")
        logging.info(f"Ignorés (pas d'URL) : {skipped_count}")
        logging.info(f"Taux de réussite : {(success_count/(total_conventions-skipped_count))*100:.1f}%")
        logging.info(f"Dossier de destination : {self.extraction_folder.absolute()}")

if __name__ == "__main__":
    downloader = PDFDownloader(EXTRACTION_FOLDER, JSON_FILE)
    downloader.run()