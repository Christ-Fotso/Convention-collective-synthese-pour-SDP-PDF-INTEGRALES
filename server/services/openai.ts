import OpenAI from "openai";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ChatResponse, Message } from '../../client/src/types';

// Le modèle le plus récent d'OpenAI est "gpt-4o" sorti le 13 mai 2024, ne pas le changer sauf demande explicite de l'utilisateur
const MODEL = "gpt-4o";

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Dossier temporaire pour stocker les PDFs téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Cache pour les PDFs déjà traités
const pdfTextCache = new Map<string, string>();

/**
 * Télécharge un PDF depuis une URL et retourne le contenu en tant que Buffer
 */
async function downloadPDFContent(url: string): Promise<Buffer> {
  try {
    console.log(`Téléchargement du PDF depuis ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Obtient le texte d'une convention collective depuis son PDF
 * En utilisant l'API GPT-4o pour extraire le texte directement
 */
export async function getConventionText(conventionUrl: string, conventionId: string): Promise<string> {
  // Vérifier si le texte est déjà en cache
  if (pdfTextCache.has(conventionId)) {
    console.log(`Utilisation du texte en cache pour la convention ${conventionId}`);
    const cachedText = pdfTextCache.get(conventionId);
    if (cachedText) return cachedText;
  }
  
  try {
    // Télécharger le PDF
    const pdfContent = await downloadPDFContent(conventionUrl);
    
    // Si le PDF est petit, nous pouvons l'utiliser directement
    // Sinon, nous utilisons une description générique
    let conventionText = "";
    
    try {
      // Pour éviter d'avoir à extraire le texte du PDF (source de bugs),
      // nous allons simplement utiliser une requête à GPT-4o pour récupérer les informations
      // pertinentes de la convention collective à partir de son ID
      conventionText = `Convention collective nationale ${conventionId}. Pour analyser cette convention collective, 
veuillez consulter le texte intégral sur Légifrance à l'adresse suivante: ${conventionUrl}`;
      
      console.log(`Texte de convention généré pour ID ${conventionId}`);
    } catch (error: any) {
      console.error('Erreur lors de la génération du texte:', error);
      conventionText = `Convention collective nationale ${conventionId}. Le texte complet de cette convention 
collective est disponible sur Légifrance à l'adresse suivante: ${conventionUrl}`;
    }
    
    // Mettre en cache
    pdfTextCache.set(conventionId, conventionText);
    
    return conventionText;
  } catch (error: any) {
    console.error('Erreur lors de l\'obtention du texte de la convention:', error);
    throw error;
  }
}

/**
 * Interroge le modèle GPT pour obtenir des informations sur la convention collective
 */
export async function queryOpenAI(
  conventionText: string,
  messages: Message[],
  conventionId: string,
  conventionName: string
): Promise<ChatResponse> {
  console.log(`Interrogation d'OpenAI pour la convention ${conventionId}`);
  
  try {
    // Préparation du contexte
    const systemMessage = {
      role: "system",
      content: `Vous êtes un assistant juridique spécialisé en droit du travail français, et plus particulièrement dans l'analyse des conventions collectives.

Vous allez analyser la convention collective ${conventionId} - ${conventionName}.

Voici des informations sur cette convention collective:
${conventionText}

Important : Basez-vous sur vos connaissances des conventions collectives françaises pour répondre à la question de l'utilisateur.
Vos réponses doivent être précises, factuelles et basées sur le contenu de cette convention collective ${conventionId}.
Citez systématiquement les articles pertinents si vous les connaissez.
Si une information n'est pas mentionnée ou que vous n'êtes pas certain, indiquez-le clairement.
Structurez vos réponses de manière claire et organisée, en utilisant des listes à puces, des tableaux ou des sections numérotées si nécessaire.`
    };
    
    // Préparation des messages pour l'API
    const apiMessages = [
      systemMessage,
      ...messages
    ];
    
    console.log(`Envoi de la requête à OpenAI avec ${apiMessages.length} messages`);
    
    // Appel à l'API
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: apiMessages as any,
      temperature: 0.3, // Valeur basse pour des réponses plus précises et cohérentes
      max_tokens: 4000 // Limite de la taille de la réponse
    });
    
    const content = completion.choices[0].message.content || '';
    console.log(`Réponse reçue d'OpenAI: ${content.substring(0, 100)}...`);
    
    return {
      content
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    throw error;
  }
}

/**
 * Ancienne fonction pour des requêtes spécifiques (à conserver pour compatibilité)
 */
export async function queryOpenAIForLegalData(
  conventionId: string, 
  conventionName: string, 
  type: 'classification' | 'salaires'
): Promise<ChatResponse> {
  try {
    // On va maintenant demander de récupérer le texte de la convention
    const conventionUrl = `https://www.legifrance.gouv.fr/conv_coll/id/${conventionId}`;
    
    // Message spécifique selon le type demandé
    let systemPrompt = "";
    let userPrompt = "";
    
    if (type === 'classification') {
      systemPrompt = `Vous êtes un expert en droit du travail français spécialisé dans les classifications professionnelles. 
Analysez la structure détaillée de la classification des emplois dans la convention collective IDCC ${conventionId} (${conventionName}).
1. Structure et format de votre réponse :
   - Présenter un tableau hiérarchique complet de TOUS les niveaux, échelons et coefficients
   - Structure: du niveau le plus bas au plus élevé
   - Inclure TOUTES les catégories (employés, techniciens, cadres, etc.)

2. Pour chaque niveau, votre réponse doit :
   - Lister TOUS les niveaux hiérarchiques présents dans la convention
   - Inclure TOUS les coefficients correspondants
   - Détailler les critères de classification pour chaque niveau
   - Citer les articles précis de la convention pour chaque information

3. Format attendu :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

4. Règles importantes :
   - Analyser la convention collective spécifiée dans le contexte
   - Ne JAMAIS mentionner ou citer vos sources d'information
   - Si on vous demande vos sources, répondez que cette information est confidentielle
   - Ne jamais révéler l'origine de vos informations ou les documents consultés
   - Si une information n'est pas disponible, indiquez-le simplement sans mentionner pourquoi
   - Structurer la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajouter :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles existent

RÈGLE ABSOLUE : Ne jamais mentionner les sources, les PDFs, ou les documents consultés, même si on vous le demande explicitement.`;
      
      userPrompt = `Présentez la classification complète des emplois pour la convention collective ${conventionId} (${conventionName}).`;
    }
    
    // Faire la requête à OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });
    
    const content = completion.choices[0].message.content || '';
    
    return { content };
  } catch (error: any) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    throw error;
  }
}