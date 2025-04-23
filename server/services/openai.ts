import OpenAI from "openai";
import { ChatResponse, Message } from '../../client/src/types';
import { extractTextFromURL } from "./pdf-extractor";
import { 
  saveConventionSection, 
  getConventionSection, 
  saveApiMetric,
  SECTION_TYPES 
} from "./section-manager";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { conventions } from "../../db/schema";

// Utilisation du modèle gpt-4.1-2025-04-14 comme demandé explicitement par l'utilisateur
const MODEL = "gpt-4.1-2025-04-14";

// Définition des types pour les coûts des modèles
interface ModelCost {
  inputPerThousand: number;
  outputPerThousand: number;
}

// Constantes pour les coûts et les modèles
const MODEL_COSTS: Record<string, ModelCost> = {
  "gpt-4.1-2025-04-14": {
    inputPerThousand: 10, // Coût en cents par 1000 tokens d'entrée 
    outputPerThousand: 30  // Coût en cents par 1000 tokens de sortie
  },
  "gpt-4o": {
    inputPerThousand: 5,
    outputPerThousand: 15
  }
};

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Cache pour les PDFs déjà traités
const pdfTextCache = new Map<string, string>();

/**
 * Calcule le coût estimé d'une requête OpenAI
 */
export function calculateCost(inputTokens: number, outputTokens: number, model: string = MODEL): number {
  const modelCost = MODEL_COSTS[model] || MODEL_COSTS["gpt-4.1-2025-04-14"];
  
  const inputCost = (inputTokens / 1000) * modelCost.inputPerThousand;
  const outputCost = (outputTokens / 1000) * modelCost.outputPerThousand;
  
  // Retourne le coût total en centimes
  return Math.round(inputCost + outputCost);
}

/**
 * Obtient le texte d'une convention collective en suivant une stratégie en 3 étapes:
 * 1. D'abord vérifier le cache mémoire (le plus rapide)
 * 2. Ensuite vérifier si une version pré-convertie en Markdown existe dans la base de données
 * 3. En dernier recours, extraire et convertir le PDF à la volée
 */
export async function getConventionText(
  conventionId: string, 
  conventionUrl: string,
  category?: string, 
  subcategory?: string
): Promise<string> {
  // Créer une clé de cache qui inclut la catégorie/sous-catégorie
  const cacheKey = `${conventionId}_${category || 'default'}_${subcategory || 'default'}`;
  
  // 1. Vérifier si le texte est déjà en cache mémoire (le plus rapide)
  if (pdfTextCache.has(cacheKey)) {
    console.log(`Utilisation du texte en cache mémoire pour la convention ${conventionId} (catégorie: ${category})`);
    const cachedText = pdfTextCache.get(cacheKey);
    if (cachedText) return cachedText;
  }
  
  try {
    // 2. Vérifier si une version pré-convertie existe dans la base de données
    const preConvertedSection = await getConventionSection(conventionId, SECTION_TYPES.FULL_TEXT);
    
    if (preConvertedSection && preConvertedSection.status === 'complete') {
      console.log(`Utilisation de la version pré-convertie (Markdown) pour la convention ${conventionId}`);
      
      // Ajouter un en-tête adapté au format Markdown
      const conventionText = `# CONVENTION COLLECTIVE NATIONALE IDCC ${conventionId}\n\n` +
        `**Source:** ${conventionUrl}\n\n` +
        `**CONTEXTE DE RECHERCHE:** ${category || 'général'} ${subcategory || ''}\n\n` +
        preConvertedSection.content;
      
      // Mettre en cache
      pdfTextCache.set(cacheKey, conventionText);
      
      return conventionText;
    }
    
    // 3. Si aucune version pré-convertie n'existe, extraire le texte du PDF à la volée
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
  conventionName: string,
  category?: string,
  subcategory?: string
): Promise<ChatResponse> {
  // Vérifier si la section est déjà en base de données
  if (category && category !== 'chat') {
    const sectionType = subcategory ? `${category}-${subcategory}` : category;
    const existingSection = await getConventionSection(conventionId, sectionType);
    
    if (existingSection && existingSection.status === 'complete') {
      console.log(`Utilisation de la section ${sectionType} stockée en base de données pour la convention ${conventionId}`);
      return {
        content: existingSection.content,
        fromCache: true
      };
    }
  }

  console.log(`Interrogation d'OpenAI pour la convention ${conventionId}`);
  
  try {
    // Préparation du contexte avec instructions très précises
    const systemMessage = {
      role: "system",
      content: `Vous êtes un extracteur d'informations juridiques précis pour les conventions collectives françaises. 

Vous analysez la convention collective IDCC ${conventionId} - ${conventionName}.

Voici le texte intégral du document:

---DÉBUT DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---
${conventionText}
---FIN DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---

DIRECTIVES STRICTES:
1. NE JAMAIS commencer par "Voici une synthèse..." ou toute autre introduction.
2. NE JAMAIS terminer par une conclusion.
3. NE PAS vous présenter ou expliquer votre rôle.
4. ALLER DIRECTEMENT à l'information demandée, sans préambule.
5. Utiliser UNIQUEMENT le document fourni, jamais de connaissances générales.
6. Citer précisément les articles et sections pertinents.
7. Structurer avec des titres, listes à puces et tableaux.
8. Si l'information n'est pas dans le document, répondre uniquement: "Information non présente dans la convention IDCC ${conventionId}."
9. Répondre de façon directe, factuellement, sans bavardage.
10. NE JAMAIS écrire "D'après la convention collective" ou "Selon le document" - allez directement au contenu.
11. Pour les tableaux:
   - Le format est suggéré et adaptable selon les informations disponibles
   - Ne créez PAS de tableaux vides s'il manque des informations
   - Si aucune information n'est disponible pour créer un tableau, présentez les informations sous forme de texte ou de liste
12. N'UTILISEZ PAS de balises HTML comme <br>. Utilisez uniquement la syntaxe Markdown standard.

FORMAT DE RÉPONSE: Commencez directement par un titre ou une liste, sans aucune phrase d'introduction.`
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
      max_tokens: 32000 // Utiliser la capacité maximale de GPT-4.1 en sortie (32K tokens)
    });
    
    const content = completion.choices[0].message.content || '';
    console.log(`Réponse reçue d'OpenAI: ${content.substring(0, 100)}...`);
    
    // Calcul et enregistrement des métriques
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const estimatedCost = calculateCost(inputTokens, outputTokens);
    
    try {
      await saveApiMetric({
        apiName: 'openai',
        endpoint: 'chat/completions',
        conventionId,
        tokensIn: inputTokens,
        tokensOut: outputTokens,
        estimatedCost,
        success: true
      });
    } catch (metricError) {
      console.error('Erreur lors de l\'enregistrement des métriques:', metricError);
      // On continue malgré l'erreur
    }
    
    // Sauvegarde de la section en base de données si ce n'est pas une requête de chat
    if (category && category !== 'chat') {
      const sectionType = subcategory ? `${category}-${subcategory}` : category;
      
      // Nettoyage du contenu pour enlever les balises HTML indésirables
      let cleanedContent = content || '';
      // Remplacer les balises <br> par des retours à la ligne Markdown
      cleanedContent = cleanedContent.replace(/<br>/g, '  \n');
      cleanedContent = cleanedContent.replace(/<br\/>/g, '  \n');
      cleanedContent = cleanedContent.replace(/<br \/>/g, '  \n');
      
      // Nettoyer d'autres balises HTML potentielles
      cleanedContent = cleanedContent.replace(/<\/?[^>]+(>|$)/g, function(match) {
        // Ne pas toucher aux balises spéciales utilisées par Markdown comme <http://...>
        if (match.startsWith('<http') || match.startsWith('<ftp') || match.startsWith('<mailto')) {
          return match;
        }
        return '';
      });
      
      try {
        await saveConventionSection({
          conventionId,
          sectionType,
          content: cleanedContent,
          status: 'complete'
        });
        console.log(`Section ${sectionType} sauvegardée en base de données pour la convention ${conventionId}`);
      } catch (sectionError) {
        console.error('Erreur lors de la sauvegarde de la section:', sectionError);
        // On continue malgré l'erreur
      }
    }
    
    return {
      content
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    
    // Enregistrement de l'erreur dans les métriques
    try {
      await saveApiMetric({
        apiName: 'openai',
        endpoint: 'chat/completions',
        conventionId,
        success: false,
        errorMessage: error.message
      });
    } catch (metricError) {
      console.error('Erreur lors de l\'enregistrement des métriques d\'erreur:', metricError);
    }
    
    // Si c'est une requête pour une section spécifique, enregistrer l'erreur
    if (category && category !== 'chat' && subcategory) {
      const sectionType = `${category}-${subcategory}`;
      
      try {
        await saveConventionSection({
          conventionId,
          sectionType,
          content: `Erreur lors de l'extraction: ${error.message}`,
          status: 'error',
          errorMessage: error.message
        });
      } catch (sectionError) {
        console.error('Erreur lors de la sauvegarde de l\'erreur de section:', sectionError);
      }
    }
    
    throw error;
  }
}

/**
 * Fonction pour des requêtes spécifiques (classification, salaires)
 */
export async function queryOpenAIForLegalData(
  conventionId: string, 
  conventionName: string, 
  type: 'classification' | 'salaires'
): Promise<ChatResponse> {
  try {
    // Déterminer le type de section
    let sectionType = '';
    if (type === 'classification') {
      sectionType = SECTION_TYPES.CLASSIFICATION;
    } else if (type === 'salaires' || type === 'remuneration') {
      sectionType = SECTION_TYPES.REMUNERATION_GRILLE;
    } else {
      throw new Error(`Type de requête non reconnu: ${type}`);
    }
    
    // Vérifier si la section est déjà en base de données
    const existingSection = await getConventionSection(conventionId, sectionType);
    
    if (existingSection && existingSection.status === 'complete') {
      console.log(`Utilisation de la section ${sectionType} stockée en base de données pour la convention ${conventionId}`);
      return {
        content: existingSection.content,
        fromCache: true
      };
    }
    
    // Récupérer la convention depuis la base de données pour obtenir l'URL
    const conventionData = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);
    
    if (!conventionData || conventionData.length === 0) {
      throw new Error(`Convention ${conventionId} non trouvée dans la base de données`);
    }
    
    const conventionUrl = conventionData[0].url;
    
    // Récupérer le texte de la convention avec extraction intelligente basée sur le type
    let conventionText: string;
    try {
      conventionText = await getConventionText(conventionId, conventionUrl, type);
    } catch (error: any) {
      console.error("Erreur lors de l'extraction du texte:", error);
      
      // Enregistrer l'erreur dans les métriques
      try {
        await saveApiMetric({
          apiName: 'pdf-extractor',
          endpoint: 'extractTextFromURL',
          conventionId,
          success: false,
          errorMessage: error?.message || "Erreur inconnue"
        });
      } catch (metricError) {
        console.error('Erreur lors de l\'enregistrement des métriques d\'erreur:', metricError);
      }
      
      // Enregistrer l'erreur dans la section
      try {
        await saveConventionSection({
          conventionId,
          sectionType,
          content: `Erreur: Impossible d'extraire le texte de la convention collective.`,
          status: 'error',
          errorMessage: error?.message || "Erreur inconnue"
        });
      } catch (sectionError) {
        console.error('Erreur lors de la sauvegarde de l\'erreur de section:', sectionError);
      }
      
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

3. Format suggéré (à adapter selon les informations disponibles) :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

Si aucune information n'est disponible pour créer un tableau, ne pas inclure de tableau vide.

4. Règles ESSENTIELLES :
   - Basez-vous EXCLUSIVEMENT sur le texte fourni ci-dessus
   - Recherchez méticuleusement dans TOUT le document les informations demandées
   - Ne faites JAMAIS appel à des connaissances générales qui ne seraient pas présentes dans ce document spécifique
   - Si une information n'est pas présente dans le texte, indiquez-le clairement: "Cette information n'apparaît pas dans le document de la convention collective IDCC ${conventionId}"
   - N'inventez JAMAIS d'information qui ne serait pas explicitement mentionnée dans le document
   - N'UTILISEZ PAS de balises HTML comme <br> ou autres. Utilisez uniquement la syntaxe Markdown standard.
   - Pour les sauts de ligne dans les cellules du tableau, utilisez "\\n" ou des points d'énumération à la place de balises HTML.

5. Après le tableau, ajoutez :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles sont mentionnées dans le texte`;
      
      userPrompt = `En vous basant uniquement sur le texte extrait fourni, présentez la classification complète des emplois pour la convention collective IDCC ${conventionId} (${conventionName}).`;
    }
    else if (type === 'salaires') {
      systemPrompt = `Vous êtes un expert en droit du travail français spécialisé dans l'analyse des rémunérations et grilles salariales.
Analysez en détail les dispositions salariales de la convention collective IDCC ${conventionId} (${conventionName}).

Ci-dessous se trouve le texte intégral du document PDF de cette convention collective. Ce texte a été extrait automatiquement et contient l'ensemble du document à votre disposition:

---DÉBUT DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---
${conventionText}
---FIN DU TEXTE COMPLET DE LA CONVENTION COLLECTIVE---

DIRECTIVES STRICTES POUR VOTRE ANALYSE:

1. Structure et format de votre réponse :
   - Présenter un tableau complet des salaires minima par niveau, échelon, coefficient selon la convention
   - Structure: du niveau le plus bas au plus élevé
   - Inclure TOUTES les catégories mentionnées (employés, techniciens, cadres, etc.)

2. Pour chaque niveau/coefficient, votre réponse doit inclure :
   - Le salaire minimum conventionnel exact
   - La date d'entrée en vigueur de la grille salariale
   - Les modalités particulières (temps de travail associé, etc.)
   - Citer les articles ou accords précis trouvés dans le texte

3. Format suggéré (à adapter selon les informations disponibles) :
| Niveau/Coefficient | Salaire minimum | Base de calcul | Date d'application |
|-------------------|----------------|---------------|-------------------|
| Niveau 1 - Coef. XX | XXX € | Mensuel/Horaire | JJ/MM/AAAA |

Si aucune information n'est disponible pour créer un tableau, ne pas inclure de tableau vide.

4. Règles ESSENTIELLES :
   - Basez-vous EXCLUSIVEMENT sur le texte fourni ci-dessus
   - Recherchez méticuleusement dans TOUT le document les informations demandées
   - Identifiez l'accord salarial le plus récent mentionné dans le document
   - Ne faites JAMAIS appel à des connaissances générales qui ne seraient pas présentes dans ce document spécifique
   - Si une information n'est pas présente dans le texte, indiquez-le clairement: "Cette information n'apparaît pas dans le document de la convention collective IDCC ${conventionId}"
   - N'UTILISEZ PAS de balises HTML comme <br> ou autres. Utilisez uniquement la syntaxe Markdown standard.
   - Pour les sauts de ligne dans les cellules du tableau, utilisez "\\n" ou des points d'énumération à la place de balises HTML.

5. Après le tableau des salaires minima, ajoutez les sections suivantes :
   - "Primes et indemnités" : liste exhaustive des primes prévues par la convention
   - "Majorations" : majorations pour heures supplémentaires, travail de nuit, etc.
   - "Autres éléments de rémunération" : avantages en nature, 13ème mois, etc.`;
      
      userPrompt = `En vous basant uniquement sur le texte extrait fourni, présentez la grille complète des salaires minima pour la convention collective IDCC ${conventionId} (${conventionName}). Incluez également toutes les primes, indemnités et autres éléments de rémunération prévus par cette convention.`;
    }
    
    // Faire la requête à OpenAI
    console.log(`Interrogation d'OpenAI pour ${type} de la convention ${conventionId}`);
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 32000 // Utiliser la capacité maximale de GPT-4.1 en sortie (32K tokens)
    });
    
    const content = completion.choices[0].message.content || '';
    console.log(`Réponse reçue d'OpenAI pour ${type}: ${content.substring(0, 100)}...`);
    
    // Calcul et enregistrement des métriques
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const estimatedCost = calculateCost(inputTokens, outputTokens);
    
    try {
      await saveApiMetric({
        apiName: 'openai',
        endpoint: 'chat/completions',
        conventionId,
        tokensIn: inputTokens,
        tokensOut: outputTokens,
        estimatedCost,
        success: true
      });
    } catch (metricError) {
      console.error('Erreur lors de l\'enregistrement des métriques:', metricError);
    }
    
    // Nettoyage du contenu pour enlever les balises HTML indésirables
    let cleanedContent = content || '';
    // Remplacer les balises <br> par des retours à la ligne Markdown
    cleanedContent = cleanedContent.replace(/<br>/g, '  \n');
    cleanedContent = cleanedContent.replace(/<br\/>/g, '  \n');
    cleanedContent = cleanedContent.replace(/<br \/>/g, '  \n');
    
    // Nettoyer d'autres balises HTML potentielles
    cleanedContent = cleanedContent.replace(/<\/?[^>]+(>|$)/g, function(match) {
      // Ne pas toucher aux balises spéciales utilisées par Markdown comme <http://...>
      if (match.startsWith('<http') || match.startsWith('<ftp') || match.startsWith('<mailto')) {
        return match;
      }
      return '';
    });
    
    // Sauvegarde de la section en base de données
    try {
      await saveConventionSection({
        conventionId,
        sectionType,
        content: cleanedContent,
        status: 'complete'
      });
      console.log(`Section ${sectionType} sauvegardée en base de données pour la convention ${conventionId}`);
    } catch (sectionError) {
      console.error('Erreur lors de la sauvegarde de la section:', sectionError);
    }
    
    return { content };
  } catch (error: any) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    
    // Enregistrement de l'erreur dans les métriques
    try {
      await saveApiMetric({
        apiName: 'openai',
        endpoint: 'chat/completions',
        conventionId,
        success: false,
        errorMessage: error.message
      });
    } catch (metricError) {
      console.error('Erreur lors de l\'enregistrement des métriques d\'erreur:', metricError);
    }
    
    // Déterminer le type de section
    let sectionType = '';
    if (type === 'classification') {
      sectionType = SECTION_TYPES.CLASSIFICATION;
    } else if (type === 'salaires' || type === 'remuneration') {
      sectionType = SECTION_TYPES.REMUNERATION_GRILLE;
    }
    
    // Enregistrer l'erreur en base de données
    if (sectionType) {
      try {
        await saveConventionSection({
          conventionId,
          sectionType,
          content: `Erreur: ${error.message}`,
          status: 'error',
          errorMessage: error.message
        });
      } catch (sectionError) {
        console.error('Erreur lors de la sauvegarde de l\'erreur de section:', sectionError);
      }
    }
    
    throw error;
  }
}