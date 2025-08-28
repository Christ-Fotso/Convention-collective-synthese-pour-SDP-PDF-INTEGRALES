/**
 * Script de test des modèles IA pour extraction de classification
 * Test plusieurs modèles avec prompts optimisés pour éviter les salaires
 */

import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Configuration des modèles
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const googleAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface TestResult {
  model: string;
  convention: string;
  idcc: string;
  prompt_version: string;
  content_length: number;
  processing_time: number;
  extracted_content: string;
  contains_salary_terms: boolean;
  salary_terms_found: string[];
  classification_structure_detected: boolean;
  error?: string;
}

class ClassificationModelTester {
  private testConventions: Array<{name: string, idcc: string, content: string}> = [];
  private results: TestResult[] = [];

  constructor() {
    this.loadTestData();
  }

  /**
   * Charge les conventions de test depuis data.json
   */
  private loadTestData() {
    try {
      const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
      
      // Prendre les 3 meilleures conventions avec du contenu classification
      const testIds = ['1388', '413', '2336']; // Pétrole, Handicapés, Habitat
      
      for (const [convName, convData] of Object.entries(data)) {
        const conv = convData as any;
        if (testIds.includes(conv.idcc)) {
          const classContent = conv.sections?.["Classification_Con_+_Détails"]?.contenu;
          if (classContent && classContent.trim() !== 'RAS' && classContent.length > 1000) {
            this.testConventions.push({
              name: convName,
              idcc: conv.idcc,
              content: classContent
            });
          }
        }
      }

      console.log(`✅ ${this.testConventions.length} conventions de test chargées :`);
      this.testConventions.forEach(conv => {
        console.log(`   - ${conv.name} (IDCC ${conv.idcc}) - ${conv.content.length} caractères`);
      });
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      process.exit(1);
    }
  }

  /**
   * PROMPT VERSION 1: Prompt actuel (baseline)
   */
  private getBaselinePrompt(): string {
    return `Analysez cette convention collective pour extraire les informations de classification.
    
Répondez avec un JSON au format suivant :
{
  "classification-details": {
    "contenu": "[Structure classifications détaillée ou RAS]"
  }
}`;
  }

  /**
   * PROMPT VERSION 2: Prompt optimisé anti-salaires
   */
  private getOptimizedPromptV2(): string {
    return `# EXTRACTION CLASSIFICATION PURE - SANS SALAIRES

Analysez cette convention collective pour extraire UNIQUEMENT la structure hiérarchique de classification.

## EXTRAYEZ SEULEMENT :
✅ Niveaux, échelons, coefficients, degrés
✅ Catégories professionnelles (employés, agents de maîtrise, cadres...)  
✅ Critères de classification (expérience, autonomie, responsabilité...)
✅ Fonctions types et intitulés de postes
✅ Conditions de passage d'un niveau à l'autre

## EXCLUEZ ABSOLUMENT :
❌ Salaires, rémunérations, montants en euros
❌ Valeurs du point, indices de rémunération  
❌ Grilles de salaires, barèmes de paie
❌ Primes, indemnités, avantages financiers
❌ Tout chiffre lié à la rémunération

## FORMAT DE RÉPONSE JSON :
{
  "classification-details": {
    "contenu": "[Structure hiérarchique pure - niveaux, échelons, critères]"
  }
}

RÈGLE ABSOLUE : Ne mentionnez AUCUNE information financière ou salariale.`;
  }

  /**
   * PROMPT VERSION 3: Prompt ultra-précis avec exemples
   */
  private getOptimizedPromptV3(): string {
    return `# EXTRACTION CLASSIFICATION HIÉRARCHIQUE PURE

Extrayez UNIQUEMENT la structure organisationnelle des emplois, sans aucun élément financier.

## OBJECTIF PRÉCIS :
Créer un tableau de classification montrant :
- La hiérarchie des niveaux/échelons (I, II, III... ou A, B, C... ou 1, 2, 3...)
- Les coefficients associés (100, 120, 150... SANS les montants €)
- Les critères de chaque niveau (autonomie, formation requise, expérience...)

## EXEMPLE DE CONTENU ATTENDU :
"
| Niveau | Coefficient | Critères |
|---------|-------------|----------|
| Niveau I | Coef. 120 | Exécution de tâches simples sous contrôle |
| Niveau II | Coef. 140 | Autonomie partielle, CAP requis |
| Niveau III | Coef. 160 | Encadrement d'équipe, expérience 5 ans |
"

## MOTS INTERDITS (ne pas inclure) :
- Euro, €, salaire, rémunération, paie
- Montant, somme, tarif, prix
- "valeur du point", "indice"
- Chiffres avec €, CHF, devise

## FORMAT JSON ATTENDU :
{
  "classification-details": {
    "contenu": "[Structure hiérarchique en tableau markdown ou texte structuré]"
  }
}

Ne répondez QUE avec la structure hiérarchique des emplois.`;
  }

  /**
   * Test avec OpenAI GPT-4
   */
  private async testOpenAI(convention: any, prompt: string, promptVersion: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Vous êtes un expert en conventions collectives." },
          { role: "user", content: prompt + "\n\n=== CONVENTION ===\n\n" + convention.content }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content || "";
      
      return this.analyzeResult("GPT-4o Mini", convention, promptVersion, content, Date.now() - startTime);
    } catch (error: any) {
      return {
        model: "GPT-4o Mini",
        convention: convention.name,
        idcc: convention.idcc,
        prompt_version: promptVersion,
        content_length: 0,
        processing_time: Date.now() - startTime,
        extracted_content: "",
        contains_salary_terms: false,
        salary_terms_found: [],
        classification_structure_detected: false,
        error: error.message
      };
    }
  }

  /**
   * Test avec Google Gemini
   */
  private async testGemini(convention: any, prompt: string, promptVersion: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await googleAI.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [{
          role: "user",
          parts: [{ text: prompt + "\n\n=== CONVENTION ===\n\n" + convention.content }]
        }],
        config: {
          temperature: 0.1,
          maxOutputTokens: 4000
        }
      });

      const content = response.text || "";
      
      return this.analyzeResult("Gemini 2.5 Pro", convention, promptVersion, content, Date.now() - startTime);
    } catch (error: any) {
      return {
        model: "Gemini 2.5 Pro",
        convention: convention.name,
        idcc: convention.idcc,
        prompt_version: promptVersion,
        content_length: 0,
        processing_time: Date.now() - startTime,
        extracted_content: "",
        contains_salary_terms: false,
        salary_terms_found: [],
        classification_structure_detected: false,
        error: error.message
      };
    }
  }

  /**
   * Test avec Claude (si disponible)
   */
  private async testClaude(convention: any, prompt: string, promptVersion: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          { role: "user", content: prompt + "\n\n=== CONVENTION ===\n\n" + convention.content }
        ]
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : "";
      
      return this.analyzeResult("Claude 3.5 Sonnet", convention, promptVersion, content, Date.now() - startTime);
    } catch (error: any) {
      return {
        model: "Claude 3.5 Sonnet", 
        convention: convention.name,
        idcc: convention.idcc,
        prompt_version: promptVersion,
        content_length: 0,
        processing_time: Date.now() - startTime,
        extracted_content: "",
        contains_salary_terms: false,
        salary_terms_found: [],
        classification_structure_detected: false,
        error: error.message
      };
    }
  }

  /**
   * Analyse le résultat pour détecter les salaires et la structure
   */
  private analyzeResult(model: string, convention: any, promptVersion: string, content: string, processingTime: number): TestResult {
    // Détection des termes salariaux
    const salaryTerms = [
      /\b\d+[,.]?\d*\s*€/g, // Montants en euros
      /\b\d+[,.]?\d*\s*euros?\b/gi,
      /salaire/gi, /rémunération/gi, /paie/gi,
      /valeur\s+du\s+point/gi,
      /indice.*rémunération/gi,
      /barème.*sal/gi,
      /grille.*sal/gi,
      /montant/gi, /tarif/gi
    ];

    const foundSalaryTerms: string[] = [];
    let containsSalaryTerms = false;

    salaryTerms.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        containsSalaryTerms = true;
        foundSalaryTerms.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Détection structure de classification
    const structureIndicators = [
      /niveau/gi, /échelon/gi, /coefficient/gi,
      /catégorie/gi, /classification/gi,
      /emploi.*cadre/gi, /agent.*maîtrise/gi,
      /tableau.*classification/gi
    ];

    const hasClassificationStructure = structureIndicators.some(pattern => pattern.test(content));

    return {
      model,
      convention: convention.name,
      idcc: convention.idcc,
      prompt_version: promptVersion,
      content_length: content.length,
      processing_time: processingTime,
      extracted_content: content,
      contains_salary_terms: containsSalaryTerms,
      salary_terms_found: [...new Set(foundSalaryTerms)],
      classification_structure_detected: hasClassificationStructure
    };
  }

  /**
   * Lance tous les tests
   */
  async runAllTests(): Promise<void> {
    console.log('\n🚀 DÉMARRAGE DES TESTS DE CLASSIFICATION\n');
    console.log('='.repeat(80));

    const prompts = [
      { version: "Baseline", prompt: this.getBaselinePrompt() },
      { version: "Optimisé v2", prompt: this.getOptimizedPromptV2() },
      { version: "Ultra-précis v3", prompt: this.getOptimizedPromptV3() }
    ];

    for (const convention of this.testConventions) {
      console.log(`\n📋 Test convention: ${convention.name} (IDCC ${convention.idcc})`);
      console.log('-'.repeat(60));

      for (const {version, prompt} of prompts) {
        console.log(`\n  🧪 Prompt: ${version}`);
        
        // Test OpenAI
        console.log('    ⏳ GPT-4o Mini...');
        const gptResult = await this.testOpenAI(convention, prompt, version);
        this.results.push(gptResult);
        this.logQuickResult(gptResult);

        // Test Gemini  
        console.log('    ⏳ Gemini 2.5 Pro...');
        const geminiResult = await this.testGemini(convention, prompt, version);
        this.results.push(geminiResult);
        this.logQuickResult(geminiResult);

        // Test Claude (si clé disponible)
        if (process.env.ANTHROPIC_API_KEY) {
          console.log('    ⏳ Claude 3.5 Sonnet...');
          const claudeResult = await this.testClaude(convention, prompt, version);
          this.results.push(claudeResult);
          this.logQuickResult(claudeResult);
        }

        // Pause entre prompts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.generateComparisonReport();
  }

  /**
   * Log rapide du résultat
   */
  private logQuickResult(result: TestResult) {
    if (result.error) {
      console.log(`      ❌ Erreur: ${result.error}`);
    } else {
      const salaryFlag = result.contains_salary_terms ? '💰 SALAIRES!' : '✅ Pur';
      const structFlag = result.classification_structure_detected ? '📊 Structure' : '❌ Pas struct';
      console.log(`      ${salaryFlag} | ${structFlag} | ${result.content_length} chars | ${result.processing_time}ms`);
    }
  }

  /**
   * Génère le rapport de comparaison
   */
  private generateComparisonReport() {
    console.log('\n\n📊 RAPPORT DE COMPARAISON DÉTAILLÉ');
    console.log('='.repeat(80));

    // Analyse par prompt version
    const promptVersions = [...new Set(this.results.map(r => r.prompt_version))];
    
    for (const version of promptVersions) {
      console.log(`\n🎯 PROMPT VERSION: ${version}`);
      console.log('-'.repeat(40));
      
      const versionResults = this.results.filter(r => r.prompt_version === version && !r.error);
      const salaryContamination = versionResults.filter(r => r.contains_salary_terms).length;
      const structureDetection = versionResults.filter(r => r.classification_structure_detected).length;
      const avgTime = versionResults.reduce((sum, r) => sum + r.processing_time, 0) / versionResults.length;

      console.log(`  Résultats valides: ${versionResults.length}`);
      console.log(`  🏆 Sans contamination salariale: ${versionResults.length - salaryContamination}/${versionResults.length}`);
      console.log(`  📊 Structure détectée: ${structureDetection}/${versionResults.length}`);
      console.log(`  ⏱️  Temps moyen: ${Math.round(avgTime)}ms`);

      // Détail par modèle pour cette version
      const models = [...new Set(versionResults.map(r => r.model))];
      for (const model of models) {
        const modelResults = versionResults.filter(r => r.model === model);
        const modelSalaryFree = modelResults.filter(r => !r.contains_salary_terms).length;
        console.log(`    ${model}: ${modelSalaryFree}/${modelResults.length} purs`);
      }
    }

    // Recommandations
    this.generateRecommendations();
    
    // Export détaillé
    this.exportDetailedResults();
  }

  /**
   * Génère les recommandations
   */
  private generateRecommendations() {
    console.log('\n💡 RECOMMANDATIONS');
    console.log('='.repeat(40));

    // Trouve le meilleur prompt (moins de contamination salariale)
    const promptStats = {};
    const promptVersions = [...new Set(this.results.map(r => r.prompt_version))];
    
    for (const version of promptVersions) {
      const versionResults = this.results.filter(r => r.prompt_version === version && !r.error);
      const pureResults = versionResults.filter(r => !r.contains_salary_terms);
      const purityRate = versionResults.length > 0 ? (pureResults.length / versionResults.length) : 0;
      
      promptStats[version] = {
        purityRate,
        totalResults: versionResults.length,
        pureResults: pureResults.length
      };
    }

    // Trier par taux de pureté
    const sortedPrompts = Object.entries(promptStats)
      .sort(([,a], [,b]) => (b as any).purityRate - (a as any).purityRate);

    console.log('\n🏆 Classement des prompts (% sans salaires):');
    sortedPrompts.forEach(([version, stats], index) => {
      const s = stats as any;
      const percentage = Math.round(s.purityRate * 100);
      console.log(`  ${index + 1}. ${version}: ${percentage}% (${s.pureResults}/${s.totalResults})`);
    });

    // Meilleur modèle
    const modelStats = {};
    const models = [...new Set(this.results.map(r => r.model))];
    
    for (const model of models) {
      const modelResults = this.results.filter(r => r.model === model && !r.error);
      const pureResults = modelResults.filter(r => !r.contains_salary_terms);
      modelStats[model] = {
        purityRate: modelResults.length > 0 ? (pureResults.length / modelResults.length) : 0,
        avgTime: modelResults.reduce((sum, r) => sum + r.processing_time, 0) / modelResults.length
      };
    }

    console.log('\n🤖 Performance par modèle:');
    Object.entries(modelStats).forEach(([model, stats]) => {
      const s = stats as any;
      const percentage = Math.round(s.purityRate * 100);
      console.log(`  ${model}: ${percentage}% purs, ${Math.round(s.avgTime)}ms moy.`);
    });

    const bestPrompt = sortedPrompts[0]?.[0];
    console.log(`\n✨ RECOMMANDATION: Utilisez le prompt "${bestPrompt}" pour minimiser la contamination salariale.`);
  }

  /**
   * Exporte les résultats détaillés
   */
  private exportDetailedResults() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalTests: this.results.length,
      summary: {
        totalResults: this.results.length,
        validResults: this.results.filter(r => !r.error).length,
        pureResults: this.results.filter(r => !r.error && !r.contains_salary_terms).length
      },
      results: this.results,
      recommendations: {
        bestPrompt: "Sera déterminé après analyse",
        bestModel: "Sera déterminé après analyse"
      }
    };

    const filename = `classification-test-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Rapport détaillé exporté: ${filename}`);

    // Export des extraits pour inspection manuelle
    const samplesFilename = `classification-samples-${Date.now()}.md`;
    let samplesContent = '# Échantillons d\'extraction de classification\n\n';
    
    for (const result of this.results.filter(r => !r.error)) {
      samplesContent += `## ${result.convention} - ${result.model} - ${result.prompt_version}\n\n`;
      samplesContent += `**Contamination salariale:** ${result.contains_salary_terms ? 'OUI' : 'NON'}\n`;
      if (result.salary_terms_found.length > 0) {
        samplesContent += `**Termes trouvés:** ${result.salary_terms_found.join(', ')}\n`;
      }
      samplesContent += `**Structure détectée:** ${result.classification_structure_detected ? 'OUI' : 'NON'}\n\n`;
      samplesContent += '```\n' + result.extracted_content.substring(0, 1000) + '...\n```\n\n';
      samplesContent += '---\n\n';
    }

    fs.writeFileSync(samplesFilename, samplesContent);
    console.log(`📄 Échantillons exportés: ${samplesFilename}`);
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ClassificationModelTester();
  
  console.log('🧪 TESTEUR DE CLASSIFICATION IA');
  console.log('Ce script va tester 3 prompts sur 3 modèles avec 3 conventions');
  console.log('Temps estimé: ~2-3 minutes\n');

  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Tests terminés! Consultez les fichiers de rapport générés.');
    })
    .catch(error => {
      console.error('❌ Erreur durant les tests:', error);
    });
}