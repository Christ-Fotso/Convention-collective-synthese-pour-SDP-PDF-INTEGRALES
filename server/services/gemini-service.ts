import { GoogleGenerativeAI } from "@google/generative-ai";
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { downloadPDF, extractTextFromPDF as extractPDFText } from './pdf-extractor';

// Répertoire temporaire pour stocker les PDF téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Initialisation de l'API Gemini
let geminiApi: GoogleGenerativeAI | null = null;

export function initializeGeminiApi() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("Erreur: XAI_API_KEY manquante dans les variables d'environnement");
    return false;
  }
  
  try {
    geminiApi = new GoogleGenerativeAI(apiKey);
    console.log("API Gemini initialisée avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'API Gemini:", error);
    return false;
  }
}

/**
 * Télécharge le PDF d'une convention depuis ElNet
 */
async function getConventionPDF(conventionId: string): Promise<string> {
  try {
    // Construire l'URL de la convention sur ElNet
    const conventionUrl = `https://www.elnet-rh.fr/documentation/Document?id=CCNS${conventionId}`;
    
    // Utiliser le service d'extraction pour télécharger le PDF
    return await downloadPDF(conventionUrl, conventionId);
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Traite une question avec Gemini en utilisant le contenu du PDF comme contexte
 */
export async function askQuestionWithGemini(conventionId: string, question: string): Promise<string> {
  if (!geminiApi) {
    if (!initializeGeminiApi()) {
      return "Désolé, le service d'IA n'est pas disponible pour le moment.";
    }
  }
  
  try {
    // 1. Télécharger le PDF si nécessaire
    const pdfPath = await getConventionPDF(conventionId);
    
    // 2. Extraire le texte du PDF
    const pdfText = await extractPDFText(pdfPath);
    if (!pdfText) {
      return "Désolé, je n'ai pas pu extraire le contenu de cette convention collective.";
    }
    
    // 3. Appeler Gemini pour obtenir une réponse
    if (!geminiApi) {
      throw new Error("Le service Gemini n'est pas initialisé");
    }
    
    const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail et conventions collectives.
    Utilise les informations suivantes de la convention collective IDCC:${conventionId} pour répondre:
    
    ${pdfText}
    
    Question: ${question}
    
    Réponds de façon précise et concise en français. Cite la référence (article ou section) quand possible.
    Si tu ne trouves pas d'information sur le sujet dans le document, indique clairement que cette information
    n'est pas présente dans la convention collective consultée.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error: any) {
    console.error("Erreur lors du traitement de la question:", error);
    return `Désolé, une erreur s'est produite lors du traitement de votre question: ${error.message}`;
  }
}