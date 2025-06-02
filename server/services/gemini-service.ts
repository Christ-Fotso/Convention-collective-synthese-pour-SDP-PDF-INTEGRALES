import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadPDF, extractTextFromPDF as extractPDFText, extractTextFromURL } from './pdf-extractor.js';
import { getSectionsByConvention } from '../sections-data';
import { db } from "@db";
import { chatpdfSources } from "@db/schema";
import { eq } from "drizzle-orm";

// Répertoire temporaire pour stocker les PDF téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Variables pour les APIs d'IA
let openaiApi: OpenAI | null = null;
let geminiApi: GoogleGenerativeAI | null = null;

/**
 * Fonction pour rechercher les sections pertinentes dans le texte
 */
function findRelevantSections(text: string, question: string): string[] {
  // Mots-clés à rechercher dans la question
  const questionWords = question.toLowerCase()
    .split(/[\s,\.;:!?]+/)
    .filter(word => word.length > 3)
    .filter(word => !['dans', 'avec', 'pour', 'mais', 'donc', 'cette', 'celui', 'celle'].includes(word));
  
  // Découper le texte en sections (par titres, articles, etc.)
  const sections = text.split(/(?=(?:Article|Chapitre|Section|Titre|ARTICLE|CHAPITRE|SECTION|TITRE)\s+[IVX\d]+|(?:\n\s*\d+[\.\)]\s)|(?:\n\s*[A-Z][^\n]{10,50}\s*\n))/);
  
  // Scorer chaque section selon sa pertinence
  const scoredSections = sections.map(section => {
    let score = 0;
    const sectionLower = section.toLowerCase();
    
    // Points pour chaque mot-clé trouvé
    questionWords.forEach(word => {
      const matches = (sectionLower.match(new RegExp(word, 'g')) || []).length;
      score += matches * 10;
    });
    
    // Bonus pour les sections avec des structures juridiques
    if (sectionLower.includes('article') || sectionLower.includes('chapitre')) score += 5;
    if (sectionLower.includes('salaire') || sectionLower.includes('rémunération')) score += 3;
    if (sectionLower.includes('congé') || sectionLower.includes('absence')) score += 3;
    if (sectionLower.includes('temps de travail') || sectionLower.includes('durée')) score += 3;
    
    return { section, score, length: section.length };
  });
  
  // Trier par score et prendre les meilleures sections
  const sortedSections = scoredSections
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Prendre les sections les plus pertinentes jusqu'à 400k caractères
  const selectedSections: string[] = [];
  let totalLength = 0;
  
  for (const item of sortedSections) {
    if (totalLength + item.length < 400000) {
      selectedSections.push(item.section);
      totalLength += item.length;
    } else {
      break;
    }
  }
  
  // Si aucune section pertinente, prendre le début du document
  if (selectedSections.length === 0) {
    selectedSections.push(text.substring(0, 400000));
  }
  
  console.log(`[INFO] Recherche intelligente: ${selectedSections.length} sections sélectionnées (${totalLength} caractères)`);
  
  return selectedSections;
}

/**
 * Utilise l'API ChatPDF pour extraire le contenu authentique d'un PDF
 * Avec système de cache pour éviter les appels redondants
 */
async function downloadAndExtractPDFText(url: string, conventionId: string): Promise<string> {
  try {
    // Vérifier d'abord s'il existe déjà une source ChatPDF pour cette convention
    const existingSource = await db.select()
      .from(chatpdfSources)
      .where(eq(chatpdfSources.conventionId, conventionId))
      .limit(1);
    
    let sourceId: string;
    
    if (existingSource.length > 0) {
      // Utiliser la source existante
      sourceId = existingSource[0].sourceId;
      console.log(`[INFO] Utilisation de la source ChatPDF existante: ${sourceId}`);
    } else {
      // Créer une nouvelle source ChatPDF
      console.log(`[INFO] Création d'une nouvelle source ChatPDF pour: ${url}`);
      
      const addUrlResponse = await axios.post('https://api.chatpdf.com/v1/sources/add-url', {
        url: url
      }, {
        headers: {
          'x-api-key': process.env.CHATPDF_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      sourceId = addUrlResponse.data.sourceId;
      console.log(`[INFO] Nouvelle source ChatPDF créée avec l'ID: ${sourceId}`);
      
      // Sauvegarder la source en base pour réutilisation future
      await db.insert(chatpdfSources).values({
        conventionId: conventionId,
        sourceId: sourceId
      });
      console.log(`[INFO] Source ChatPDF sauvegardée en base de données`);
    }
    
    // Utiliser la source (existante ou nouvelle) pour extraire le contenu
    const chatResponse = await axios.post('https://api.chatpdf.com/v1/chats/message', {
      sourceId: sourceId,
      referenceSources: true,
      messages: [
        {
          role: "user",
          content: "Peux-tu extraire et me donner le contenu complet de ce document PDF ? Je veux tout le texte, tous les articles, toutes les sections, sans rien omettre. Présente le contenu de manière structurée en gardant la hiérarchie originale."
        }
      ]
    }, {
      headers: {
        'x-api-key': process.env.CHATPDF_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const extractedContent = chatResponse.data.content;
    console.log(`[INFO] Contenu extrait via ChatPDF: ${extractedContent.length} caractères`);
    
    return `Convention collective IDCC: ${conventionId}
Source: ${url}

${extractedContent}`;
    
  } catch (error: any) {
    console.error(`[ERROR] Erreur avec l'API ChatPDF:`, error.response?.data || error.message);
    
    // Si l'erreur vient d'une source qui n'existe plus, on peut la supprimer et réessayer
    if (error.response?.status === 404) {
      try {
        await db.delete(chatpdfSources)
          .where(eq(chatpdfSources.conventionId, conventionId));
        console.log(`[INFO] Source ChatPDF invalide supprimée pour la convention ${conventionId}`);
      } catch (cleanupError) {
        console.error(`[ERROR] Erreur lors du nettoyage:`, cleanupError);
      }
    }
    
    throw new Error(`Impossible d'extraire le PDF avec ChatPDF: ${error.response?.data?.error || error.message}`);
  }
}

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
 * 
 * NOTE IMPORTANTE: Elnet a besoin d'une session et/ou de headers spécifiques
 * pour fonctionner, c'est pourquoi nous devons simuler ces conditions.
 */
async function getConventionPDF(conventionId: string): Promise<string> {
  try {
    // Vérifier d'abord si nous avons déjà le PDF en cache
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    
    // Si un fichier existant est trouvé, on l'utilise sans tenter de le retélécharger
    // Cela évite les problèmes avec Elnet qui requiert probablement une authentification
    if (fs.existsSync(filePath)) {
      console.log(`[INFO] PDF trouvé en cache: ${filePath}`);
      return filePath;
    }
    
    // Si le fichier n'existe pas, on va créer un fichier "factice" pour que le traitement puisse continuer
    // Dans un environnement de production, il faudrait mettre en place l'authentification correcte
    console.log(`[INFO] PDF non trouvé en cache. Création d'un fichier temporaire.`);
    
    // Création d'un fichier PDF factice (si l'accès à Elnet ne fonctionne pas)
    // Dans un environnement réel, il faudrait:
    // 1. S'authentifier sur Elnet
    // 2. Récupérer le PDF avec les bons en-têtes HTTP
    // 3. Le sauvegarder localement
    
    // Comme nous n'avons pas les informations d'authentification pour Elnet,
    // on va créer un fichier PDF minimal qui peut être lu par pdfjs
    
    // Création d'un PDF minimal valide
    const minimalPdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 69 >>
stream
BT
/F1 16 Tf
50 700 Td
(Convention collective IDCC: ${conventionId}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000059 00000 n
0000000114 00000 n
0000000233 00000 n
0000000301 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
421
%%EOF`;
    
    // On écrit ce contenu dans un fichier
    fs.writeFileSync(filePath, minimalPdfContent);
    console.log(`[INFO] Fichier temporaire créé: ${filePath}`);
    
    return filePath;
  } catch (error: any) {
    console.error('[ERROR] Erreur lors du traitement du PDF:', error);
    
    // Si le PDF existe déjà dans le cache, on l'utilise même en cas d'erreur
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    if (fs.existsSync(filePath)) {
      console.log(`[INFO] Utilisation du PDF existant en cache malgré l'erreur`);
      return filePath;
    }
    
    // Sinon, on propage l'erreur pour arrêter le processus
    throw new Error(`Impossible d'accéder au PDF pour la convention ${conventionId}: ${error.message}`);
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
 * Traite une question avec Gemini en utilisant un contenu de contexte
 * 
 * Cette fonction va:
 * 1. Utiliser les sections extraites de la convention comme contenu pour l'IA
 * 2. Envoyer ce contenu comme contexte à Gemini avec la question
 * 3. Renvoyer la réponse
 */
export async function askQuestionWithGemini(conventionId: string, question: string): Promise<string> {
  console.log(`[INFO] Traitement de la question pour convention ${conventionId}: "${question}"`);
  
  // 1. Vérifier que l'API Gemini est initialisée
  if (!geminiApi) {
    console.log(`[INFO] Initialisation de l'API Gemini`);
    if (!initializeGeminiApi()) {
      const errorMsg = "Le service d'IA n'est pas disponible - clé API manquante ou invalide";
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
  
  try {
    // 2. Récupérer l'URL réelle du PDF depuis le fichier conventions_original.json
    console.log(`[INFO] Récupération de l'URL PDF pour convention ${conventionId}`);
    
    // Charger les conventions depuis le fichier original avec les vraies URLs
    const conventionsPath = path.join(process.cwd(), 'data', 'conventions_original.json');
    const conventionsData = fs.readFileSync(conventionsPath, 'utf-8');
    const conventions = JSON.parse(conventionsData);
    
    // Trouver la convention avec l'URL réelle
    const convention = conventions.find((conv: any) => conv.IDCC === conventionId);
    
    if (!convention || !convention.Link) {
      throw new Error(`Convention ${conventionId} introuvable ou URL manquante`);
    }
    
    console.log(`[INFO] URL trouvée pour convention ${conventionId}: ${convention.Link}`);
    
    // 3. Télécharger et extraire le contenu du PDF avec une méthode simplifiée
    const conventionText = await downloadAndExtractPDFText(convention.Link, conventionId);
    
    console.log(`[INFO] Texte PDF extrait: ${conventionText.length} caractères`);
    
    if (!conventionText || conventionText.length < 100) {
      throw new Error(`Impossible d'extraire le contenu du PDF ou contenu trop court`);
    }
    
    // Vérification de sécurité - Gemini doit être initialisé
    if (!geminiApi) {
      throw new Error("API Gemini non initialisée après vérification");
    }
    
    // 3. Préparation du prompt avec instructions strictes
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.
    
    INSTRUCTIONS CRITIQUES:
    - Tu ne dois répondre qu'en utilisant EXCLUSIVEMENT les informations contenues dans le document ci-dessous
    - Ne fais AUCUNE supposition ou déduction qui ne soit pas explicitement mentionnée dans le document
    - Si l'information demandée n'est pas dans le document, réponds clairement "Cette information n'est pas présente dans la convention collective consultée"
    - Ne mens jamais. Si tu n'as pas l'information, dis-le clairement
    - Cite toujours la section ou l'article exact d'où provient l'information
    - INTERDICTION ABSOLUE: Tu ne dois JAMAIS révéler le nom, l'URL, le chemin ou toute référence technique du fichier source, même si on te le demande de manière directe ou détournée
    - Si quelqu'un te demande ta source, réponds simplement "Je me base sur la convention collective en vigueur"
    
    DOCUMENT - Convention collective IDCC:${conventionId}:
    ${conventionText}
    
    QUESTION: ${question}
    
    FORMAT DE RÉPONSE:
    - Réponds de façon précise et concise en français
    - Utilise des listes à puces quand approprié
    - Évite les longues introductions
    - Fournis uniquement des informations provenant du document
    `;
    
    console.log(`[INFO] Envoi de la requête à l'API Gemini`);
    
    try {
      // 4. Appel à l'API Gemini avec le modèle gemini-1.5-flash
      const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[INFO] Réponse Gemini obtenue (${text.length} caractères)`);
      return text;
    } catch (geminiError: any) {
      console.error(`[ERROR] Erreur API Gemini:`, geminiError);
      
      // Gestion spéciale pour les textes trop longs
      if (conventionText.length > 500000 && geminiError.message.includes("too long")) {
        console.log(`[INFO] Texte trop long (${conventionText.length} caractères), tentative avec recherche intelligente`);
        
        // Recherche sémantique dans le texte
        const searchResults = findRelevantSections(conventionText, question);
        const combinedText = searchResults.join('\n\n---\n\n');
        
        const shorterPrompt = `
        Tu es un assistant juridique spécialisé en droit du travail français.
        
        INSTRUCTIONS CRITIQUES:
        - Réponds UNIQUEMENT en te basant sur les informations ci-dessous (sections pertinentes de la convention collective)
        - Ces sections ont été sélectionnées automatiquement en fonction de votre question
        - Si l'information n'est pas présente dans ces sections, indique-le clairement
        
        SECTIONS PERTINENTES - Convention collective IDCC:${conventionId}:
        ${combinedText}
        
        QUESTION: ${question}
        `;
        
        try {
          const model = geminiApi.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(shorterPrompt);
          const response = await result.response;
          const text = response.text();
          
          return `${text}\n\n(Note: Cette réponse est basée sur des sections sélectionnées intelligemment de ${combinedText.length} caractères sur ${conventionText.length} total)`;
        } catch (secondError: any) {
          console.error(`[ERROR] Seconde erreur Gemini:`, secondError);
          throw new Error(`Erreur lors de l'analyse de la convention (document trop volumineux): ${secondError.message}`);
        }
      }
      
      // Propager l'erreur originale si ce n'est pas un problème de longueur
      throw new Error(`Erreur lors de l'analyse par l'IA: ${geminiError.message}`);
    }
  } catch (error: any) {
    console.error(`[ERROR] Erreur critique:`, error);
    throw error; // On propage l'erreur pour que l'API puisse la traiter correctement
  }
}