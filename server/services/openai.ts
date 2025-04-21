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
 * avec extraction intelligente basée sur la catégorie demandée
 */
export async function getConventionText(
  conventionUrl: string, 
  conventionId: string, 
  category?: string, 
  subcategory?: string
): Promise<string> {
  // Créer une clé de cache qui inclut la catégorie/sous-catégorie
  const cacheKey = `${conventionId}_${category || 'default'}_${subcategory || 'default'}`;
  
  // Vérifier si le texte est déjà en cache
  if (pdfTextCache.has(cacheKey)) {
    console.log(`Utilisation du texte en cache pour la convention ${conventionId} (catégorie: ${category})`);
    const cachedText = pdfTextCache.get(cacheKey);
    if (cachedText) return cachedText;
  }
  
  try {
    console.log(`Extraction du texte du PDF pour la convention ${conventionId} (catégorie: ${category})`);
    
    // Déterminer les mots-clés à rechercher en priorité selon la catégorie
    let priorityKeywords: string[] = [];
    
    if (category) {
      // Mots-clés pour les congés pour événements familiaux
      if (category === 'conges' && subcategory === 'evenement-familial') {
        priorityKeywords = [
          "congés pour événements familiaux",
          "congé familial",
          "congé de naissance",
          "congé de mariage",
          "congé de décès",
          "mariage",
          "PACS",
          "naissance",
          "décès",
          "enfant malade",
          "événements de famille"
        ];
      }
      // Mots-clés pour la classification
      else if (category === 'classification') {
        priorityKeywords = [
          "classification",
          "grille de classification",
          "catégorie professionnelle",
          "coefficient",
          "niveau",
          "échelon",
          "emploi",
          "fonction",
          "position",
          "qualification"
        ];
      }
      // Mots-clés pour les salaires
      else if (category === 'remunerations') {
        priorityKeywords = [
          "salaire",
          "rémunération",
          "prime",
          "indemnité",
          "paie",
          "minima",
          "augmentation",
          "grille salariale"
        ];
      }
      // Mots-clés pour la durée du travail
      else if (category === 'duree-travail') {
        priorityKeywords = [
          "durée du travail",
          "temps de travail",
          "horaire",
          "heures supplémentaires",
          "repos",
          "pause",
          "travail de nuit",
          "temps partiel"
        ];
      }
      // Mots-clés pour les congés payés
      else if (category === 'conges' && subcategory === 'conges-payes') {
        priorityKeywords = [
          "congés payés",
          "congé annuel",
          "jours de congé",
          "période de congé",
          "fractionnement"
        ];
      }
    }
    
    // Si aucune catégorie spécifique n'est identifiée, utiliser des mots-clés génériques
    if (priorityKeywords.length === 0) {
      priorityKeywords = [
        "article",
        "titre",
        "chapitre",
        "section",
        "convention collective",
        "accord"
      ];
    }
    
    // Extraire le texte avec la liste de mots-clés prioritaires
    const text = await extractTextFromURL(conventionUrl, conventionId, priorityKeywords);
    
    // Ajouter un en-tête
    const conventionText = `CONVENTION COLLECTIVE NATIONALE IDCC ${conventionId}\nSource: ${conventionUrl}\n\n` +
      `CONTEXTE DE RECHERCHE: ${category || 'général'} ${subcategory || ''}\n\n${text}`;
    
    // Mettre en cache
    pdfTextCache.set(cacheKey, conventionText);
    
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
    // Préparation du contexte avec instructions très précises
    const systemMessage = {
      role: "system",
      content: `Vous êtes un assistant juridique spécialisé en droit du travail français, et plus particulièrement dans l'analyse des conventions collectives.

Vous allez analyser la convention collective IDCC ${conventionId} - ${conventionName}.

Ci-dessous se trouve le texte intégral du document PDF de cette convention collective. Ce texte a été extrait automatiquement et n'est PAS tronqué. Il contient l'ensemble du document à votre disposition:

---DÉBUT DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---
${conventionText}
---FIN DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---

DIRECTIVES STRICTES À SUIVRE:
1. Vous devez vous baser EXCLUSIVEMENT sur le texte ci-dessus pour répondre à la question de l'utilisateur.
2. Ne faites JAMAIS appel à des connaissances générales sur les conventions collectives qui ne seraient pas présentes dans ce document spécifique.
3. Recherchez attentivement dans TOUT le document pour trouver l'information exacte demandée.
4. Citez précisément les articles, sections ou titres pertinents que vous trouvez dans le document.
5. Si l'information n'apparaît nulle part dans le document, dites clairement: "Cette information spécifique n'est pas présente dans le document de la convention collective IDCC ${conventionId}."
6. Structurez vos réponses de manière claire et organisée en utilisant des titres, listes à puces, tableaux si nécessaire.
7. N'inventez JAMAIS d'information qui ne serait pas explicitement mentionnée dans le document.
8. Si le texte contient des numéros d'articles, des chapitres ou des sections numérotées, utilisez-les pour faciliter la compréhension.

Si vous ne trouvez pas l'information demandée après une recherche approfondie dans tout le document, précisez: "Après analyse complète du document de la convention collective IDCC ${conventionId}, l'information demandée n'y figure pas."`
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
    
    // Récupérer le texte de la convention avec extraction intelligente basée sur le type
    let conventionText: string;
    try {
      conventionText = await getConventionText(conventionUrl, conventionId, type);
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

Ci-dessous se trouve le texte intégral du document PDF de cette convention collective. Ce texte a été extrait automatiquement et contient l'ensemble du document à votre disposition:

---DÉBUT DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---
${conventionText}
---FIN DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---

DIRECTIVES STRICTES POUR VOTRE ANALYSE:

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

4. Règles ESSENTIELLES :
   - Basez-vous EXCLUSIVEMENT sur le texte fourni ci-dessus
   - Recherchez méticuleusement dans TOUT le document les informations demandées
   - Ne faites JAMAIS appel à des connaissances générales qui ne seraient pas présentes dans ce document spécifique
   - Si une information n'est pas présente dans le texte, indiquez-le clairement: "Cette information n'apparaît pas dans le document de la convention collective IDCC ${conventionId}"
   - N'inventez JAMAIS d'information qui ne serait pas explicitement mentionnée dans le document

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