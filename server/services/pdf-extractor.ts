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
 * Extrait le texte d'un PDF à partir de son URL
 */
export async function extractTextFromURL(url: string, conventionId: string): Promise<string> {
  try {
    // Télécharger le PDF
    const pdfPath = await downloadPDF(url, conventionId);
    
    // Extraire le texte
    const text = await extractTextFromPDF(pdfPath);
    
    // Si le texte est trop grand, le tronquer
    const maxLength = 90000; // Nombre approximatif de caractères pour rester dans les limites de tokens
    if (text.length > maxLength) {
      console.log(`Texte tronqué de ${text.length} à ${maxLength} caractères`);
      return text.substring(0, maxLength) + `\n\n[TEXTE TRONQUÉ - Le document complet contient ${text.length} caractères]`;
    }
    
    return text;
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction du texte depuis l\'URL:', error);
    throw error;
  }
}