import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { createHash } from 'crypto';

// Répertoire temporaire pour stocker les PDF téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Télécharge un PDF depuis une URL
 */
export async function downloadPDF(url: string, conventionId: string): Promise<string> {
  try {
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    
    // Vérifier si le fichier existe déjà et a été téléchargé récemment (moins de 7 jours)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24); // en jours
      if (fileAge < 7) {
        console.log(`Utilisation du PDF en cache pour la convention ${conventionId}`);
        return filePath;
      }
    }
    
    // Télécharger le PDF
    console.log(`Téléchargement du PDF pour la convention ${conventionId} depuis ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log(`PDF téléchargé et sauvegardé: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error(`Erreur lors du téléchargement du PDF:`, error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Le fichier PDF n'existe pas: ${pdfPath}`);
  }
  
  try {
    // Simuler l'extraction de texte pour le moment
    // Dans une version complète, utiliser une bibliothèque d'extraction de texte PDF
    // comme pdf.js-extract ou autre qui fonctionne bien dans Node.js
    
    console.log(`Extraction simulée du PDF: ${pdfPath}`);
    
    // Retourner un message simulé avec l'ID du PDF
    const pdfBasename = path.basename(pdfPath);
    return `Contenu extrait du PDF: ${pdfBasename}\n\nTexte simulé pour démonstration du chatbot.\nCe contenu sera remplacé par le véritable texte extrait du PDF dans une implémentation complète.`;
  } catch (error: any) {
    console.error(`Erreur lors de l'extraction du texte du PDF:`, error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
  }
}

/**
 * Télécharge un PDF depuis une URL et en extrait le texte
 * (Fonction utilisée par les services existants)
 */
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    // Créer un hash de l'URL pour le nom du fichier
    const urlHash = createHash('md5').update(url).digest('hex');
    const tempFilePath = path.join(TEMP_DIR, `${urlHash}.pdf`);
    
    // Télécharger le PDF
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(tempFilePath, Buffer.from(response.data));
    
    // Extraire le texte
    const text = await extractTextFromPDF(tempFilePath);
    
    return text;
  } catch (error: any) {
    console.error(`Erreur lors de l'extraction du texte depuis l'URL:`, error);
    throw new Error(`Impossible d'extraire le texte depuis l'URL: ${error.message}`);
  }
}