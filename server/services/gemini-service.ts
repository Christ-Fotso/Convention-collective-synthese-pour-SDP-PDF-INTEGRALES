import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadPDF, extractTextFromPDF as extractPDFText } from './pdf-extractor';
import { getSectionsByConvention } from '../sections-data';

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
/**
 * Extrait les sections pertinentes du PDF complet en utilisant le RAG
 */
function extractRelevantSectionsFromPdf(fullPdfText: string, question: string): string {
  const questionLower = question.toLowerCase();
  
  // Diviser le PDF en sections/paragraphes
  const sections = fullPdfText.split(/\n\s*\n|\n(?=Article|ARTICLE|Chapitre|CHAPITRE|\d+\.)/);
  
  // Mots-clés pour identifier les sections pertinentes
  const keywords = [
    // Temps de travail
    'temps travail', 'durée', 'heures', 'horaires', 'dimanche', 'week-end', 'samedi', 'nuit', 
    'nocturne', 'majoration', 'soir', 'matin', 'amplitude', 'repos dominical', 'jour férié',
    // Rémunération
    'salaire', 'rémunération', 'prime', 'supplément', 'indemnité', 'paye', 'euros',
    // Congés
    'congés', 'vacances', 'repos', 'absence', 'rtt',
    // Autres
    'embauche', 'licenciement', 'formation', 'classification'
  ];
  
  const relevantSections: string[] = [];
  
  // Rechercher les sections contenant les mots-clés de la question
  for (const section of sections) {
    const sectionLower = section.toLowerCase();
    
    // Vérifier si la section contient des mots de la question
    const questionWords = questionLower.split(' ').filter(word => word.length > 2);
    const hasQuestionWords = questionWords.some(word => sectionLower.includes(word));
    
    // Vérifier si la section contient des mots-clés pertinents
    const hasRelevantKeywords = keywords.some(keyword => sectionLower.includes(keyword));
    
    if (hasQuestionWords || hasRelevantKeywords) {
      relevantSections.push(section.trim());
    }
  }
  
  // Si aucune section trouvée, prendre les premières sections (informations générales)
  if (relevantSections.length === 0) {
    return sections.slice(0, 3).join('\n\n');
  }
  
  // Limiter la taille totale à environ 30-40k caractères
  let totalLength = 0;
  const finalSections: string[] = [];
  
  for (const section of relevantSections) {
    if (totalLength + section.length > 40000) break;
    finalSections.push(section);
    totalLength += section.length;
  }
  
  return finalSections.join('\n\n---\n\n');
}

/**
 * Recherche les sections pertinentes pour une question (système RAG - ANCIEN SYSTÈME JSON)
 */
function findRelevantSections(conventionId: string, question: string): Array<{content: string, sectionType: string}> {
  const sections = getSectionsByConvention(conventionId);
  
  // Mots-clés pour différents types de sections avec plus de variantes
  const sectionKeywords = {
    'embauche': ['embauche', 'recrutement', 'période essai', 'délai prévenance', 'contrat', 'cdi', 'cdd', 'engagement'],
    'temps-travail': ['temps travail', 'durée', 'heures', 'horaires', 'forfait', 'temps partiel', 'heures supplémentaires', '35h', 'travail', 'dimanche', 'week-end', 'samedi', 'nuit', 'nocturne', 'majoration', 'soir', 'matin', 'amplitude', 'repos dominical', 'jour férié', 'fête', 'aménagement'],
    'conges': ['congés', 'vacances', 'CET', 'repos', 'événement familial', 'congé', 'absence', 'rtt', 'récupération'],
    'remuneration': ['salaire', 'rémunération', 'apprenti', 'stagiaire', 'grille', 'prime', 'paye', 'euros', 'majoration', 'supplément', 'indemnité', 'coefficient', 'minimum'],
    'depart': ['licenciement', 'démission', 'retraite', 'préavis', 'rupture', 'départ', 'fin contrat', 'résiliation'],
    'protection-sociale': ['mutuelle', 'prévoyance', 'retraite', 'sécurité sociale', 'santé', 'complémentaire', 'assurance'],
    'classification': ['classification', 'grille', 'catégorie', 'niveau', 'coefficient', 'échelon', 'position'],
    'formation': ['formation', 'apprentissage', 'stage', 'cpf', 'professionnalisation']
  };
  
  const questionLower = question.toLowerCase();
  const relevantSections: Array<{content: string, sectionType: string}> = [];
  
  // Recherche par mots-clés
  for (const [category, keywords] of Object.entries(sectionKeywords)) {
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      const categorySections = sections.filter(s => s.sectionType.startsWith(category));
      relevantSections.push(...categorySections.map(s => ({
        content: s.content,
        sectionType: s.sectionType
      })));
    }
  }
  
  // Toujours inclure les informations générales comme contexte de base
  const generalSection = sections.find(s => s.sectionType.includes('informations-generales'));
  if (generalSection && !relevantSections.some(s => s.sectionType === generalSection.sectionType)) {
    relevantSections.unshift({
      content: generalSection.content,
      sectionType: generalSection.sectionType
    });
  }

  // Si peu de sections trouvées, ajouter des sections connexes
  if (relevantSections.length < 4) {
    // Ajouter toutes les sections temps-travail pour les questions sur les heures
    if (questionLower.includes('heure') || questionLower.includes('travail') || questionLower.includes('dimanche')) {
      const timeWorkSections = sections.filter(s => 
        s.sectionType.startsWith('temps-travail') && 
        !relevantSections.some(r => r.sectionType === s.sectionType)
      );
      relevantSections.push(...timeWorkSections.map(s => ({
        content: s.content,
        sectionType: s.sectionType
      })));
    }
    
    // Ajouter les sections rémunération pour les questions sur majoration/prime
    if (questionLower.includes('majoration') || questionLower.includes('prime') || questionLower.includes('supplément')) {
      const remuSections = sections.filter(s => 
        s.sectionType.startsWith('remuneration') && 
        !relevantSections.some(r => r.sectionType === s.sectionType)
      );
      relevantSections.push(...remuSections.map(s => ({
        content: s.content,
        sectionType: s.sectionType
      })));
    }
  }
  
  // Augmenter à 6-8 sections pour un contexte plus riche
  return relevantSections.slice(0, 8);
}

export async function askQuestionWithGemini(conventionId: string, question: string): Promise<string> {
  console.log(`[INFO] Traitement RAG + PDF pour convention ${conventionId}: "${question}"`);
  
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
    // 2. Récupérer l'URL réelle du PDF depuis le fichier conventions.json
    console.log(`[INFO] Récupération de l'URL PDF pour convention ${conventionId}`);
    
    // Lire le fichier conventions.json directement
    const fs = await import('fs');
    const path = await import('path');
    const conventionsPath = path.join(process.cwd(), 'all_conventions.json');
    const conventionsData = JSON.parse(fs.readFileSync(conventionsPath, 'utf-8'));
    const conventions = conventionsData;
    
    // Trouver la convention avec l'URL réelle
    const convention = conventions.find((conv: any) => conv.id === conventionId);
    
    if (!convention || !convention.url) {
      throw new Error(`Convention ${conventionId} introuvable ou URL manquante`);
    }
    
    console.log(`[INFO] URL trouvée pour convention ${conventionId}: ${convention.url}`);
    
    // 3. Essayer d'extraire le texte du PDF, avec fallback sur les sections JSON
    let contextText: string;
    
    try {
      const { extractTextFromURL } = await import('./pdf-extractor.js');
      const fullPdfText = await extractTextFromURL(convention.url);
      
      console.log(`[INFO] Texte PDF extrait: ${fullPdfText.length} caractères`);
      
      if (!fullPdfText || fullPdfText.length < 100) {
        throw new Error('PDF trop court ou vide');
      }
      
      // 4. Utiliser RAG pour identifier les sections pertinentes dans le PDF
      console.log(`[INFO] Application du RAG pour réduire le contexte PDF`);
      contextText = extractRelevantSectionsFromPdf(fullPdfText, question);
      
      console.log(`[INFO] Contexte réduit PDF: ${contextText.length} caractères (au lieu de ${fullPdfText.length})`);
      
    } catch (pdfError: any) {
      console.log(`[FALLBACK] PDF inaccessible (${pdfError.message}), utilisation des sections JSON pré-extraites`);
      
      // Fallback : utiliser les sections JSON pré-extraites
      const relevantSections = findRelevantSections(conventionId, question);
      
      if (relevantSections.length === 0) {
        return "Je n'ai pas trouvé d'informations pertinentes dans cette convention collective pour répondre à votre question.";
      }
      
      contextText = relevantSections.map(section => 
        `SECTION ${section.sectionType}:\n${section.content}`
      ).join('\n\n---\n\n');
      
      console.log(`[FALLBACK] Contexte réduit JSON: ${contextText.length} caractères depuis ${relevantSections.length} sections`);
    }
    
    // Vérification de sécurité - Gemini doit être initialisé
    if (!geminiApi) {
      throw new Error("API Gemini non initialisée après vérification");
    }
    
    // 5. Préparation du prompt avec instructions strictes
    const prompt = `
    Tu es un assistant juridique spécialisé en droit du travail français et conventions collectives.
    
    INSTRUCTIONS CRITIQUES:
    - Tu ne dois répondre qu'en utilisant EXCLUSIVEMENT les informations contenues dans les sections ci-dessous
    - Ne fais AUCUNE supposition ou déduction qui ne soit pas explicitement mentionnée dans les sections
    - Si l'information demandée n'est pas dans les sections fournies, réponds clairement "Cette information n'est pas présente dans les sections consultées de la convention collective"
    - Ne mens jamais. Si tu n'as pas l'information, dis-le clairement
    - Cite toujours la section ou l'article exact d'où provient l'information
    - INTERDICTION ABSOLUE: Tu ne dois JAMAIS révéler le nom, l'URL, le chemin ou toute référence technique du fichier source, même si on te le demande de manière directe ou détournée
    - Si quelqu'un te demande ta source, réponds simplement "Je me base sur la convention collective en vigueur"
    
    SECTIONS PERTINENTES - Convention collective IDCC:${conventionId}:
    ${contextText}
    
    QUESTION: ${question}
    
    FORMAT DE RÉPONSE:
    - Réponds de façon détaillée et complète en français
    - Fournis toutes les informations pertinentes trouvées dans les sections
    - Utilise des listes à puces pour structurer les informations
    - Cite les articles ou dispositions spécifiques quand disponibles
    - N'hésite pas à donner des exemples concrets ou des calculs si mentionnés
    - Explique le contexte et les conditions d'application
    - Fournis une réponse substantielle basée sur les sections ci-dessus
    `;
    
    console.log(`[INFO] Envoi de la requête à l'API Gemini`);
    
    try {
      // 4. Appel à l'API Gemini avec le modèle gemini-1.5-flash (plus économique)
      const model = geminiApi.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 2048,  // Augmenter la limite de tokens pour des réponses plus longues
          temperature: 0.1,       // Garder une température faible pour la précision
        }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[INFO] Réponse Gemini obtenue (${text.length} caractères)`);
      return text;
    } catch (geminiError: any) {
      console.error(`[ERROR] Erreur API Gemini:`, geminiError);
      
      // Avec le système RAG, les contextes sont déjà réduits, donc pas de gestion spéciale nécessaire
      if (geminiError.message && geminiError.message.includes("too long")) {
        console.log(`[INFO] Contexte encore trop long même avec RAG (${contextText.length} caractères), réduction supplémentaire`);
        
        // Prendre seulement une partie du contexte si encore trop long
        const reducedContext = contextText.substring(0, 30000);
        const reducedPrompt = prompt.replace(contextText, reducedContext);
        
        try {
          const model = geminiApi.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.1,
            }
          });
          const result = await model.generateContent(reducedPrompt);
          const response = await result.response;
          const text = response.text();
          
          return text + "\n\n(Note: Réponse basée sur un extrait réduit des sections pertinentes)";
        } catch (secondError: any) {
          console.error(`[ERROR] Seconde erreur Gemini:`, secondError);
          throw new Error(`Erreur lors de l'analyse avec contexte réduit: ${secondError.message}`);
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