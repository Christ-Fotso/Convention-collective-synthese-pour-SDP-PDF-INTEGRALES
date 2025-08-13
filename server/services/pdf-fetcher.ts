import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as pdfParse from 'pdf-parse';

interface ConventionData {
  id: string;
  name: string;
  url: string;
}

class PDFFetcher {
  private cacheDir = path.join(process.cwd(), 'temp', 'pdf-cache');
  private textCacheDir = path.join(process.cwd(), 'temp', 'text-cache');

  constructor() {
    // Créer les dossiers de cache s'ils n'existent pas
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    if (!fs.existsSync(this.textCacheDir)) {
      fs.mkdirSync(this.textCacheDir, { recursive: true });
    }
  }

  async getConventionText(conventionId: string): Promise<string> {
    try {
      // Vérifier si le texte est déjà en cache
      const textCachePath = path.join(this.textCacheDir, `${conventionId}.txt`);
      if (fs.existsSync(textCachePath)) {
        console.log(`[PDF] Utilisation du cache texte pour convention ${conventionId}`);
        return fs.readFileSync(textCachePath, 'utf-8');
      }

      // Récupérer l'URL depuis les fichiers TXT
      const txtFilePath = this.findTxtFile(conventionId);
      if (!txtFilePath) {
        throw new Error(`Fichier TXT non trouvé pour la convention ${conventionId}`);
      }

      const txtContent = fs.readFileSync(txtFilePath, 'utf-8');
      const lines = txtContent.split('\n');
      const urlLine = lines.find(line => line.startsWith('Lien :'));
      
      if (!urlLine) {
        throw new Error(`URL non trouvée dans le fichier TXT pour la convention ${conventionId}`);
      }

      const pdfUrl = urlLine.replace('Lien :', '').trim();
      console.log(`[PDF] Téléchargement du PDF depuis: ${pdfUrl}`);

      // Télécharger et extraire le texte du PDF
      const text = await this.downloadAndExtractPDF(pdfUrl, conventionId);
      
      // Sauvegarder en cache
      fs.writeFileSync(textCachePath, text, 'utf-8');
      
      return text;
    } catch (error) {
      console.error(`[PDF] Erreur lors de la récupération du texte pour ${conventionId}:`, error);
      throw error;
    }
  }

  private findTxtFile(conventionId: string): string | null {
    const conventionsDir = path.join(process.cwd(), 'Conventions_Collectives_TXT');
    
    if (!fs.existsSync(conventionsDir)) {
      return null;
    }

    const files = fs.readdirSync(conventionsDir);
    const txtFile = files.find(file => file.includes(`IDCC${conventionId}.txt`));
    
    return txtFile ? path.join(conventionsDir, txtFile) : null;
  }

  private async downloadAndExtractPDF(url: string, conventionId: string): Promise<string> {
    try {
      // Vérifier si le PDF est déjà en cache
      const pdfCachePath = path.join(this.cacheDir, `${conventionId}.pdf`);
      
      let pdfBuffer: Buffer;
      
      if (fs.existsSync(pdfCachePath)) {
        console.log(`[PDF] Utilisation du cache PDF pour convention ${conventionId}`);
        pdfBuffer = fs.readFileSync(pdfCachePath);
      } else {
        console.log(`[PDF] Téléchargement du PDF pour convention ${conventionId}`);
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 secondes
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        pdfBuffer = Buffer.from(response.data);
        
        // Sauvegarder en cache
        fs.writeFileSync(pdfCachePath, pdfBuffer);
      }

      // Extraire le texte du PDF
      console.log(`[PDF] Extraction du texte pour convention ${conventionId}`);
      const pdfData = await pdfParse(pdfBuffer);
      
      return pdfData.text;
    } catch (error) {
      console.error(`[PDF] Erreur lors du téléchargement/extraction:`, error);
      throw error;
    }
  }

  // Méthode pour nettoyer le cache
  clearCache() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true });
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      if (fs.existsSync(this.textCacheDir)) {
        fs.rmSync(this.textCacheDir, { recursive: true });
        fs.mkdirSync(this.textCacheDir, { recursive: true });
      }
      console.log('[PDF] Cache nettoyé');
    } catch (error) {
      console.error('[PDF] Erreur lors du nettoyage du cache:', error);
    }
  }
}

export const pdfFetcher = new PDFFetcher();