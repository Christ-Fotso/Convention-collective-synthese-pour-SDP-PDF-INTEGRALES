import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

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
      // Récupérer le fichier TXT local directement
      const txtFilePath = this.findTxtFile(conventionId);
      if (!txtFilePath) {
        throw new Error(`Fichier TXT non trouvé pour la convention ${conventionId}`);
      }

      console.log(`[TXT] Lecture directe du fichier TXT pour convention ${conventionId}`);
      const txtContent = fs.readFileSync(txtFilePath, 'utf-8');
      
      // Nettoyer le contenu en gardant seulement le texte utile
      const lines = txtContent.split('\n');
      const contentLines = lines.filter(line => {
        // Filtrer les lignes vides et les métadonnées
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('Convention collective nationale') &&
               !trimmed.startsWith('IDCC :') &&
               !trimmed.startsWith('Brochure :') &&
               !trimmed.startsWith('Lien :') &&
               !trimmed.startsWith('Date de consolidation :') &&
               !trimmed.startsWith('Texte de base :');
      });
      
      const cleanedContent = contentLines.join('\n').trim();
      
      if (!cleanedContent || cleanedContent.length < 100) {
        throw new Error(`Contenu insuffisant dans le fichier TXT pour la convention ${conventionId}`);
      }
      
      console.log(`[TXT] Texte lu avec succès: ${cleanedContent.length} caractères`);
      return cleanedContent;
    } catch (error) {
      console.error(`[TXT] Erreur lors de la lecture du fichier pour ${conventionId}:`, error);
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