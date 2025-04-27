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
import { formatInfoGenerales } from './formatter';
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

/**
 * Fonction auxiliaire pour formater les noms de colonnes dans les tableaux
 */
function formatColumnName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1') // Ajouter un espace avant chaque majuscule
    .replace(/^./, str => str.toUpperCase()) // Majuscule première lettre
    .replace(/_/g, ' '); // Remplacer les underscores par des espaces
}

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

DIRECTIVE ABSOLUE N°1:
COMMENCE TOUJOURS TA RÉPONSE DIRECTEMENT PAR UN TITRE, UNE LISTE OU UN TABLEAU.
N'ÉCRIS JAMAIS DE PHRASE D'INTRODUCTION COMME "Voici", "En analysant", "D'après", "La convention stipule".
VA DIRECTEMENT AU CONTENU SANS AUCUN PRÉAMBULE OU INTRODUCTION.

DIRECTIVES STRICTES:
1. DÉBUTER IMMÉDIATEMENT par l'information demandée, sans aucune phrase introductive.
2. NE JAMAIS terminer par une conclusion.
3. NE PAS vous présenter ou expliquer votre rôle.
4. Utiliser UNIQUEMENT le document fourni, jamais de connaissances générales.
5. Citer précisément les articles et sections pertinents.
6. Structurer avec des titres, listes à puces et tableaux.
7. Si l'information n'est pas dans le document, répondre uniquement: "Information non présente dans la convention IDCC ${conventionId}."
8. Répondre de façon directe, factuellement, sans bavardage.
9. NE JAMAIS écrire "D'après la convention collective" ou "Selon le document" - allez directement au contenu.
11. RÈGLES STRICTES POUR LES TABLEAUX (PARTIE LA PLUS CRUCIALE - À RESPECTER ABSOLUMENT):
   - TOUJOURS utiliser UNIQUEMENT la syntaxe Markdown standard pour les tableaux
   - CHAQUE tableau DOIT commencer par une ligne d'en-tête claire et précise
   - CHAQUE tableau DOIT avoir une ligne de délimitation après l'en-tête avec exactement | --- | --- | --- |
   - JAMAIS créer de tableaux vides ou avec une seule ligne
   - JAMAIS fusionner plusieurs informations dans une même cellule
   - JAMAIS créer de cellules trop longues (max 100 caractères) - préférer plusieurs lignes
   - JAMAIS omettre ou doubler les séparateurs | entre colonnes
   - TOUJOURS espacer correctement avec un espace après chaque | et un espace avant chaque |
   - TOUJOURS utiliser un nombre cohérent de colonnes dans toutes les lignes d'un même tableau
   - TOUJOURS préférer plusieurs petits tableaux bien structurés plutôt qu'un grand tableau complexe
   - JAMAIS utiliser de HTML, ASCII art ou autre formatage non-Markdown pour les tableaux
   
   Exemple de format CORRECT à suivre absolument:
   | Catégorie | Valeur | Description |
   | --- | --- | --- |
   | Exemple 1 | 100 | Description détaillée |
   | Exemple 2 | 200 | Autre description |

12. N'UTILISEZ JAMAIS de balises HTML comme <br>, <div>, <p>, etc. Utilisez UNIQUEMENT la syntaxe Markdown standard.

FORMAT DE RÉPONSE: Commencez directement par un titre ou une liste, sans aucune phrase d'introduction.`;

    // Instructions supplémentaires spécifiques selon la catégorie
    if (category === 'classification') {
      systemPromptContent += `\n\nINSTRUCTIONS SPÉCIALES POUR LA CLASSIFICATION (À RESPECTER ABSOLUMENT):

1. Utilisez EXCLUSIVEMENT ce format tableau Markdown strict:
   | Niveau | Coefficient | Description et critères | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 120 | Description exacte | Article X.X |

2. Règles CRUCIALES à suivre:
   - Un tableau pour CHAQUE filière ou catégorie d'emploi
   - Une ligne distincte pour CHAQUE niveau ou échelon
   - Un seul coefficient par ligne (jamais de plages comme "120-140")
   - Descriptions courtes dans chaque cellule (max 100 caractères) 
   - JAMAIS de cellules fusionnées ou de lignes sans toutes les colonnes
   - TOUJOURS citer l'article exact pour chaque niveau
   - TOUJOURS structurer du niveau le plus bas au plus élevé

3. Si la classification distingue des filières/catégories:
   ### Classification - Filière Administrative
   | Niveau | Coefficient | Description et critères | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 120 | Description exacte | Article X.X |

   ### Classification - Filière Technique
   | Niveau | Coefficient | Description et critères | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 120 | Description exacte | Article X.X |

4. Si des descriptions sont trop longues, fragmentez-les en points principaux.

5. INTERDICTION ABSOLUE de présenter la classification sous forme de texte ou de liste.
   UTILISEZ EXCLUSIVEMENT LE FORMAT TABLEAU MARKDOWN pour toute la classification.`;
    }
    
    // Instructions supplémentaires pour les grilles de rémunération
    if (category === 'remuneration' && subcategory === 'grille') {
      systemPromptContent += `\n\nINSTRUCTIONS SPÉCIALES POUR LA GRILLE DE RÉMUNÉRATION (À RESPECTER ABSOLUMENT):

1. Utilisez EXCLUSIVEMENT ce format tableau Markdown strict:
   | Coefficient/Niveau | Salaire minimum | Date d'application | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 1600,00 € | 01/01/2023 | Article X.X |

2. Règles CRUCIALES à suivre:
   - Un tableau séparé pour CHAQUE catégorie professionnelle
   - Une ligne pour CHAQUE coefficient ou niveau
   - TOUJOURS indiquer les montants avec le symbole € et les virgules correctes
   - TOUJOURS préciser si le salaire est horaire, mensuel ou annuel
   - JAMAIS présenter les valeurs dans un format différent du tableau Markdown
   - TOUJOURS inclure la date d'application exacte au format JJ/MM/AAAA
   - JAMAIS omettre une colonne ou laisser une cellule vide

3. Si les salaires sont organisés par catégorie, utilisez ce format:
   ### Grille des salaires - Employés
   | Coefficient/Niveau | Salaire minimum | Date d'application | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 1600,00 € | 01/01/2023 | Article X.X |

   ### Grille des salaires - Techniciens
   | Coefficient/Niveau | Salaire minimum | Date d'application | Article de référence |
   | --- | --- | --- | --- |
   | Niveau 1 | 1700,00 € | 01/01/2023 | Article X.X |

4. Si différentes unités sont présentes, utilisez ce format exact:
   | Coefficient | Salaire horaire | Salaire mensuel | Date d'application |
   | --- | --- | --- | --- |
   | Niveau 1 | 10,57 € | 1600,00 € | 01/01/2023 |

5. UTILISEZ EXCLUSIVEMENT les informations exactes trouvées dans le document, avec une précision absolue sur les montants et les dates.

6. INTERDICTION TOTALE de présenter ces informations sous forme de texte, de liste ou tout autre format que le tableau Markdown standardisé.`;
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
    
    // Ajout du format JSON pour les catégories spécifiques qui nécessitent une structure stricte
    let completionOptions: any = {
      model: MODEL,
      messages: apiMessages as any,
      temperature: 0.3, // Valeur basse pour des réponses plus précises et cohérentes
      max_tokens: 32000 // Utiliser la capacité maximale de GPT-4.1 en sortie (32K tokens)
    };
    
    // Utiliser le format JSON pour certaines catégories spécifiques
    if (category === 'classification' || 
        (category === 'remuneration' && subcategory === 'grille') ||
        category === 'conges' ||
        category === 'informations-generales') {
      console.log(`Utilisation du format JSON structuré pour la catégorie: ${category} ${subcategory || ''}`);
      completionOptions.response_format = { type: "json_object" };
      
      // Ajout d'instructions pour le format JSON dans le dernier message
      const lastUserMessage = apiMessages[apiMessages.length - 1];
      if (lastUserMessage.role === 'user') {
        lastUserMessage.content += "\n\nFORMAT REQUIS: Réponds sous forme d'un objet JSON valide avec les propriétés suivantes: 'title' (string), 'data' (array d'objets contenant les données structurées). N'utilise pas de barres verticales comme séparateurs mais structure les données en objets JSON.";
      }
    }
    
    // Appel à l'API avec les options
    const completion = await openai.chat.completions.create(completionOptions);
    
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
    
    // Nettoyage du contenu en fonction de sa forme (JSON ou texte normal)
    let cleanedContent = content || '';
    
    // Vérifier si la réponse est au format JSON et la traiter si nécessaire
    if ((category === 'classification' || 
         (category === 'remuneration' && subcategory === 'grille') ||
         category === 'conges' ||
         category === 'informations-generales') && 
        cleanedContent.trim().startsWith('{')) {
      
      try {
        // Traiter le JSON reçu
        console.log("Réponse reçue au format JSON, conversion en Markdown structuré");
        const jsonResponse = JSON.parse(cleanedContent);
        
        // Construire un Markdown propre et structuré à partir du JSON
        let structuredMarkdown = '';
        
        // Ajouter le titre s'il existe
        if (jsonResponse.title) {
          structuredMarkdown += `## ${jsonResponse.title}\n\n`;
        }
        
        // Traiter les données selon la catégorie
        if (category === 'classification') {
          // Pour la classification, créer un tableau Markdown propre
          if (Array.isArray(jsonResponse.data) && jsonResponse.data.length > 0) {
            // Déterminer les colonnes du tableau en fonction des propriétés du premier objet
            const firstItem = jsonResponse.data[0];
            const columns = Object.keys(firstItem);
            
            // Créer l'en-tête du tableau
            structuredMarkdown += '| ' + columns.map(col => formatColumnName(col)).join(' | ') + ' |\n';
            // Créer la ligne de séparation
            structuredMarkdown += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
            
            // Ajouter chaque ligne du tableau
            jsonResponse.data.forEach(item => {
              structuredMarkdown += '| ' + columns.map(col => item[col] || '').join(' | ') + ' |\n';
            });
            structuredMarkdown += '\n';
          }
        } else if (category === 'remuneration' && subcategory === 'grille') {
          // Pour les grilles de salaire, potentiellement plusieurs tableaux par catégorie
          if (jsonResponse.categories && Array.isArray(jsonResponse.categories)) {
            jsonResponse.categories.forEach(category => {
              if (category.name) {
                structuredMarkdown += `### ${category.name}\n\n`;
              }
              
              if (Array.isArray(category.data) && category.data.length > 0) {
                // Créer un tableau pour cette catégorie
                const columns = Object.keys(category.data[0]);
                
                // En-tête
                structuredMarkdown += '| ' + columns.map(col => formatColumnName(col)).join(' | ') + ' |\n';
                // Séparation
                structuredMarkdown += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
                
                // Lignes
                category.data.forEach(item => {
                  structuredMarkdown += '| ' + columns.map(col => item[col] || '').join(' | ') + ' |\n';
                });
                structuredMarkdown += '\n';
              }
            });
          } else if (Array.isArray(jsonResponse.data)) {
            // Format alternatif avec un seul tableau
            // Déterminer les colonnes du tableau en fonction des propriétés du premier objet
            if (jsonResponse.data.length > 0) {
              const columns = Object.keys(jsonResponse.data[0]);
              
              // Créer l'en-tête du tableau
              structuredMarkdown += '| ' + columns.map(col => formatColumnName(col)).join(' | ') + ' |\n';
              // Créer la ligne de séparation
              structuredMarkdown += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
              
              // Ajouter chaque ligne du tableau
              jsonResponse.data.forEach(item => {
                structuredMarkdown += '| ' + columns.map(col => item[col] || '').join(' | ') + ' |\n';
              });
              structuredMarkdown += '\n';
            }
          }
        } else if (category === 'conges') {
          // Pour les congés, format tableau ou liste selon la structure
          if (Array.isArray(jsonResponse.data) && jsonResponse.data.length > 0) {
            // Déterminer si on doit faire un tableau ou une liste basée sur la structure
            const firstItem = jsonResponse.data[0];
            
            if (Object.keys(firstItem).length >= 2) {
              // Assez de colonnes pour un tableau
              const columns = Object.keys(firstItem);
              
              // Créer l'en-tête du tableau
              structuredMarkdown += '| ' + columns.map(col => formatColumnName(col)).join(' | ') + ' |\n';
              // Créer la ligne de séparation
              structuredMarkdown += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
              
              // Ajouter chaque ligne du tableau
              jsonResponse.data.forEach(item => {
                structuredMarkdown += '| ' + columns.map(col => item[col] || '').join(' | ') + ' |\n';
              });
            } else {
              // Format liste pour les structures simples
              jsonResponse.data.forEach(item => {
                const key = Object.keys(item)[0];
                structuredMarkdown += `- **${key}**: ${item[key]}\n`;
              });
            }
            structuredMarkdown += '\n';
          }
        } else if (category === 'informations-generales') {
          // Format spécial pour les informations générales
          // Créer un tableau à deux colonnes Champ | Valeur
          structuredMarkdown += '| Champ | Valeur |\n';
          structuredMarkdown += '| --- | --- |\n';
          
          if (Array.isArray(jsonResponse.data) && jsonResponse.data.length > 0) {
            // Si les données sont un tableau d'objets
            jsonResponse.data.forEach(item => {
              const field = Object.keys(item)[0];
              const value = item[field] || '';
              structuredMarkdown += `| **${field}** | ${value} |\n`;
            });
          } else if (typeof jsonResponse.data === 'object' && jsonResponse.data !== null) {
            // Si les données sont un objet unique
            Object.entries(jsonResponse.data).forEach(([field, value]) => {
              structuredMarkdown += `| **${field}** | ${value} |\n`;
            });
          }
          
          structuredMarkdown += '\n';
        }
        
        // Notes ou informations supplémentaires
        if (jsonResponse.notes) {
          structuredMarkdown += '### Notes supplémentaires\n\n';
          if (Array.isArray(jsonResponse.notes)) {
            jsonResponse.notes.forEach(note => {
              structuredMarkdown += `- ${note}\n`;
            });
          } else {
            structuredMarkdown += jsonResponse.notes + '\n';
          }
        }
        
        // Articles de référence
        if (jsonResponse.references) {
          structuredMarkdown += '### Articles de référence\n\n';
          if (Array.isArray(jsonResponse.references)) {
            jsonResponse.references.forEach(ref => {
              structuredMarkdown += `- ${ref}\n`;
            });
          } else {
            structuredMarkdown += jsonResponse.references + '\n';
          }
        }
        
        // Utiliser le Markdown structuré comme contenu nettoyé
        cleanedContent = structuredMarkdown.trim();
        console.log("Conversion JSON → Markdown réussie");
      } catch (jsonError) {
        console.error("Erreur lors du parsing du JSON:", jsonError);
        // En cas d'erreur de parsing, continuer avec le contenu brut
        console.log("Traitement comme du texte standard suite à l'erreur de parsing JSON");
      }
    } else {
      // Traitement standard pour le texte non-JSON
      
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
      
      // Supprimer les phrases d'introduction communes
      const introPatterns = [
        // Introductions simples
        /^Voici (la|le|les|une|un|des) .{5,100}(\.|\n| :|:)/i,
        /^Ci-dessous (figure|se trouve|vous trouverez) .{5,100}(\.|\n| :|:)/i,
        /^(Je vous présente|Voici|Ci-dessous|D'après|Selon|Sur la base) .{5,150}(\.|\n| :|:)/i,
        
        // Analyses et examens
        /^(En analysant|Après analyse|Suite à l'analyse|Selon l'analyse|L'analyse de) .{5,150}(\.|\n| :|:)/i,
        /^(En examinant|Après examen|Suite à l'examen|L'examen de) .{5,150}(\.|\n| :|:)/i,
        
        // Références à la convention
        /^(Pour|Concernant|Dans|Sur|À propos de) la convention collective .{5,100}(\.|\n| :|:)/i,
        /^(Pour|Concernant|Dans|Sur|À propos de) l'IDCC \d+ .{5,100}(\.|\n| :|:)/i,
        /^Basé(e)? sur (le texte (fourni|de la convention)|la convention|l'analyse) .{5,120}(\.|\n| :|:)/i,
        /^(Dans|Pour|Selon) la convention collective (IDCC)? .{5,120}(\.|\n| :|:)/i,
        /^La convention collective (IDCC)? .{5,120}(\.|\n| :|:)/i,
        
        // Introductions spécifiques aux informations
        /^Les informations (suivantes|ci-dessous|extraites) .{5,120}(\.|\n| :|:)/i,
        /^(Après|Suite à) (recherche|vérification|consultation) .{5,120}(\.|\n| :|:)/i,
        /^(Conformément à|En vertu de) .{5,120}(\.|\n| :|:)/i
      ];
      
      let introductionRemoved = false;
      // Supprimer les introductions
      for (const pattern of introPatterns) {
        if (pattern.test(cleanedContent)) {
          console.log(`Détection d'une introduction dans la réponse, suppression automatique`);
          cleanedContent = cleanedContent.replace(pattern, '');
          introductionRemoved = true;
        }
      }
      
      // Supprimer aussi les phrases d'ouverture communes
      if (/^(Voici|Ci-dessous) :/i.test(cleanedContent) || 
          /^Voici la réponse :/i.test(cleanedContent) || 
          /^Voici les informations demandées :/i.test(cleanedContent)) {
        cleanedContent = cleanedContent.replace(/^(Voici|Ci-dessous) :/i, '');
        cleanedContent = cleanedContent.replace(/^Voici la réponse :/i, '');
        cleanedContent = cleanedContent.replace(/^Voici les informations demandées :/i, '');
        introductionRemoved = true;
      }
      
      if (introductionRemoved) {
        cleanedContent = cleanedContent.trim();
      }
      
      // Vérifier si le contenu contient des tableaux et appliquer notre formateur
      if (containsTableData(cleanedContent)) {
        console.log(`Détection de données tabulaires dans la réponse, application du formateur de tableaux avancé`);
        cleanedContent = normalizeMarkdownTables(cleanedContent);
        console.log(`Formatage des tableaux terminé avec succès`);
      }
    }
    
    // Utiliser la fonction formatColumnName définie à l'extérieur
    
    // Appliquer un formatage spécial pour les informations générales
    if (category === 'informations-generales') {
      console.log('Application du formateur spécial pour les informations générales');
      cleanedContent = formatInfoGenerales(cleanedContent);
      console.log('Formatage des informations générales terminé');
    }
    
    // Sauvegarde de la section en base de données si ce n'est pas une requête de chat
    if (category && category !== 'chat') {
      const sectionType = subcategory ? `${category}-${subcategory}` : category;
      
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
      content: cleanedContent
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
      // Introductions simples
      /^Voici (la|le|les|une|un|des) .{5,100}(\.|\n| :|:)/i,
      /^Ci-dessous (figure|se trouve|vous trouverez) .{5,100}(\.|\n| :|:)/i,
      /^(Je vous présente|Voici|Ci-dessous|D'après|Selon|Sur la base) .{5,150}(\.|\n| :|:)/i,
      
      // Analyses et examens
      /^(En analysant|Après analyse|Suite à l'analyse|Selon l'analyse|L'analyse de) .{5,150}(\.|\n| :|:)/i,
      /^(En examinant|Après examen|Suite à l'examen|L'examen de) .{5,150}(\.|\n| :|:)/i,
      
      // Références à la convention
      /^(Pour|Concernant|Dans|Sur|À propos de) la convention collective .{5,100}(\.|\n| :|:)/i,
      /^(Pour|Concernant|Dans|Sur|À propos de) l'IDCC \d+ .{5,100}(\.|\n| :|:)/i,
      /^Basé(e)? sur (le texte (fourni|de la convention)|la convention|l'analyse) .{5,120}(\.|\n| :|:)/i,
      /^(Dans|Pour|Selon) la convention collective (IDCC)? .{5,120}(\.|\n| :|:)/i,
      /^La convention collective (IDCC)? .{5,120}(\.|\n| :|:)/i,
      
      // Introductions spécifiques aux informations
      /^Les informations (suivantes|ci-dessous|extraites) .{5,120}(\.|\n| :|:)/i,
      /^(Après|Suite à) (recherche|vérification|consultation) .{5,120}(\.|\n| :|:)/i,
      /^(Conformément à|En vertu de) .{5,120}(\.|\n| :|:)/i
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
    return { content: cleanedContent || content };
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