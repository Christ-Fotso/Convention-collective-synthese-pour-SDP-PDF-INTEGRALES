import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SectionResult {
  section: string;
  content: any;
  status: 'success' | 'error' | 'empty';
  error?: string;
}

export interface MultiSectionResult {
  conventionId: string;
  conventionName: string;
  results: SectionResult[];
  totalSections: number;
  successCount: number;
  processingTime: number;
  chunked: boolean;
}

export class MultiSectionExtractor {
  
  /**
   * BLOC 1: 18 sections simples en 1 appel Gemini 2.5 Pro
   */
  async extractSimpleSections(conventionText: string, conventionId: string, conventionName: string): Promise<MultiSectionResult> {
    const startTime = Date.now();
    
    const simpleSections = [
      'informations-generales',
      'delai-prevenance',
      'durees-travail',
      'amenagement-temps-travail',
      'temps-partiel',
      'cet',
      'evenement-familial',
      'cotisation-prevoyance',
      'cotisation-mutuelle',
      'accident-travail',
      'maladie',
      'maternite-paternite',
      'apprenti',
      'contrat-professionnalisation',
      'stagiaire',
      'majoration-dimanche',
      'majoration-ferie',
      'majoration-nuit'
    ];

    const prompt = this.buildSimpleSectionsPrompt();
    
    try {
      // Vérifier la taille et chunker si nécessaire
      const tokens = this.estimateTokens(conventionText);
      const chunked = tokens > 800000; // ~800K tokens limite sécurité
      
      let result;
      if (chunked) {
        result = await this.processWithChunking(conventionText, prompt, 'simple');
      } else {
        result = await this.callGemini(conventionText, prompt);
      }

      const parsed = this.parseMultiSectionResponse(result, simpleSections);
      
      return {
        conventionId,
        conventionName,
        results: parsed,
        totalSections: simpleSections.length,
        successCount: parsed.filter(r => r.status === 'success').length,
        processingTime: Date.now() - startTime,
        chunked
      };
      
    } catch (error) {
      console.error(`Erreur extraction sections simples ${conventionId}:`, error);
      return this.createErrorResult(conventionId, conventionName, simpleSections, startTime, error);
    }
  }

  /**
   * BLOC 2: 10 sections moyennes en 1 appel Gemini 2.5 Pro
   */
  async extractMediumSections(conventionText: string, conventionId: string, conventionName: string): Promise<MultiSectionResult> {
    const startTime = Date.now();
    
    const mediumSections = [
      'heures-supplementaires',
      'forfait-jours',
      'conges-payes',
      'classification-details',
      'indemnite-licenciement',
      'indemnite-mise-retraite',
      'indemnite-depart-retraite',
      'indemnite-rupture-conventionnelle',
      'preavis',
      'indemnite-precarite'
    ];

    const prompt = this.buildMediumSectionsPrompt();
    
    try {
      const tokens = this.estimateTokens(conventionText);
      const chunked = tokens > 800000;
      
      let result;
      if (chunked) {
        result = await this.processWithChunking(conventionText, prompt, 'medium');
      } else {
        result = await this.callGemini(conventionText, prompt);
      }

      const parsed = this.parseMultiSectionResponse(result, mediumSections);
      
      return {
        conventionId,
        conventionName,
        results: parsed,
        totalSections: mediumSections.length,
        successCount: parsed.filter(r => r.status === 'success').length,
        processingTime: Date.now() - startTime,
        chunked
      };
      
    } catch (error) {
      console.error(`Erreur extraction sections moyennes ${conventionId}:`, error);
      return this.createErrorResult(conventionId, conventionName, mediumSections, startTime, error);
    }
  }

  /**
   * Estimation rapide du nombre de tokens
   */
  private estimateTokens(text: string): number {
    // Estimation: ~4 caractères par token en français
    return Math.ceil(text.length / 4);
  }

  /**
   * Chunking intelligent pour grosses conventions
   */
  private async processWithChunking(conventionText: string, prompt: string, type: 'simple' | 'medium'): Promise<string> {
    console.log(`Chunking activé pour convention de ${this.estimateTokens(conventionText)} tokens`);
    
    // Découpage par sections thématiques principales
    const chunks = this.splitByThematicSections(conventionText);
    const results = [];
    
    for (const chunk of chunks) {
      if (this.estimateTokens(chunk) > 900000) {
        // Si chunk encore trop gros, découpage simple
        const subChunks = this.splitBySize(chunk, 800000);
        for (const subChunk of subChunks) {
          const result = await this.callGemini(subChunk, prompt);
          results.push(result);
        }
      } else {
        const result = await this.callGemini(chunk, prompt);
        results.push(result);
      }
    }
    
    // Consolidation des résultats
    return this.consolidateChunkResults(results, type);
  }

  /**
   * Découpage thématique intelligent
   */
  private splitByThematicSections(text: string): string[] {
    const thematicMarkers = [
      'TITRE I', 'TITRE II', 'TITRE III', 'TITRE IV', 'TITRE V',
      'CHAPITRE I', 'CHAPITRE II', 'CHAPITRE III', 'CHAPITRE IV',
      'Article 1', 'Article 2', 'Article 3', 'Article 4', 'Article 5',
      'CLASSIFICATION', 'REMUNERATION', 'TEMPS DE TRAVAIL', 'CONGES',
      'FORMATION', 'PREVOYANCE', 'MUTUELLE', 'LICENCIEMENT'
    ];
    
    const chunks = [];
    let currentChunk = '';
    let currentSize = 0;
    const maxChunkSize = 800000; // tokens
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);
      
      // Si on trouve un marqueur thématique et que le chunk actuel est assez gros
      const isThematicBreak = thematicMarkers.some(marker => 
        line.toUpperCase().includes(marker.toUpperCase())
      );
      
      if (isThematicBreak && currentSize > maxChunkSize * 0.3) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
        currentSize = lineTokens;
      } else {
        currentChunk += line + '\n';
        currentSize += lineTokens;
        
        // Si chunk trop gros, forcer la coupure
        if (currentSize > maxChunkSize) {
          chunks.push(currentChunk);
          currentChunk = '';
          currentSize = 0;
        }
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Découpage simple par taille
   */
  private splitBySize(text: string, maxTokens: number): string[] {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let currentSize = 0;
    
    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);
      
      if (currentSize + lineTokens > maxTokens && currentChunk.trim()) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
        currentSize = lineTokens;
      } else {
        currentChunk += line + '\n';
        currentSize += lineTokens;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Consolidation des résultats de chunks
   */
  private consolidateChunkResults(results: string[], type: 'simple' | 'medium'): string {
    // Pour l'instant, simple concaténation
    // TODO: Implémenter logique de fusion intelligente
    return results.join('\n\n--- CHUNK SEPARATOR ---\n\n');
  }

  /**
   * Appel Gemini avec gestion d'erreurs
   */
  private async callGemini(text: string, prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { text: "\n\n=== TEXTE DE LA CONVENTION ===\n\n" + text }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 50000,
        responseMimeType: "application/json"
      }
    });

    return response.text || "";
  }

  /**
   * Parse la réponse multi-sections en JSON
   */
  private parseMultiSectionResponse(response: string, expectedSections: string[]): SectionResult[] {
    const results: SectionResult[] = [];
    
    try {
      const parsed = JSON.parse(response);
      
      for (const sectionName of expectedSections) {
        const content = parsed[sectionName];
        
        if (!content) {
          results.push({
            section: sectionName,
            content: { contenu: "RAS" },
            status: 'empty'
          });
        } else if (content.contenu === "RAS" || !content.contenu) {
          results.push({
            section: sectionName,
            content: { contenu: "RAS" },
            status: 'empty'
          });
        } else {
          results.push({
            section: sectionName,
            content: content,
            status: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      // Fallback: créer des résultats vides
      for (const sectionName of expectedSections) {
        results.push({
          section: sectionName,
          content: { contenu: "RAS" },
          status: 'error',
          error: 'JSON parsing failed'
        });
      }
    }
    
    return results;
  }

  /**
   * Création résultat d'erreur
   */
  private createErrorResult(
    conventionId: string, 
    conventionName: string, 
    sections: string[], 
    startTime: number, 
    error: any
  ): MultiSectionResult {
    return {
      conventionId,
      conventionName,
      results: sections.map(section => ({
        section,
        content: { contenu: "RAS" },
        status: 'error' as const,
        error: error.message || 'Unknown error'
      })),
      totalSections: sections.length,
      successCount: 0,
      processingTime: Date.now() - startTime,
      chunked: false
    };
  }

  /**
   * Construction du prompt pour sections simples
   */
  private buildSimpleSectionsPrompt(): string {
    return `# EXTRACTION 18 SECTIONS SIMPLES - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire simultanément les 18 sections suivantes.
Répondez EXCLUSIVEMENT avec un JSON valide au format strict suivant :

{
  "informations-generales": {
    "contenu": "[Contenu extrait ou RAS]",
    "idcc": "[IDCC si trouvé]",
    "champ-application": "[Champ si trouvé]"
  },
  "delai-prevenance": {
    "contenu": "[Délais fin période essai ou RAS]"
  },
  "durees-travail": {
    "contenu": "[Limites horaires ou RAS]"
  },
  "amenagement-temps-travail": {
    "contenu": "[Dispositifs aménagement ou RAS]"
  },
  "temps-partiel": {
    "contenu": "[Règles temps partiel ou RAS]"
  },
  "cet": {
    "contenu": "[Compte épargne temps ou RAS]"
  },
  "evenement-familial": {
    "contenu": "[Congés événements familiaux ou RAS]"
  },
  "cotisation-prevoyance": {
    "contenu": "[Prévoyance obligatoire ou RAS]"
  },
  "cotisation-mutuelle": {
    "contenu": "[Complémentaire santé ou RAS]"
  },
  "accident-travail": {
    "contenu": "[Maintien salaire AT/MP ou RAS]"
  },
  "maladie": {
    "contenu": "[Maintien salaire maladie ou RAS]"
  },
  "maternite-paternite": {
    "contenu": "[Maintien salaire congés familiaux ou RAS]"
  },
  "apprenti": {
    "contenu": "[Rémunération apprentis ou RAS]"
  },
  "contrat-professionnalisation": {
    "contenu": "[Dispositions contrats pro ou RAS]"
  },
  "stagiaire": {
    "contenu": "[Gratification stagiaires ou RAS]"
  },
  "majoration-dimanche": {
    "contenu": "[Compensations travail dimanche ou RAS]"
  },
  "majoration-ferie": {
    "contenu": "[Compensations jours fériés ou RAS]"
  },
  "majoration-nuit": {
    "contenu": "[Compensations travail nuit ou RAS]"
  }
}

## RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Si aucune info trouvée pour une section : "RAS"
- Terminologie exacte de la convention
- Format français pour chiffres/dates
- AUCUNE analyse ni interprétation
- Extraction des informations strictement présentes`;
  }

  /**
   * Construction du prompt pour sections moyennes
   */
  private buildMediumSectionsPrompt(): string {
    return `# EXTRACTION 10 SECTIONS MOYENNES - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire les 10 sections de complexité moyenne.
Répondez EXCLUSIVEMENT avec un JSON valide au format strict suivant :

{
  "heures-supplementaires": {
    "contenu": "[Taux, contingent, repos compensateur ou RAS]"
  },
  "forfait-jours": {
    "contenu": "[Cadres forfait jours, suivi charge ou RAS]"
  },
  "conges-payes": {
    "contenu": "[Durées CP, jours supplémentaires ou RAS]"
  },
  "classification-details": {
    "contenu": "[Structure classifications détaillée ou RAS]"
  },
  "indemnite-licenciement": {
    "contenu": "[Formule calcul indemnité licenciement ou RAS]"
  },
  "indemnite-mise-retraite": {
    "contenu": "[Indemnité mise à la retraite ou RAS]"
  },
  "indemnite-depart-retraite": {
    "contenu": "[Indemnité départ volontaire retraite ou RAS]"
  },
  "indemnite-rupture-conventionnelle": {
    "contenu": "[Indemnité rupture conventionnelle ou RAS]"
  },
  "preavis": {
    "contenu": "[Durées préavis par catégorie ou RAS]"
  },
  "indemnite-precarite": {
    "contenu": "[Indemnité fin CDD ou RAS]"
  }
}

## RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Si aucune info trouvée pour une section : "RAS"
- Tableaux autorisés si nécessaires (format texte)
- Terminologie exacte de la convention
- Format français pour chiffres/dates
- AUCUNE analyse ni interprétation
- Extraction détaillée avec conditions et modalités`;
  }
}

export const multiSectionExtractor = new MultiSectionExtractor();