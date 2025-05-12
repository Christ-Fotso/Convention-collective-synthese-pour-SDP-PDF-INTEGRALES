import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import OpenAI from 'openai';
import { downloadPDF, extractTextFromPDF as extractPDFText } from './pdf-extractor';

// Répertoire temporaire pour stocker les PDF téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Initialisation de l'API OpenAI
let openaiApi: OpenAI | null = null;

export function initializeGeminiApi() {
  // Utiliser la clé API OpenAI qui est déjà configurée
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Erreur: Clé API OpenAI manquante dans les variables d'environnement");
    return false;
  }
  
  try {
    // Configuration de l'API OpenAI avec la clé disponible
    openaiApi = new OpenAI({ apiKey });
    console.log("API OpenAI initialisée avec succès (pour le service de chat)");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'API OpenAI:", error);
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
  if (!openaiApi) {
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
    
    // Utiliser OpenAI pour obtenir une réponse
    if (!openaiApi) {
      throw new Error("Le service OpenAI n'est pas initialisé");
    }
    
    // Création du prompt
    const systemPrompt = `Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.`;
    
    const userPrompt = `
    Utilise les informations suivantes de la convention collective IDCC:${conventionId} pour répondre à ma question.
    
    CONTENU DE LA CONVENTION:
    ${pdfText}
    
    MA QUESTION: ${question}
    
    Réponds de façon précise et concise en français. Cite la référence (article ou section) quand possible.
    Si tu ne trouves pas d'information sur le sujet dans le document, indique clairement que cette information
    n'est pas présente dans la convention collective consultée.
    `;
    
    // Appel à l'API OpenAI
    const result = await openaiApi.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000
    });
    
    const text = result.choices[0].message.content || "";
    
    return text;
  } catch (error: any) {
    console.error("Erreur lors du traitement de la question:", error);
    return `Désolé, une erreur s'est produite lors du traitement de votre question: ${error.message}`;
  }
}