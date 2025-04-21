import OpenAI from "openai";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ChatResponse, Message } from '../../client/src/types';

// Utilisation du modèle gpt-4.1-2025-04-14 comme demandé explicitement par l'utilisateur
const MODEL = "gpt-4.1-2025-04-14";

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
 * Cette version simplifiée de l'extraction de texte n'utilise plus pdf-parse
 * qui posait des problèmes de dépendance.
 * À la place, nous réutilisons directement les informations de la convention
 * que nous connaissons déjà via son ID.
 */
export async function getConventionText(conventionUrl: string, conventionId: string): Promise<string> {
  // Vérifier si le texte est déjà en cache
  if (pdfTextCache.has(conventionId)) {
    console.log(`Utilisation du texte en cache pour la convention ${conventionId}`);
    const cachedText = pdfTextCache.get(conventionId);
    if (cachedText) return cachedText;
  }
  
  try {
    // Récupérer les méta-informations sur la convention depuis l'URL
    console.log(`Récupération des informations pour la convention ${conventionId} depuis ${conventionUrl}`);
    
    // Télécharger le contenu HTML de la page (on ne traite pas le PDF directement)
    const response = await axios.get(conventionUrl, { 
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 // 15 secondes de timeout
    }).catch(() => null);
    
    // Construire un texte avec toutes les informations disponibles
    let conventionText = `CONVENTION COLLECTIVE NATIONALE IDCC ${conventionId}\n`;
    conventionText += `Source: ${conventionUrl}\n\n`;
    
    // Ajouter des informations basiques sur la convention
    conventionText += `Cette convention collective régit les relations entre employeurs et salariés dans son secteur d'activité.\n`;
    conventionText += `Pour consulter le texte complet, rendez-vous sur Légifrance à l'adresse : ${conventionUrl}\n\n`;
    
    // Ajouter des informations supplémentaires si on a pu récupérer la page
    if (response && response.data) {
      const htmlContent = response.data.toString();
      // Essayer d'extraire le titre
      const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        conventionText += `Titre complet: ${titleMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}\n\n`;
      }
      
      // Essayer d'extraire d'autres informations pertinentes
      // (codes simplifiés pour éviter les erreurs)
    }
    
    // Ajouter une note sur les limites de l'analyse
    conventionText += `NOTE IMPORTANTE: En raison des limitations techniques, l'analyse qui suit est basée sur les connaissances générales du modèle d'IA concernant cette convention collective, et non sur l'extraction directe du texte intégral du PDF. Pour une analyse juridique précise, veuillez consulter le texte original sur Légifrance.\n\n`;
    
    // Mettre en cache
    pdfTextCache.set(conventionId, conventionText);
    
    console.log(`Informations sur la convention ${conventionId} récupérées et mises en cache`);
    return conventionText;
  } catch (error: any) {
    console.error('Erreur lors de l\'obtention des informations de la convention:', error);
    
    // En cas d'échec, utiliser un message de secours
    const fallbackText = `Convention collective nationale IDCC ${conventionId}.\n\n` +
      `ATTENTION: Je n'ai pas pu récupérer les informations détaillées de cette convention collective.\n` +
      `Merci de consulter le texte intégral sur Légifrance à l'adresse suivante: ${conventionUrl}\n\n` +
      `L'analyse qui suit sera basée sur les connaissances générales du modèle d'IA concernant cette convention collective.`;
    
    return fallbackText;
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

Vous allez analyser la convention collective IDCC ${conventionId} - ${conventionName}.

Voici les informations disponibles sur cette convention collective:
${conventionText}

Consignes importantes:
1. Utilisez vos connaissances sur cette convention collective spécifique (IDCC ${conventionId}) pour répondre à la question.
2. Précisez clairement quand vous vous basez sur vos connaissances générales de cette convention collective plutôt que sur un extrait précis du texte.
3. Citez les articles pertinents quand vous les connaissez.
4. Si vous n'avez pas l'information demandée, indiquez-le clairement.
5. Structurez vos réponses de manière claire et organisée (listes à puces, sections numérotées, etc.)
6. Ne faites pas de supposition sur le contenu précis des articles si vous ne les connaissez pas.`
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
    // Déterminer l'URL de la convention
    const conventionUrl = `https://www.legifrance.gouv.fr/conv_coll/id/${conventionId}`;
    
    // Récupérer le texte de la convention si possible
    let conventionText = "";
    try {
      conventionText = await getConventionText(conventionUrl, conventionId);
    } catch (err) {
      console.error("Impossible de récupérer les informations sur la convention, utilisation du mode de secours");
    }
    
    // Message spécifique selon le type demandé
    let systemPrompt = "";
    let userPrompt = "";
    
    if (type === 'classification') {
      systemPrompt = `Vous êtes un expert en droit du travail français spécialisé dans les classifications professionnelles. 
Analysez la structure détaillée de la classification des emplois dans la convention collective IDCC ${conventionId} (${conventionName}).

${conventionText ? "Voici les informations disponibles sur cette convention collective:" : ""}
${conventionText}

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
   - Analysez la convention collective IDCC ${conventionId}
   - Utilisez vos connaissances sur cette convention spécifique
   - Si une information n'est pas disponible, indiquez-le clairement
   - Structurez la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajoutez :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles existent`;
      
      userPrompt = `Présentez la classification complète des emplois pour la convention collective IDCC ${conventionId} (${conventionName}).`;
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