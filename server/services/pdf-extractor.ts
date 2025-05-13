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
 * IMPORTANT: Cette fonction doit être remplacée par une véritable extraction de PDF
 * dans la version de production. Actuellement, elle utilise les données structurées
 * comme simulation, uniquement pour le développement.
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Le fichier PDF n'existe pas: ${pdfPath}`);
  }
  
  try {
    console.log(`[DEBUG] Extraction du PDF: ${pdfPath}`);
    
    const pdfBasename = path.basename(pdfPath);
    const conventionId = pdfBasename.replace('convention_', '').replace('.pdf', '');
    
    console.log(`[DEBUG] Extraction pour IDCC: ${conventionId} - FICHIER PDF: ${pdfPath}`);
    
    // TODO: Implémenter une véritable extraction de texte du PDF
    // Exemple avec pdfjs-dist:
    //
    // const pdfjsLib = require('pdfjs-dist');
    // const loadingTask = pdfjsLib.getDocument(pdfPath);
    // const pdf = await loadingTask.promise;
    // let fullText = '';
    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const content = await page.getTextContent();
    //   const strings = content.items.map(item => item.str);
    //   fullText += strings.join(' ') + '\n';
    // }
    // return fullText;
    
    // ===== SOLUTION TEMPORAIRE =====
    // Pour cette phase de développement seulement, on utilise les données structurées
    // Cette partie doit être remplacée par l'extraction réelle de PDF en production
    
    // Option 1: Utiliser les sections structurées (le plus fiable)
    try {
      const { getSectionsByConvention } = require('../sections-data');
      const sections = getSectionsByConvention(conventionId);
      
      if (sections && sections.length > 0) {
        console.log(`[DEBUG] ${sections.length} sections trouvées pour la convention ${conventionId}`);
        
        // Construire un texte complet avec toutes les sections
        let fullText = `Convention collective IDCC: ${conventionId}\n\n`;
        
        sections.forEach((section: { sectionType: string, content: string }) => {
          fullText += `# ${section.sectionType}\n`;
          fullText += section.content;
          fullText += "\n\n";
        });
        
        console.log(`[DEBUG] Données extraites: ${fullText.length} caractères`);
        return fullText;
      }
    } catch (error) {
      console.error(`[DEBUG] Erreur avec les sections structurées:`, error);
    }
    
    // Si nous arrivons ici, c'est que les sections n'ont pas été trouvées
    throw new Error(
      `Échec de l'extraction de texte pour la convention ${conventionId}. ` +
      `L'extraction réelle de PDF n'est pas encore implémentée et aucune donnée structurée n'est disponible.`
    );
  } catch (error: any) {
    console.error(`[DEBUG] Erreur critique lors de l'extraction du PDF:`, error);
    throw new Error(`Impossible d'extraire le texte du PDF pour IDCC ${path.basename(pdfPath).replace('convention_', '').replace('.pdf', '')}: ${error.message}`);
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