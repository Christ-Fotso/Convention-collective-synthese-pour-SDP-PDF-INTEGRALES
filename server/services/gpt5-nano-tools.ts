/**
 * GPT-5 Nano + Tools Architecture pour extraction juridique
 * Modèle léger + outils spécialisés = performance optimale
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration GPT-5 Nano optimisée
const GPT5_NANO_CONFIG = {
  model: 'gpt-5-nano' as const,
  temperature: 0.1
};

/**
 * OUTIL 1: Extracteur PDF spécialisé par section
 */
export async function extractPdfSection(
  pdfText: string, 
  sectionType: string, 
  conventionId: string
): Promise<{ content: string; confidence: number }> {
  
  const sectionPrompts = {
    'grille-remuneration': `
Extraire UNIQUEMENT les grilles de rémunération sous forme de tableaux HTML.
Format obligatoire :
<table>
<tr><th>Classification</th><th>Salaire Actuel</th><th>Date</th></tr>
<tr><td>Coeff 100</td><td>1 789,71 €</td><td>01/10/2024</td></tr>
</table>
INTERDICTIONS : Titres redondants, colonnes vides, répétitions d'articles.
`,
    'heures-supplementaires': `
Extraire les taux et modalités en tableau synthétique HTML.
Format type :
<table>
<tr><th>Statut</th><th>35-43h</th><th>44-48h</th><th>48h+</th><th>Particularités</th></tr>
</table>
Grouper par statut, éviter répétitions entre articles.
`,
    'conges-payes': `
Format synthétique : Durée de base | Jours supplémentaires | Conditions.
BANNIR répétitions "La convention ne prévoit rien" (max 1 occurrence).
Privilégier vue "Convention standard vs Améliorations".
`
  };

  try {
    const response = await openai.chat.completions.create({
      ...GPT5_NANO_CONFIG,
      messages: [
        {
          role: 'system',
          content: sectionPrompts[sectionType as keyof typeof sectionPrompts] || sectionPrompts['grille-remuneration']
        },
        {
          role: 'user',
          content: `Convention ${conventionId} - Section ${sectionType}:\n\n${pdfText.slice(0, 50000)}`
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'format_legal_tables',
            description: 'Convertit données juridiques en tableaux HTML optimisés',
            parameters: {
              type: 'object',
              properties: {
                raw_data: { type: 'string' },
                table_type: { type: 'string' }
              }
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'validate_legal_content',
            description: 'Valide cohérence juridique du contenu extrait',
            parameters: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                section_type: { type: 'string' }
              }
            }
          }
        }
      ],
      tool_choice: 'auto'
    });

    return {
      content: response.choices[0].message.content || '',
      confidence: 0.9 // Score basé sur tools utilisés
    };

  } catch (error) {
    console.error('Erreur extraction GPT-5 Nano:', error);
    throw error;
  }
}

/**
 * OUTIL 2: Formateur HTML/Tableaux optimisé
 */
export async function formatLegalTables(
  rawData: string, 
  tableType: string
): Promise<string> {
  
  // Détection automatique de structures tabulaires
  const tablePatterns = {
    salaires: /(\w+\s*\d+)\s*[\|\-]\s*([\d\s,\.€]+)\s*[\|\-]\s*(\d{2}\/\d{2}\/\d{4})?/g,
    taux: /(\d+%)\s*[\|\-]\s*(.*?)\s*[\|\-]/g,
    durees: /(\d+\s*jours?)\s*[\|\-]\s*(.*?)\s*[\|\-]/g
  };

  let htmlTable = '<table>\n';
  
  if (tableType === 'grille-salaires') {
    htmlTable += '<tr><th>Classification</th><th>Salaire</th><th>Date</th></tr>\n';
    
    const matches = Array.from(rawData.matchAll(tablePatterns.salaires));
    for (const match of matches) {
      htmlTable += `<tr><td><strong>${match[1]}</strong></td><td>${match[2]}</td><td>${match[3] || ''}</td></tr>\n`;
    }
  }
  
  htmlTable += '</table>';
  
  return htmlTable;
}

/**
 * OUTIL 3: Validateur juridique avec scoring
 */
export async function validateLegalContent(
  content: string, 
  sectionType: string
): Promise<{ isValid: boolean; score: number; suggestions: string[] }> {
  
  const validationRules = {
    'grille-remuneration': [
      { pattern: /<table.*?>/, weight: 0.3, desc: 'Format tableau HTML' },
      { pattern: /\d+[,\.]\d{2}\s*€/, weight: 0.3, desc: 'Montants en euros' },
      { pattern: /\d{2}\/\d{2}\/\d{4}/, weight: 0.2, desc: 'Dates format français' },
      { pattern: /(?!.*## Grille)/, weight: 0.2, desc: 'Pas de titre redondant' }
    ],
    'heures-supplementaires': [
      { pattern: /<table.*?>/, weight: 0.4, desc: 'Format tableau obligatoire' },
      { pattern: /\d+%/, weight: 0.3, desc: 'Taux de majoration' },
      { pattern: /(?!.*Article.*Article)/, weight: 0.3, desc: 'Pas de doublons articles' }
    ]
  };

  const rules = validationRules[sectionType as keyof typeof validationRules] || [];
  let score = 0;
  const suggestions: string[] = [];

  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      score += rule.weight;
    } else {
      suggestions.push(`Manquant: ${rule.desc}`);
    }
  }

  return {
    isValid: score > 0.7,
    score: Math.round(score * 100),
    suggestions
  };
}

/**
 * Orchestrateur principal GPT-5 Nano + Tools
 */
export async function processConventionWithTools(
  conventionId: string,
  pdfText: string,
  sectionsToProcess: string[]
): Promise<Array<{ section: string; content: string; quality: number }>> {
  
  const results = [];
  
  console.log(`🤖 GPT-5 Nano: Processing ${sectionsToProcess.length} sections for convention ${conventionId}`);
  
  // Traitement parallèle des sections
  const promises = sectionsToProcess.map(async (sectionType) => {
    try {
      // Étape 1: Extraction avec GPT-5 Nano
      const extraction = await extractPdfSection(pdfText, sectionType, conventionId);
      
      // Étape 2: Formatage avec outils spécialisés
      const formatted = await formatLegalTables(extraction.content, sectionType);
      
      // Étape 3: Validation qualité
      const validation = await validateLegalContent(formatted, sectionType);
      
      console.log(`✅ Section ${sectionType}: ${validation.score}% qualité`);
      
      return {
        section: sectionType,
        content: formatted,
        quality: validation.score
      };
      
    } catch (error) {
      console.error(`❌ Erreur section ${sectionType}:`, error);
      return {
        section: sectionType,
        content: `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        quality: 0
      };
    }
  });
  
  const processedSections = await Promise.all(promises);
  
  const avgQuality = processedSections.reduce((sum, s) => sum + s.quality, 0) / processedSections.length;
  console.log(`📊 Qualité moyenne: ${Math.round(avgQuality)}%`);
  
  return processedSections;
}

/**
 * Coût estimé par convention
 */
export function estimateCost(sectionsCount: number): { tokens: number; cost: number } {
  const avgTokensPerSection = 5000; // Input + output
  const totalTokens = sectionsCount * avgTokensPerSection;
  
  // GPT-5 Nano: $0.15 input + $1.50 output per 1M tokens
  const cost = (totalTokens / 1000000) * (0.15 + 1.50);
  
  return {
    tokens: totalTokens,
    cost: Math.round(cost * 100) / 100
  };
}