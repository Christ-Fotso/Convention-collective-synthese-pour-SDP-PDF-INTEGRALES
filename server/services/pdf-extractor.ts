import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Dossier temporaire pour stocker les PDFs téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Télécharge un PDF depuis une URL et retourne le chemin du fichier local
 */
async function downloadPDF(url: string, conventionId: string): Promise<string> {
  try {
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(filePath)) {
      console.log(`PDF déjà téléchargé pour la convention ${conventionId}`);
      return filePath;
    }
    
    console.log(`Téléchargement du PDF pour la convention ${conventionId} depuis ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log(`PDF téléchargé et sauvegardé: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Extrait le texte d'un fichier PDF en utilisant pdftotext (méthode plus précise)
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Utiliser pdftotext pour une extraction de texte précise
    const txtFilePath = filePath.replace('.pdf', '.txt');
    
    console.log(`Extraction du texte avec pdftotext pour ${filePath}`);
    
    // Utiliser pdftotext avec des options pour préserver la mise en page
    await execPromise(`pdftotext -layout -nopgbrk "${filePath}" "${txtFilePath}"`);
    
    // Lire le fichier texte extrait
    if (!fs.existsSync(txtFilePath)) {
      throw new Error(`Le fichier texte extrait n'existe pas: ${txtFilePath}`);
    }
    
    // Lire le contenu du fichier texte
    const text = fs.readFileSync(txtFilePath, 'utf8')
      .replace(/\f/g, '\n') // Remplacer les sauts de page par des sauts de ligne
      .replace(/[\r\n]{3,}/g, '\n\n') // Normaliser les blocs de sauts de ligne
      .trim();
    
    // Vérification de la qualité du contenu
    if (text.length < 1000) {
      console.warn(`Extraction pdftotext insuffisante: seulement ${text.length} caractères - essai de la méthode strings`);
      throw new Error("Extraction de texte insuffisante avec pdftotext");
    }
    
    console.log(`Extraction pdftotext réussie: ${text.length} caractères extraits`);
    
    // Supprimer le fichier temporaire txt
    fs.unlinkSync(txtFilePath);
    
    return text;
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction du texte avec pdftotext:', error);
    
    try {
      // Méthode alternative en cas d'échec de pdftotext: utiliser strings
      console.log("Tentative d'extraction avec la commande 'strings'");
      const { stdout } = await execPromise(`strings "${filePath}"`);
      
      // Nettoyage basique du texte
      let text = stdout
        .replace(/[\r\n]+/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      if (text.length < 100) {
        throw new Error("Extraction de texte insuffisante avec strings");
      }
      
      console.log(`Extraction strings réussie: ${text.length} caractères extraits`);
      return text;
    } catch (stringsError) {
      console.error('Erreur lors de l\'extraction avec strings:', stringsError);
      
      // Méthode de dernier recours - lire le fichier binaire et extraire le texte ASCII
      try {
        const buffer = fs.readFileSync(filePath);
        // Convertir en texte et filtrer les caractères non-imprimables
        let fallbackText = '';
        for (let i = 0; i < buffer.length; i++) {
          const byte = buffer[i];
          // Garder uniquement les caractères ASCII imprimables
          if (byte >= 32 && byte <= 126) {
            fallbackText += String.fromCharCode(byte);
          } else if (byte === 10 || byte === 13) {
            fallbackText += '\n';
          }
        }
        
        // Nettoyage supplémentaire
        fallbackText = fallbackText
          .replace(/[\r\n]+/g, '\n')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        console.log(`Extraction ASCII de secours: ${fallbackText.length} caractères extraits`);
        return fallbackText;
      } catch (finalError) {
        throw new Error(`Impossible d'extraire le texte du PDF avec toutes les méthodes disponibles`);
      }
    }
  }
}

/**
 * Recherche du contenu spécifique dans un grand texte
 * @param text Texte complet à analyser
 * @param keywords Mots-clés pour la recherche, en ordre de priorité
 * @param contextSize Nombre de caractères à extraire autour de chaque occurrence
 * @returns Un texte contenant les sections pertinentes
 */
function extractRelevantSections(text: string, keywords: string[], contextSize: number = 5000): string {
  // Résultat final
  let relevantText = "";
  let totalExtracted = 0;
  const maxTotalExtract = 90000; // Maximum total à extraire
  
  // Pour chaque mot-clé, dans l'ordre de priorité
  for (const keyword of keywords) {
    if (totalExtracted >= maxTotalExtract) break; // On a atteint la limite
    
    // Convertir en minuscules pour la recherche insensible à la casse
    const textLower = text.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Trouver toutes les occurrences du mot-clé
    let index = textLower.indexOf(keywordLower);
    while (index !== -1 && totalExtracted < maxTotalExtract) {
      // Déterminer le début et la fin du contexte
      const start = Math.max(0, index - contextSize/2);
      const end = Math.min(text.length, index + keywordLower.length + contextSize/2);
      
      // Extraire le contexte
      const sectionText = text.substring(start, end);
      
      // Ajouter au résultat si pas encore extrait
      if (!relevantText.includes(sectionText)) {
        relevantText += "\n\n--- SECTION PERTINENTE ---\n" + sectionText;
        totalExtracted += sectionText.length;
      }
      
      // Passer à l'occurrence suivante
      index = textLower.indexOf(keywordLower, index + 1);
    }
  }
  
  // Si rien n'a été trouvé ou trop peu de texte
  if (totalExtracted < 10000 && text.length > 10000) {
    // Prendre le début et un peu de la fin
    relevantText = text.substring(0, 60000) + "\n\n...\n\n" + text.substring(text.length - 30000);
    totalExtracted = 90000;
  } else if (relevantText.length === 0) {
    // Si toujours rien, prendre simplement le début
    relevantText = text.substring(0, Math.min(text.length, maxTotalExtract));
    totalExtracted = relevantText.length;
  }
  
  return relevantText + `\n\n[TEXTE EXTRAIT - ${totalExtracted} caractères sur ${text.length} au total]`;
}

/**
 * Extrait le texte d'un PDF à partir de son URL
 */
export async function extractTextFromURL(url: string, conventionId: string, keywords?: string[]): Promise<string> {
  try {
    // Télécharger le PDF
    const pdfPath = await downloadPDF(url, conventionId);
    
    // Extraire le texte complet sans aucune limite
    const fullText = await extractTextFromPDF(pdfPath);
    console.log(`Texte complet extrait: ${fullText.length} caractères - Envoi de l'intégralité du contenu`);
    
    // Retourner le texte complet sans aucune troncature
    return fullText;
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction du texte depuis l\'URL:', error);
    throw error;
  }
}