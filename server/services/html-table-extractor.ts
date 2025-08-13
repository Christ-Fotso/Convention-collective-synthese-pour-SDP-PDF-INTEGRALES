import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SectionResult {
  section: string;
  content: any;
  status: 'success' | 'error' | 'empty';
  error?: string;
}

export interface HtmlTableResult {
  conventionId: string;
  conventionName: string;
  results: SectionResult[];
  totalSections: number;
  successCount: number;
  processingTime: number;
  htmlTableCount: number;
}

export class HtmlTableExtractor {
  
  /**
   * EXTRACTION SPÉCIALISÉE AVEC TABLEAUX HTML OBLIGATOIRES
   */
  async extractWithHtmlTables(conventionText: string, conventionId: string, conventionName: string): Promise<HtmlTableResult> {
    const startTime = Date.now();
    
    // Sections prioritaires qui bénéficient le plus des tableaux HTML
    const sectionsWithTables = [
      'cotisation-prevoyance',
      'cotisation-mutuelle', 
      'evenement-familial',
      'classification-details',
      'grille-remuneration',
      'preavis',
      'indemnite-licenciement',
      'heures-supplementaires'
    ];

    const prompt = this.buildHtmlTablePrompt();
    
    try {
      const tokens = this.estimateTokens(conventionText);
      
      let result;
      if (tokens > 800000) {
        // Chunking intelligent pour conventions lourdes
        result = await this.processWithChunking(conventionText, prompt);
      } else {
        result = await this.callGemini(conventionText, prompt);
      }

      const parsed = this.parseMultiSectionResponse(result, sectionsWithTables);
      
      // Compter les tableaux HTML générés
      const htmlTableCount = parsed.filter(r => 
        r.status === 'success' && 
        r.content.contenu.includes('<table>') &&
        r.content.contenu.includes('<tr>') &&
        r.content.contenu.includes('<td>')
      ).length;
      
      return {
        conventionId,
        conventionName,
        results: parsed,
        totalSections: sectionsWithTables.length,
        successCount: parsed.filter(r => r.status === 'success').length,
        processingTime: Date.now() - startTime,
        htmlTableCount
      };
      
    } catch (error) {
      console.error('Erreur extraction HTML:', error);
      return this.createErrorResult(conventionId, conventionName, sectionsWithTables, startTime, error);
    }
  }

  /**
   * Construction du prompt spécialisé pour tableaux HTML
   */
  private buildHtmlTablePrompt(): string {
    return `# EXTRACTION SPÉCIALISÉE AVEC TABLEAUX HTML - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire les sections suivantes avec des TABLEAUX HTML OBLIGATOIRES pour toutes les données structurées.

## RÈGLES TABLEAUX HTML STRICTES :

### 1. UTILISATION OBLIGATOIRE DES TABLEAUX HTML :
- Dès qu'il y a 2 colonnes d'informations ou plus : TABLEAU HTML
- Pour cotisations, taux, pourcentages, durées multiples : TABLEAU HTML
- Pour classifications, grilles, indemnités par tranches : TABLEAU HTML
- JAMAIS de format liste avec tirets pour des données tabulaires

### 2. FORMAT HTML EXACT REQUIS :
\`\`\`html
<table>
<tr>
  <th>Colonne 1</th>
  <th>Colonne 2</th>
  <th>Colonne 3</th>
</tr>
<tr>
  <td>Valeur 1</td>
  <td>Valeur 2</td>
  <td>Valeur 3</td>
</tr>
</table>
\`\`\`

### 3. RÈGLES SPÉCIFIQUES :
- Fusion de cellules identiques : \`<td rowspan="2">Valeur commune</td>\`
- Headers clairs : Type, Catégorie, Taux, Répartition, etc.
- Toujours inclure les unités (%, €, jours, heures)
- Séparer patronal/salarial dans des colonnes distinctes

### 4. EXEMPLES TYPES À TRANSFORMER :

**❌ INTERDIT (format liste) :**
- Capital décès : TA 0,17% (100% patronale), TB 0,17% (100% patronale)
- Rente éducation : TA 0,13% (0,0875% patronale, 0,0425% salariale)

**✅ OBLIGATOIRE (tableau HTML) :**
<table>
<tr><th>Type de garantie</th><th>Catégorie TA</th><th>Catégorie TB</th><th>Part patronale</th><th>Part salariale</th></tr>
<tr><td>Capital décès</td><td>0,17%</td><td>0,17%</td><td>100%</td><td>0%</td></tr>
<tr><td>Rente éducation</td><td>0,13%</td><td>0,13%</td><td>67,3%</td><td>32,7%</td></tr>
</table>

Répondez EXCLUSIVEMENT avec un JSON valide au format strict suivant :

{
  "cotisation-prevoyance": {
    "contenu": "[Tableau HTML complet ou RAS]"
  },
  "cotisation-mutuelle": {
    "contenu": "[Tableau HTML complet ou RAS]"
  },
  "evenement-familial": {
    "contenu": "[Tableau HTML avec événements et durées ou RAS]"
  },
  "classification-details": {
    "contenu": "[Tableau HTML structure classifications ou RAS]"
  },
  "grille-remuneration": {
    "contenu": "[Tableau HTML grille salaires ou RAS]"
  },
  "preavis": {
    "contenu": "[Tableau HTML durées préavis ou RAS]"
  },
  "indemnite-licenciement": {
    "contenu": "[Tableau HTML calcul indemnités ou RAS]"
  },
  "heures-supplementaires": {
    "contenu": "[Tableau HTML taux majorations ou RAS]"
  }
}

## RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Tableaux HTML OBLIGATOIRES pour toute donnée structurée
- Si aucune info trouvée pour une section : "RAS"
- Terminologie exacte de la convention
- Format français pour chiffres/dates (1 234,56 € et 25,5%)
- Headers de tableaux en français
- AUCUNE analyse ni interprétation
- Maximum 2 niveaux d'indentation dans tableaux`;
  }

  /**
   * Traitement avec chunking pour conventions lourdes
   */
  private async processWithChunking(text: string, prompt: string): Promise<string> {
    const chunks = this.splitTextIntelligently(text);
    console.log(`🔄 Chunking: ${chunks.length} chunks pour traitement HTML`);
    
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📊 Traitement chunk ${i+1}/${chunks.length} (HTML)`);
      try {
        const result = await this.callGemini(chunks[i], prompt);
        results.push(result);
      } catch (error) {
        console.error(`❌ Erreur chunk ${i+1}:`, error.message);
        results.push('{}'); // Chunk vide en cas d'erreur
      }
    }
    
    return this.consolidateChunkResults(results);
  }

  /**
   * Découpage intelligent du texte
   */
  private splitTextIntelligently(text: string): string[] {
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
    const maxChunkSize = 800000;
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);
      
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
   * Consolidation des résultats de chunks avec fusion intelligente
   */
  private consolidateChunkResults(results: string[]): string {
    const consolidated: any = {};
    
    for (const result of results) {
      try {
        const parsed = JSON.parse(result);
        for (const [section, content] of Object.entries(parsed)) {
          if (content && (content as any).contenu && (content as any).contenu !== "RAS") {
            if (!consolidated[section]) {
              consolidated[section] = content;
            } else {
              // Fusion intelligente: prendre le contenu le plus riche
              const existing = consolidated[section].contenu;
              const newContent = (content as any).contenu;
              
              if (newContent.length > existing.length) {
                consolidated[section] = content;
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur parsing chunk:', error);
      }
    }
    
    return JSON.stringify(consolidated);
  }

  /**
   * Estimation simple des tokens
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
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
  ): HtmlTableResult {
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
      htmlTableCount: 0
    };
  }
}

export const htmlTableExtractor = new HtmlTableExtractor();