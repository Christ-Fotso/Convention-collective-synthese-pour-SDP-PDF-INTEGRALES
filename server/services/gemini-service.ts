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
  console.log(`[DEBUG] Début du traitement de la question: "${question}" pour la convention ${conventionId}`);
  
  if (!geminiApi) {
    console.log(`[DEBUG] Tentative d'initialisation de l'API Gemini`);
    if (!initializeGeminiApi()) {
      console.error(`[DEBUG] Échec de l'initialisation de l'API Gemini`);
      return "Désolé, le service d'IA n'est pas disponible pour le moment. Veuillez vérifier votre clé API.";
    }
  }
  
  try {
    // 1. Télécharger le PDF si nécessaire
    console.log(`[DEBUG] Tentative de récupération du PDF pour la convention ${conventionId}`);
    const pdfPath = await getConventionPDF(conventionId);
    console.log(`[DEBUG] PDF récupéré: ${pdfPath}`);
    
    // 2. Extraire le texte du PDF
    console.log(`[DEBUG] Tentative d'extraction du texte du PDF`);
    const pdfText = await extractPDFText(pdfPath);
    if (!pdfText) {
      console.error(`[DEBUG] Impossible d'extraire le texte du PDF`);
      return "Désolé, je n'ai pas pu extraire le contenu de cette convention collective.";
    }
    console.log(`[DEBUG] Texte extrait avec succès: ${pdfText.length} caractères`);
    
    // Vérifier que Gemini est initialisé
    if (!geminiApi) {
      console.error(`[DEBUG] API Gemini non initialisée après vérification`);
      throw new Error("Le service Gemini n'est pas initialisé");
    }
    
    // Création du prompt pour Gemini avec des instructions plus précises
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.
    
    Utilise les informations suivantes de la convention collective IDCC:${conventionId} pour répondre à ma question.
    
    CONTENU DE LA CONVENTION:
    ${pdfText}
    
    MA QUESTION: ${question}
    
    CONSIGNES IMPORTANTES:
    1. Réponds de façon précise et concise en français.
    2. Cite la référence (article ou section) quand possible.
    3. Si l'information demandée n'est pas dans le document, indique clairement qu'elle n'est pas présente.
    4. Ne fais pas de suppositions sur des articles ou dispositions qui ne sont pas explicitement mentionnés.
    5. Formatage : Utilise des listes à puces ou numérotées pour les réponses comportant plusieurs points.
    6. Privilégie une réponse directe à la question, sans introduction inutile.
    `;
    
    console.log(`[DEBUG] Envoi de la requête à l'API Gemini`);
    
    try {
      // Configuration du modèle Gemini
      const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Appel à l'API Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[DEBUG] Réponse reçue de Gemini: ${text.length} caractères`);
      return text;
    } catch (geminiError: any) {
      console.error(`[DEBUG] Erreur Gemini spécifique:`, geminiError);
      
      // Tentative avec un prompt plus court en cas d'erreur
      if (pdfText.length > 50000) {
        console.log(`[DEBUG] Texte trop long (${pdfText.length} caractères), tentative avec un texte tronqué`);
        const shortenedText = pdfText.substring(0, 50000) + "... [texte tronqué pour respecter les limites]";
        
        const shorterPrompt = `
        Tu es un assistant juridique spécialisé en droit du travail français.
        
        Voici une partie de la convention collective IDCC:${conventionId}:
        ${shortenedText}
        
        MA QUESTION: ${question}
        
        Réponds en français en te basant uniquement sur les informations fournies.
        `;
        
        try {
          const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model.generateContent(shorterPrompt);
          const response = await result.response;
          const text = response.text();
          
          console.log(`[DEBUG] Réponse reçue avec le prompt court: ${text.length} caractères`);
          return text + "\n\n(Note: Cette réponse est basée sur un extrait de la convention car le document complet était trop volumineux)";
        } catch (secondError: any) {
          console.error(`[DEBUG] Seconde erreur Gemini:`, secondError);
          throw secondError;
        }
      } else {
        throw geminiError;
      }
    }
  } catch (error: any) {
    console.error(`[DEBUG] Erreur générale lors du traitement de la question:`, error);
    return `Désolé, une erreur s'est produite lors du traitement de votre question: ${error.message}`;
  }
}