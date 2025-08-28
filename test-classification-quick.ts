/**
 * Test rapide de classification - 1 convention, résultats immédiats
 */

import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const googleAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface QuickResult {
  model: string;
  prompt_name: string;
  content_length: number;
  has_salary_terms: boolean;
  salary_terms: string[];
  has_classification: boolean;
  preview: string;
}

class QuickTester {
  private testConvention: any = null;

  constructor() {
    this.loadSingleConvention();
  }

  private loadSingleConvention() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    
    // Prendre la convention Handicapés (IDCC 413) - elle avait de bons résultats
    for (const [name, conv] of Object.entries(data)) {
      const convData = conv as any;
      if (convData.idcc === '413') {
        this.testConvention = {
          name,
          idcc: convData.idcc,
          content: convData.sections["Classification_Con_+_Détails"].contenu
        };
        break;
      }
    }
    
    console.log(`📋 Convention test: ${this.testConvention.name} (IDCC ${this.testConvention.idcc})`);
    console.log(`📊 Taille: ${this.testConvention.content.length} caractères\n`);
  }

  private getPrompts() {
    return {
      "Baseline (actuel)": `Analysez cette convention collective pour extraire les informations de classification.
Répondez avec un JSON au format suivant :
{
  "classification-details": {
    "contenu": "[Structure classifications détaillée ou RAS]"
  }
}`,

      "Anti-salaires": `# EXTRACTION CLASSIFICATION PURE - SANS SALAIRES

Analysez cette convention collective pour extraire UNIQUEMENT la structure hiérarchique de classification.

## EXTRAYEZ SEULEMENT :
✅ Niveaux, échelons, coefficients, degrés
✅ Catégories professionnelles (employés, agents de maîtrise, cadres...)
✅ Critères de classification (expérience, autonomie, responsabilité...)

## EXCLUEZ ABSOLUMENT :
❌ Salaires, rémunérations, montants en euros
❌ Valeurs du point, indices de rémunération
❌ Grilles de salaires, barèmes de paie
❌ Primes, indemnités, avantages financiers

Répondez JSON : {"classification-details": {"contenu": "[Structure hiérarchique pure]"}}`,

      "Ultra-précis": `# EXTRACTION CLASSIFICATION HIÉRARCHIQUE PURE

Créez un tableau de classification montrant SEULEMENT :
- La hiérarchie des niveaux/échelons (I, II, III...)
- Les coefficients associés (100, 120, 150... SANS montants €)
- Les critères de chaque niveau (autonomie, formation, expérience)

MOTS INTERDITS : Euro, €, salaire, rémunération, paie, montant, valeur du point

Répondez JSON : {"classification-details": {"contenu": "[Tableau hiérarchique]"}}`
    };
  }

  private analyzeContent(content: string): { hasSalary: boolean, salaryTerms: string[], hasClassification: boolean } {
    const salaryPatterns = [
      /\b\d+[,.]?\d*\s*€/g,
      /\b\d+[,.]?\d*\s*euros?\b/gi,
      /salaire/gi,
      /rémunération/gi,
      /valeur\s+du\s+point/gi,
      /montant/gi
    ];

    const salaryTerms: string[] = [];
    let hasSalary = false;

    salaryPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        hasSalary = true;
        salaryTerms.push(...matches);
      }
    });

    const classificationPatterns = [/niveau/gi, /échelon/gi, /coefficient/gi, /catégorie/gi];
    const hasClassification = classificationPatterns.some(p => p.test(content));

    return {
      hasSalary,
      salaryTerms: [...new Set(salaryTerms)],
      hasClassification
    };
  }

  private async testModel(modelName: string, promptName: string, prompt: string): Promise<QuickResult> {
    try {
      let content = '';
      
      if (modelName === 'GPT-4o Mini') {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt + "\n\n=== CONVENTION ===\n\n" + this.testConvention.content }
          ],
          temperature: 0.1,
          max_tokens: 3000
        });
        content = response.choices[0]?.message?.content || "";
      } else if (modelName === 'Gemini 2.5 Pro') {
        const response = await googleAI.models.generateContent({
          model: "gemini-2.5-pro",
          contents: [{
            role: "user",
            parts: [{ text: prompt + "\n\n=== CONVENTION ===\n\n" + this.testConvention.content }]
          }],
          config: {
            temperature: 0.1,
            maxOutputTokens: 3000
          }
        });
        content = response.text || "";
      }

      const analysis = this.analyzeContent(content);
      
      return {
        model: modelName,
        prompt_name: promptName,
        content_length: content.length,
        has_salary_terms: analysis.hasSalary,
        salary_terms: analysis.salaryTerms,
        has_classification: analysis.hasClassification,
        preview: content.substring(0, 500) + (content.length > 500 ? '...' : '')
      };
    } catch (error: any) {
      return {
        model: modelName,
        prompt_name: promptName,
        content_length: 0,
        has_salary_terms: false,
        salary_terms: [],
        has_classification: false,
        preview: `ERREUR: ${error.message}`
      };
    }
  }

  async runQuickTest(): Promise<void> {
    console.log('🚀 TEST RAPIDE DE CLASSIFICATION\n');
    
    const prompts = this.getPrompts();
    const models = ['GPT-4o Mini', 'Gemini 2.5 Pro'];
    const results: QuickResult[] = [];

    for (const [promptName, promptText] of Object.entries(prompts)) {
      console.log(`\n🧪 PROMPT: ${promptName}`);
      console.log('-'.repeat(50));
      
      for (const model of models) {
        process.stdout.write(`  ⏳ ${model}... `);
        const result = await this.testModel(model, promptName, promptText);
        results.push(result);
        
        const salaryFlag = result.has_salary_terms ? '💰 CONTAMINATION' : '✅ PUR';
        const structFlag = result.has_classification ? '📊 STRUCT' : '❌ VIDE';
        console.log(`${salaryFlag} | ${structFlag} | ${result.content_length} chars`);
        
        if (result.has_salary_terms && result.salary_terms.length > 0) {
          console.log(`    🚨 Termes salariaux: ${result.salary_terms.slice(0, 5).join(', ')}`);
        }
      }
    }

    this.showComparison(results);
    this.showBestExtracts(results);
  }

  private showComparison(results: QuickResult[]): void {
    console.log('\n\n📊 COMPARAISON RÉSULTATS');
    console.log('='.repeat(60));

    // Grouper par prompt
    const promptGroups: { [key: string]: QuickResult[] } = {};
    results.forEach(r => {
      if (!promptGroups[r.prompt_name]) promptGroups[r.prompt_name] = [];
      promptGroups[r.prompt_name].push(r);
    });

    for (const [promptName, promptResults] of Object.entries(promptGroups)) {
      const pureCount = promptResults.filter(r => !r.has_salary_terms).length;
      const structCount = promptResults.filter(r => r.has_classification).length;
      
      console.log(`\n🎯 ${promptName}:`);
      console.log(`   ✅ Extractions pures: ${pureCount}/${promptResults.length}`);
      console.log(`   📊 Structure détectée: ${structCount}/${promptResults.length}`);
      
      promptResults.forEach(r => {
        const status = r.has_salary_terms ? '❌ Contaminé' : '✅ Pur';
        console.log(`   ${r.model}: ${status} (${r.content_length} chars)`);
      });
    }

    // Recommandation
    const bestPromptResults = Object.entries(promptGroups)
      .map(([name, results]) => ({
        name,
        purityRate: results.filter(r => !r.has_salary_terms).length / results.length,
        avgLength: results.reduce((sum, r) => sum + r.content_length, 0) / results.length
      }))
      .sort((a, b) => b.purityRate - a.purityRate);

    console.log(`\n💡 RECOMMANDATION:`);
    console.log(`   🏆 Meilleur prompt: "${bestPromptResults[0].name}"`);
    console.log(`   📈 Taux de pureté: ${Math.round(bestPromptResults[0].purityRate * 100)}%`);
  }

  private showBestExtracts(results: QuickResult[]): void {
    console.log('\n\n📄 MEILLEURS EXTRAITS');
    console.log('='.repeat(60));

    const pureResults = results.filter(r => !r.has_salary_terms && r.has_classification);
    
    pureResults.forEach(result => {
      console.log(`\n✨ ${result.model} - ${result.prompt_name}`);
      console.log('-'.repeat(40));
      console.log(result.preview);
      console.log();
    });

    if (pureResults.length === 0) {
      console.log('❌ Aucune extraction pure avec structure trouvée.');
    }
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new QuickTester();
  tester.runQuickTest()
    .then(() => console.log('\n✅ Test rapide terminé!'))
    .catch(console.error);
}