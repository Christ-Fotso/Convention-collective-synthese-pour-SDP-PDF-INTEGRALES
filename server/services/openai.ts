import OpenAI from "openai";
import { ChatResponse, Message } from '../../client/src/types';
import { extractTextFromURL } from "./pdf-extractor";

// Utilisation du modèle gpt-4.1-2025-04-14 comme demandé explicitement par l'utilisateur
const MODEL = "gpt-4.1-2025-04-14";

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Cache pour les PDFs déjà traités
const pdfTextCache = new Map<string, string>();

/**
 * Obtient le texte brut d'une convention collective depuis son PDF
 */
export async function getConventionText(conventionUrl: string, conventionId: string): Promise<string> {
  // Vérifier si le texte est déjà en cache
  if (pdfTextCache.has(conventionId)) {
    console.log(`Utilisation du texte en cache pour la convention ${conventionId}`);
    const cachedText = pdfTextCache.get(conventionId);
    if (cachedText) return cachedText;
  }
  
  try {
    console.log(`Extraction du texte du PDF pour la convention ${conventionId}`);
    
    // Extraire le texte
    const text = await extractTextFromURL(conventionUrl, conventionId);
    
    // Ajouter un en-tête
    const conventionText = `CONVENTION COLLECTIVE NATIONALE IDCC ${conventionId}\nSource: ${conventionUrl}\n\n${text}`;
    
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
 * basées sur le contenu réel du PDF
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

Voici le texte extrait du document PDF de cette convention collective:
---DÉBUT DU TEXTE EXTRAIT---
${conventionText}
---FIN DU TEXTE EXTRAIT---

Consignes importantes:
1. Basez-vous UNIQUEMENT sur le texte fourni ci-dessus pour répondre à la question de l'utilisateur.
2. Si l'information demandée n'est pas présente dans le texte fourni, indiquez-le clairement.
3. Citez les articles pertinents quand vous les trouvez dans le texte.
4. Structurez vos réponses de manière claire et organisée (listes à puces, sections numérotées, etc.).
5. Si le texte fourni semble incomplet ou tronqué, mentionnez-le dans votre réponse.`
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
    // Récupérer l'URL de la convention
    const conventionUrl = `https://www.legifrance.gouv.fr/conv_coll/id/${conventionId}`;
    
    // Récupérer le texte de la convention
    let conventionText: string;
    try {
      conventionText = await getConventionText(conventionUrl, conventionId);
    } catch (err) {
      console.error("Erreur lors de l'extraction du texte:", err);
      throw new Error("Impossible d'extraire le texte de la convention collective");
    }
    
    // Message spécifique selon le type demandé
    let systemPrompt = "";
    let userPrompt = "";
    
    if (type === 'classification') {
      systemPrompt = `Vous êtes un expert en droit du travail français spécialisé dans les classifications professionnelles. 
Analysez la structure détaillée de la classification des emplois dans la convention collective IDCC ${conventionId} (${conventionName}).

Voici le texte extrait du document PDF de cette convention collective:
---DÉBUT DU TEXTE EXTRAIT---
${conventionText}
---FIN DU TEXTE EXTRAIT---

1. Structure et format de votre réponse :
   - Présenter un tableau hiérarchique complet de TOUS les niveaux, échelons et coefficients que vous trouvez dans le texte
   - Structure: du niveau le plus bas au plus élevé
   - Inclure TOUTES les catégories mentionnées (employés, techniciens, cadres, etc.)

2. Pour chaque niveau, votre réponse doit :
   - Lister TOUS les niveaux hiérarchiques présents dans le texte
   - Inclure TOUS les coefficients correspondants mentionnés
   - Détailler les critères de classification pour chaque niveau
   - Citer les articles précis trouvés dans le texte

3. Format attendu :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

4. Règles importantes :
   - Basez-vous UNIQUEMENT sur le texte fourni
   - Si une information n'est pas présente dans le texte, indiquez-le clairement
   - Structurez la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajoutez :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles sont mentionnées dans le texte`;
      
      userPrompt = `En vous basant uniquement sur le texte extrait fourni, présentez la classification complète des emplois pour la convention collective IDCC ${conventionId} (${conventionName}).`;
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