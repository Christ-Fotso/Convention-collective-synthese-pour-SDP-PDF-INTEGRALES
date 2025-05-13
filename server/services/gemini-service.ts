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
    // Construire l'URL précise de la convention sur ElNet
    // Format documenté: https://www.elnet-rh.fr/documentation/Document?id=CCNS{conventionId}
    const conventionUrl = `https://www.elnet-rh.fr/documentation/Document?id=CCNS${conventionId}`;
    
    console.log(`[DEBUG] Tentative de téléchargement du PDF depuis ${conventionUrl}`);
    
    // Vérifier d'abord si nous avons déjà le PDF en cache
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    if (fs.existsSync(filePath)) {
      // Vérifier l'âge du fichier - nous ne voulons pas utiliser un cache trop ancien
      const stats = fs.statSync(filePath);
      const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24); // en jours
      
      if (fileAge < 7) { // Si le fichier a moins de 7 jours
        console.log(`[DEBUG] PDF trouvé en cache récent (${fileAge.toFixed(1)} jours): ${filePath}`);
        return filePath;
      } else {
        console.log(`[DEBUG] PDF en cache trop ancien (${fileAge.toFixed(1)} jours), téléchargement d'une version fraîche`);
      }
    }
    
    // Utiliser le service d'extraction pour télécharger le PDF
    return await downloadPDF(conventionUrl, conventionId);
  } catch (error: any) {
    console.error('[DEBUG] Erreur lors du téléchargement du PDF:', error);
    
    // Si le PDF existe déjà dans le cache, on l'utilise même en cas d'erreur de téléchargement
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    if (fs.existsSync(filePath)) {
      console.log(`[DEBUG] Utilisation du PDF existant en cache malgré l'erreur de téléchargement`);
      return filePath;
    }
    
    // Sinon, on propage l'erreur pour arrêter le processus
    throw new Error(`Impossible de télécharger le PDF pour la convention ${conventionId}: ${error.message}`);
  }
}

/**
 * Traite une question avec Gemini en utilisant le contenu du PDF comme contexte
 * 
 * IMPORTANT:
 * - Les réponses sont basées UNIQUEMENT sur le contenu du PDF
 * - Si le PDF ne peut pas être téléchargé ou traité, aucune réponse alternative n'est fournie
 * - L'URL du PDF est spécifique: https://www.elnet-rh.fr/documentation/Document?id=CCNS{conventionId}
 */
/**
 * Traite une question avec Gemini en utilisant le contenu des sections de la convention
 * 
 * Cette version utilise directement les sections existantes au lieu de simuler un téléchargement PDF
 */
export async function askQuestionWithGemini(conventionId: string, question: string): Promise<string> {
  console.log(`[INFO] Traitement de la question pour convention ${conventionId}: "${question}"`);
  
  // 1. Vérifier que l'API Gemini est initialisée
  if (!geminiApi) {
    console.log(`[INFO] Tentative d'initialisation de l'API Gemini`);
    if (!initializeGeminiApi()) {
      const errorMsg = "Le service d'IA n'est pas disponible - clé API manquante ou invalide";
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
  
  try {
    // 2. Récupérer directement le contenu des sections de la convention
    console.log(`[INFO] Récupération des données pour la convention ${conventionId}`);
    
    // Importer la fonction pour récupérer les sections
    const { getSectionsByConvention } = require('../sections-data');
    const sections = getSectionsByConvention(conventionId);
    
    if (!sections || sections.length === 0) {
      const errorMsg = `Aucune donnée disponible pour la convention ${conventionId}`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // 3. Construire le texte complet à partir des sections
    let conventionText = `Convention collective IDCC: ${conventionId}\n\n`;
    sections.forEach((section: { sectionType: string, content: string }) => {
      conventionText += `# ${section.sectionType}\n`;
      conventionText += section.content;
      conventionText += "\n\n";
    });
    
    console.log(`[INFO] Contenu des sections récupéré (${conventionText.length} caractères)`);
    
    // Si pas de texte, on arrête immédiatement
    if (!conventionText || conventionText.trim().length === 0) {
      const errorMsg = `Impossible de récupérer le contenu pour la convention ${conventionId}`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Vérification de sécurité - Gemini doit être initialisé
    if (!geminiApi) {
      throw new Error("API Gemini non initialisée après vérification");
    }
    
    // 4. Préparation du prompt avec instructions strictes
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.
    
    INSTRUCTIONS CRITIQUES:
    - Tu ne dois répondre qu'en utilisant EXCLUSIVEMENT les informations contenues dans le document ci-dessous
    - Ne fais AUCUNE supposition ou déduction qui ne soit pas explicitement mentionnée dans le document
    - Si l'information demandée n'est pas dans le document, réponds clairement "Cette information n'est pas présente dans la convention collective consultée"
    - Ne mens jamais. Si tu n'as pas l'information, dis-le clairement
    - Cite toujours la section ou l'article exact d'où provient l'information
    
    DOCUMENT - Convention collective IDCC:${conventionId}:
    ${pdfText}
    
    QUESTION: ${question}
    
    FORMAT DE RÉPONSE:
    - Réponds de façon précise et concise en français
    - Utilise des listes à puces quand approprié
    - Évite les longues introductions
    - Fournis uniquement des informations provenant du document
    `;
    
    console.log(`[DEBUG] Envoi de la requête à l'API Gemini`);
    
    try {
      // 5. Appel à l'API Gemini avec le modèle gemini-1.5-pro
      const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[DEBUG] Réponse Gemini obtenue (${text.length} caractères)`);
      return text;
    } catch (geminiError: any) {
      console.error(`[DEBUG] Erreur API Gemini:`, geminiError);
      
      // Gestion spéciale pour les textes trop longs
      if (pdfText.length > 60000 && geminiError.message.includes("too long")) {
        console.log(`[DEBUG] Texte trop long (${pdfText.length} caractères), tentative avec texte tronqué`);
        
        // Réduire la taille du contexte
        const shortenedText = pdfText.substring(0, 60000);
        
        const shorterPrompt = `
        Tu es un assistant juridique spécialisé en droit du travail français.
        
        INSTRUCTIONS CRITIQUES:
        - Réponds UNIQUEMENT en te basant sur les informations ci-dessous (extrait partiel de convention collective)
        - Précise que ta réponse est basée sur un extrait partiel si la question semble nécessiter plus de contexte
        - Si l'information n'est pas présente, indique-le clairement
        
        DOCUMENT PARTIEL - Convention collective IDCC:${conventionId} (extrait):
        ${shortenedText}
        
        QUESTION: ${question}
        `;
        
        try {
          const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model.generateContent(shorterPrompt);
          const response = await result.response;
          const text = response.text();
          
          return text + "\n\n(Note: Cette réponse est basée sur un extrait partiel de la convention collective)";
        } catch (secondError: any) {
          console.error(`[DEBUG] Seconde erreur Gemini:`, secondError);
          throw new Error(`Erreur lors de l'analyse de la convention (document trop volumineux): ${secondError.message}`);
        }
      }
      
      // Propager l'erreur originale si ce n'est pas un problème de longueur
      throw new Error(`Erreur lors de l'analyse par l'IA: ${geminiError.message}`);
    }
  } catch (error: any) {
    console.error(`[DEBUG] Erreur critique:`, error);
    throw error; // On propage l'erreur pour que l'API puisse la traiter correctement
  }
}