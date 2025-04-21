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
 * Extrait le texte d'un fichier PDF en utilisant une méthode simple basée sur le stdout
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Utilise la commande 'strings' pour extraire le texte lisible du PDF
    // C'est une approche simple mais souvent efficace pour les fichiers PDF standards
    const { stdout } = await execPromise(`strings "${filePath}"`);
    
    // Nettoyage basique du texte
    let text = stdout
      .replace(/[\r\n]+/g, '\n')  // Normaliser les sauts de ligne
      .replace(/\s{2,}/g, ' ')    // Remplacer les espaces multiples par un seul
      .trim();

    // Vérification minimale du contenu
    if (text.length < 100) {
      throw new Error("Extraction de texte insuffisante");
    }
    
    console.log(`Extraction réussie: ${text.length} caractères extraits`);
    return text;
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction du texte:', error);
    
    // Méthode de secours - lire le fichier et essayer de récupérer du texte ASCII
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
      
      console.log(`Extraction de secours: ${fallbackText.length} caractères extraits`);
      return fallbackText;
    } catch (secondaryError) {
      throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
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
    
    // Extraire le texte complet
    const fullText = await extractTextFromPDF(pdfPath);
    console.log(`Texte complet extrait: ${fullText.length} caractères`);
    
    // Mot-clés par défaut pour les recherches pertinentes (à adapter selon les besoins)
    const defaultKeywords = [
      "congés pour événements familiaux", 
      "congé familial", 
      "mariage", 
      "pacs", 
      "naissance", 
      "décès", 
      "article", 
      "titre", 
      "chapitre",
      "classification", 
      "emploi", 
      "coefficient", 
      "salaire", 
      "indemnité",
      "licenciement", 
      "préavis", 
      "durée du travail",
      "repos",
      "maladie",
      "accident"
    ];
    
    // GPT-4.1 a une capacité de 1 million de tokens, ce qui est amplement suffisant pour la plupart des conventions
    // Nous allons envoyer le texte complet ou, si vraiment trop grand (>700K caractères), le texte avec priorité aux sections pertinentes
    const maxLength = 700000; // GPT-4.1 peut gérer environ 1M tokens soit ~700K caractères
    if (fullText.length > maxLength) {
      console.log(`Texte extrêmement volumineux (${fullText.length} caractères), priorisation des parties les plus pertinentes...`);
      return extractRelevantSections(fullText, keywords || defaultKeywords, 10000); // Contexte plus large
    }
    
    // Sinon, utiliser le texte complet
    return fullText;
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction du texte depuis l\'URL:', error);
    throw error;
  }
}