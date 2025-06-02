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
 * 
 * Utilise pdfjs-dist pour extraire le texte réel d'un fichier PDF,
 * sans dépendre des données structurées.
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Le fichier PDF n'existe pas: ${pdfPath}`);
  }
  
  try {
    const pdfBasename = path.basename(pdfPath);
    const conventionId = pdfBasename.replace('convention_', '').replace('.pdf', '');
    
    console.log(`[INFO] Extraction du texte du PDF pour convention ${conventionId}: ${pdfPath}`);
    
    // Chargement de pdfjs-dist correctement (sans require)
    // Importation dynamique (ES modules)
    const pdfjsLib = await import('pdfjs-dist');
    
    // Désactivation des workers car ils causent des problèmes dans certains environnements
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    console.log(`[INFO] Chargement du PDF...`);
    const loadingTask = pdfjsLib.getDocument({ url: pdfPath });
    const pdf = await loadingTask.promise;
    
    console.log(`[INFO] PDF chargé: ${pdf.numPages} pages`);
    
    let fullText = `Convention collective IDCC: ${conventionId}\n\n`;
    
    // Extraction page par page
    for (let i = 1; i <= pdf.numPages; i++) {
      if (i % 10 === 0) {
        console.log(`[INFO] Extraction en cours... page ${i}/${pdf.numPages}`);
      }
      
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Extraire le texte en préservant les sauts de ligne
      const texts = [];
      let lastY;
      
      for (const item of content.items) {
        if ('transform' in item && 'str' in item) {
          // Vérification des propriétés pour un TextItem
          if (lastY !== item.transform[5] && texts.length > 0) {
            texts.push('\n'); // Ajouter un saut de ligne quand on change de ligne
          }
          
          lastY = item.transform[5];
          texts.push(item.str);
        }
      }
      
      fullText += texts.join(' ') + '\n\n';
    }
    
    console.log(`[INFO] Extraction terminée: ${fullText.length} caractères extraits`);
    return fullText;
  } catch (error: any) {
    console.error(`[ERROR] Échec de l'extraction du PDF:`, error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
  }
}

/**
 * Télécharge un PDF depuis une URL et en extrait le texte
 * (Fonction utilisée par les services existants)
 */
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    console.log(`[PDF] Début de l'extraction pour URL: ${url}`);
    
    // Créer un hash de l'URL pour le nom du fichier
    const urlHash = createHash('md5').update(url).digest('hex');
    const tempFilePath = path.join(TEMP_DIR, `${urlHash}.pdf`);
    
    console.log(`[PDF] Téléchargement vers: ${tempFilePath}`);
    
    // Télécharger le PDF
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`[PDF] PDF téléchargé: ${response.data.byteLength} bytes`);
    
    fs.writeFileSync(tempFilePath, Buffer.from(response.data));
    console.log(`[PDF] Fichier sauvegardé, début de l'extraction du texte`);
    
    // Extraire le texte
    const text = await extractTextFromPDF(tempFilePath);
    console.log(`[PDF] Extraction réussie: ${text.length} caractères`);
    
    return text;
  } catch (error: any) {
    console.error(`[PDF] Erreur lors de l'extraction du texte depuis l'URL:`, error);
    console.error(`[PDF] Stack trace:`, error.stack);
    throw new Error(`Impossible d'extraire le texte depuis l'URL: ${error.message}`);
  }
}