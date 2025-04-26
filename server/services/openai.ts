import OpenAI from "openai";
import { ChatResponse, Message } from '../../client/src/types';
import { extractTextFromURL } from "./pdf-extractor";
import { 
  saveConventionSection, 
  getConventionSection, 
  saveApiMetric,
  SECTION_TYPES 
} from "./section-manager";
import { normalizeMarkdownTables, containsTableData } from './table-formatter';
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

// Import de notre classe de cache persistant
import { LimitedCache } from "./cache-manager";

// Cache pour les PDFs déjà traités (avec persistance)
const pdfTextCache = new LimitedCache(20, 'pdf-text', 600000); // 10 minutes d'intervalle

// Fonction d'initialisation exposée pour être appelée au démarrage du serveur
export async function initPdfTextCache(): Promise<void> {
  try {
    await pdfTextCache.initFromDatabase();
    console.log("Cache de texte des PDFs initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du cache de texte des PDFs:", error);
    throw error;
  }
}

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
    let systemPromptContent = `Vous êtes un extracteur d'informations juridiques précis pour les conventions collectives françaises. 

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
11. RÈGLES STRICTES POUR LES TABLEAUX (PARTIE CRUCIALE):
   - TOUJOURS utiliser la syntaxe Markdown correcte pour les tableaux
   - TOUJOURS inclure une ligne d'en-tête avec des titres précis pour chaque colonne
   - TOUJOURS ajouter une ligne de délimitation (---|---|---) après l'en-tête
   - JAMAIS créer de tableaux vides s'il manque des informations
   - JAMAIS fusionner plusieurs informations dans une même cellule
   - JAMAIS omettre les séparateurs | entre les colonnes
   - TOUJOURS préférer plusieurs tableaux bien structurés plutôt qu'un seul tableau confus
   - TOUJOURS espacer correctement le contenu avec un espace après chaque | et un espace avant chaque |
   - Exemple de bon format:
     | Catégorie | Valeur | Description |
     | --------- | ------ | ----------- |
     | Exemple 1 | 100 | Description détaillée |

12. N'UTILISEZ JAMAIS de balises HTML comme <br>, <div>, <p>, etc. Utilisez UNIQUEMENT la syntaxe Markdown standard.

FORMAT DE RÉPONSE: Commencez directement par un titre ou une liste, sans aucune phrase d'introduction.`;

    // Instructions supplémentaires spécifiques selon la catégorie
    if (category === 'classification') {
      systemPromptContent += `\n\nINSTRUCTIONS SPÉCIALES POUR LA CLASSIFICATION:
1. Pour présenter la classification des emplois, CRÉEZ TOUJOURS UN TABLEAU MARKDOWN avec ces colonnes:
   | Niveau | Coefficient | Description et critères | Article de référence |
   | ------ | ----------- | ----------------------- | -------------------- |
   
2. Assurez-vous de:
   - Présenter CHAQUE NIVEAU HIÉRARCHIQUE et COEFFICIENT dans des rangées distinctes
   - Inclure les critères précis de chaque niveau
   - Ajouter les références aux articles exacts
   - Structurer le tableau du niveau le plus bas au plus élevé
   
3. Ne fusionnez JAMAIS les informations de plusieurs niveaux dans une même cellule ou ligne

4. Si la classification est organisée par filières ou catégories, créez plusieurs tableaux distincts:
   ## Classification - Filière Administrative
   [Tableau pour cette filière]
   
   ## Classification - Filière Technique
   [Tableau pour cette filière]
   
5. ÉVITEZ ABSOLUMENT de présenter la classification comme un bloc de texte continue.
   UTILISEZ EXCLUSIVEMENT LE FORMAT TABLEAU pour une meilleure lisibilité.`;
    }
    
    // Instructions supplémentaires pour les grilles de rémunération
    if (category === 'remuneration' && subcategory === 'grille') {
      systemPromptContent += `\n\nINSTRUCTIONS SPÉCIALES POUR LA GRILLE DE RÉMUNÉRATION:
1. Créez un tableau Markdown bien structuré avec ces colonnes:
   | Coefficient/Niveau | Salaire minimum | Date d'application | Article de référence |
   | ------------------ | --------------- | ------------------ | -------------------- |
   
2. Si les salaires sont organisés par catégorie ou filière, créez plusieurs tableaux distincts:
   ## Grille des salaires - Employés
   [Tableau pour cette catégorie]
   
   ## Grille des salaires - Techniciens
   [Tableau pour cette catégorie]
   
3. Incluez toujours:
   - Le coefficient ou niveau exact
   - Le montant précis du salaire
   - La date d'application de la grille (la plus récente disponible)
   - La référence de l'article ou avenant
   
4. Si les salaires minimum sont exprimés en différentes unités (horaire, mensuel, annuel), précisez-le clairement:
   | Coefficient | Salaire horaire | Salaire mensuel | Date d'application |
   
5. N'incluez QUE les données officielles présentes dans la convention collective.`;
    }
    
    const systemMessage = {
      role: "system",
      content: systemPromptContent
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
      
      // Vérifier si le contenu contient des tableaux et appliquer notre formateur
      if (containsTableData(cleanedContent)) {
        console.log(`Détection de données tabulaires dans la réponse, application du formateur de tableaux avancé`);
        cleanedContent = normalizeMarkdownTables(cleanedContent);
        console.log(`Formatage des tableaux terminé avec succès pour la section ${sectionType}`);
      }
      
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
    
    // Nettoyage avancé du contenu pour améliorer le formatage et supprimer les introductions
    let cleanedContent = content || '';
    
    // Supprimer les phrases d'introduction communes
    const introPatterns = [
      /^Voici (la|le|les|une|un|des) .{5,50}( :|:|\n)/i,
      /^Ci-dessous (figure|se trouve|vous trouverez) .{5,50}( :|:|\n)/i,
      /^(Je vous présente|Voici|Ci-dessous|D'après la convention|Selon la convention|Sur la base du texte) .{5,100}( :|:|\n)/i,
      /^(En analysant|Après analyse|Suite à l'analyse|Selon l'analyse) .{5,100}( :|:|\n)/i,
      /^Pour la convention collective IDCC \d+ .{5,80}( :|:|\n)/i,
      /^Basé(e)? sur le texte (fourni|de la convention) .{5,80}( :|:|\n)/i,
      /^Dans la convention collective (IDCC)? \d+ .{5,80}( :|:|\n)/i,
      /^La convention collective (IDCC)? \d+ .{5,80}( :|:|\n)/i
    ];
    
    // Supprimer les introductions
    for (const pattern of introPatterns) {
      cleanedContent = cleanedContent.replace(pattern, '');
    }
    
    // Supprimer aussi les phrases d'ouverture communes
    cleanedContent = cleanedContent.replace(/^(Voici|Ci-dessous) :/i, '');
    cleanedContent = cleanedContent.replace(/^Voici la réponse :/i, '');
    cleanedContent = cleanedContent.replace(/^Voici les informations demandées :/i, '');
    
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
    
    // Améliorer le formatage des tableaux (ajouter espaces pour alignement des colonnes)
    const tableRowPattern = /\|(.+)\|/g;
    cleanedContent = cleanedContent.replace(tableRowPattern, (match) => {
      return match.replace(/\|/g, ' | ').replace(/\s+\|\s+$/, ' |').replace(/^\s+\|\s+/, '| ');
    });
    
    // Assurer que les cellules des tableaux sont bien espacées
    cleanedContent = cleanedContent.replace(/\|\s*\|/g, '| |');
    
    // Amélioration des listes à puces (assurer espace après le tiret)
    cleanedContent = cleanedContent.replace(/^-([^\s])/gm, '- $1');
    
    // Améliorer l'espacement des titres
    cleanedContent = cleanedContent.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
    
    // Supprimer les espaces vides au début du texte après nettoyage
    cleanedContent = cleanedContent.trim();
    
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
    
    // Retourner le contenu nettoyé au lieu du contenu brut
    return { content: cleanedContent };
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