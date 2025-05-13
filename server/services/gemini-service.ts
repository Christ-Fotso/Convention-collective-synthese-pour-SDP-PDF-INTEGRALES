import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadPDF, extractTextFromPDF as extractPDFText } from './pdf-extractor';

// Répertoire temporaire pour stocker les PDF téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Variables pour les APIs d'IA
let openaiApi: OpenAI | null = null;
let geminiApi: GoogleGenerativeAI | null = null;

export function initializeGeminiApi() {
  // Utiliser la clé API de Google Gemini
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("Erreur: Clé API Google Gemini manquante dans les variables d'environnement");
    return false;
  }
  
  try {
    // Configuration de l'API Gemini avec la clé fournie
    geminiApi = new GoogleGenerativeAI(apiKey);
    console.log("API Gemini (Google) initialisée avec succès");
    
    // Initialisation optionnelle d'OpenAI comme fallback si nécessaire
    if (process.env.OPENAI_API_KEY) {
      openaiApi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("API OpenAI également initialisée comme fallback");
    }
    
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
    
    console.log(`[DEBUG] Tentative de téléchargement du PDF depuis ${conventionUrl}`);
    
    // Vérifier d'abord si nous avons déjà le PDF en cache
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    if (fs.existsSync(filePath)) {
      console.log(`[DEBUG] PDF trouvé en cache: ${filePath}`);
      return filePath;
    }
    
    // Utiliser le service d'extraction pour télécharger le PDF
    return await downloadPDF(conventionUrl, conventionId);
  } catch (error: any) {
    console.error('[DEBUG] Erreur lors du téléchargement du PDF:', error);
    
    // Simuler un PDF pour les tests si le téléchargement échoue
    // Nous utilisons les données existantes pour créer une réponse cohérente
    console.log(`[DEBUG] Création d'un contenu alternatif à partir des données JSON existantes`);
    
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    
    // Si nous n'avons pas pu télécharger mais que nous avons déjà un fichier, utilisons-le
    if (fs.existsSync(filePath)) {
      console.log(`[DEBUG] Utilisation du PDF existant malgré l'erreur de téléchargement`);
      return filePath;
    }
    
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
    
    // Utiliser Gemini pour obtenir une réponse
    if (!geminiApi) {
      throw new Error("Le service Gemini n'est pas initialisé");
    }
    
    // Création du prompt pour Gemini
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.
    
    Utilise les informations suivantes de la convention collective IDCC:${conventionId} pour répondre à ma question.
    
    CONTENU DE LA CONVENTION:
    ${pdfText}
    
    MA QUESTION: ${question}
    
    Réponds de façon précise et concise en français. Cite la référence (article ou section) quand possible.
    Si tu ne trouves pas d'information sur le sujet dans le document, indique clairement que cette information
    n'est pas présente dans la convention collective consultée.
    `;
    
    // Configuration du modèle Gemini
    const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Appel à l'API Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error: any) {
    console.error("Erreur lors du traitement de la question:", error);
    return `Désolé, une erreur s'est produite lors du traitement de votre question: ${error.message}`;
  }
}