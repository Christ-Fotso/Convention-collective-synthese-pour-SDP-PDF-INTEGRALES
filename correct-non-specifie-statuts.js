/**
 * Script de correction intelligente des statuts "non spécifié" dans les classifications
 * Convention Collective Analytics Platform
 */

import fs from 'fs';

class StatutCorrector {
  constructor(dataFilePath = './data.json') {
    this.dataFilePath = dataFilePath;
    this.data = null;
    this.corrections = [];
    this.rules = this.initializeRules();
  }

  /**
   * Initialise les règles de correction basées sur l'analyse contextuelle
   */
  initializeRules() {
    return {
      // Règles basées sur les qualifications/diplômes
      qualification: [
        {
          pattern: /sans\s+(C\.A\.P|CAP|qualification|diplôme)/i,
          replacement: "Ouvrier/Employé débutant",
          confidence: 0.9
        },
        {
          pattern: /titulaire\s+du?\s*(C\.A\.P|CAP|BEP)/i,
          replacement: "Ouvrier/Employé qualifié",
          confidence: 0.9
        },
        {
          pattern: /titulaire.*?(B\.P|BP|Bac\s+Pro|BTM|BTS)/i,
          replacement: "Technicien/Agent de maîtrise",
          confidence: 0.8
        },
        {
          pattern: /titulaire.*?(B\.M|BM|Master|Ingénieur)/i,
          replacement: "Cadre",
          confidence: 0.8
        }
      ],

      // Règles basées sur les fonctions
      fonction: [
        {
          pattern: /(vendeur|commercial|vente)/i,
          replacement: "Employé",
          confidence: 0.7
        },
        {
          pattern: /(assistant|aide|auxiliaire)/i,
          replacement: "Employé",
          confidence: 0.8
        },
        {
          pattern: /(chef|responsable|coordinateur|superviseur)/i,
          replacement: "Agent de maîtrise",
          confidence: 0.7
        },
        {
          pattern: /(directeur|manager|cadre)/i,
          replacement: "Cadre",
          confidence: 0.8
        },
        {
          pattern: /(ouvrier|fabrication|production)/i,
          replacement: "Ouvrier",
          confidence: 0.8
        }
      ],

      // Règles basées sur les coefficients
      coefficient: [
        {
          range: [100, 180],
          replacement: "Ouvrier/Employé",
          confidence: 0.6
        },
        {
          range: [181, 240],
          replacement: "Agent de maîtrise/Technicien",
          confidence: 0.6
        },
        {
          range: [241, 400],
          replacement: "Cadre",
          confidence: 0.6
        }
      ],

      // Règles basées sur l'autonomie et responsabilités
      autonomie: [
        {
          pattern: /sous\s+(contrôle|surveillance|direction)/i,
          replacement: "Ouvrier/Employé exécutant",
          confidence: 0.7
        },
        {
          pattern: /(coordonne|organise|dirige)/i,
          replacement: "Agent de maîtrise",
          confidence: 0.7
        },
        {
          pattern: /(responsabilité|autonomie.*large|initiative)/i,
          replacement: "Cadre",
          confidence: 0.6
        }
      ],

      // Règles spéciales pour certains secteurs
      secteur: [
        {
          secteur: /boulangerie|pâtisserie/i,
          pattern: /personnel.*fabrication/i,
          replacement: "Ouvrier boulanger/pâtissier",
          confidence: 0.8
        },
        {
          secteur: /commerce|vente/i,
          pattern: /personnel.*vente/i,
          replacement: "Employé de commerce",
          confidence: 0.8
        }
      ]
    };
  }

  /**
   * Charge les données
   */
  loadData() {
    try {
      const rawData = fs.readFileSync(this.dataFilePath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log(`Données chargées: ${Object.keys(this.data).length} conventions`);
    } catch (error) {
      console.error(`Erreur lors du chargement: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Analyse et corrige toutes les conventions
   */
  processAllConventions() {
    console.log('\nAnalyse et correction des statuts "non spécifié"...\n');

    for (const [conventionName, conventionData] of Object.entries(this.data)) {
      const classificationSection = conventionData.sections?.["Classification_Con_+_Détails"];
      
      if (classificationSection) {
        this.processConvention(conventionName, conventionData, classificationSection);
      }
    }
  }

  /**
   * Traite une convention spécifique
   */
  processConvention(conventionName, conventionData, section) {
    const content = section.contenu;
    
    if (!/statut non spécifié|non spécifié/gi.test(content)) {
      return; // Pas de corrections nécessaires
    }

    console.log(`\n📋 Traitement: ${conventionName} (IDCC: ${conventionData.idcc})`);
    
    // Parse le contenu HTML pour extraire les lignes de tableau
    const tableRows = this.extractTableRows(content);
    let correctedContent = content;
    let conventionCorrections = [];

    tableRows.forEach((row, index) => {
      if (/statut non spécifié|non spécifié/gi.test(row.html)) {
        const correction = this.analyzeAndCorrect(row, conventionName, conventionData);
        
        if (correction.suggestedStatus !== "Statut non spécifié") {
          // Applique la correction
          const oldHtml = row.html;
          const newHtml = oldHtml.replace(
            /(statut\s+)?non spécifié/gi, 
            correction.suggestedStatus
          );
          
          correctedContent = correctedContent.replace(oldHtml, newHtml);
          
          conventionCorrections.push({
            ligne: index + 1,
            ancien: "Statut non spécifié",
            nouveau: correction.suggestedStatus,
            confiance: correction.confidence,
            raisons: correction.reasons,
            contexte: row.cells.slice(0, 3).join(' | ')
          });
          
          console.log(`  ✓ Ligne ${index + 1}: "${correction.suggestedStatus}" (confiance: ${correction.confidence})`);
          console.log(`    Contexte: ${row.cells.slice(0, 3).join(' | ')}`);
          console.log(`    Raisons: ${correction.reasons.join(', ')}`);
        }
      }
    });

    if (conventionCorrections.length > 0) {
      // Met à jour le contenu dans les données
      this.data[conventionName].sections["Classification_Con_+_Détails"].contenu = correctedContent;
      
      this.corrections.push({
        convention: conventionName,
        idcc: conventionData.idcc,
        correctionsCount: conventionCorrections.length,
        corrections: conventionCorrections
      });
      
      console.log(`  📊 Total corrections appliquées: ${conventionCorrections.length}`);
    } else {
      console.log(`  ⚠️ Aucune correction automatique possible`);
    }
  }

  /**
   * Extrait les lignes de tableau du HTML
   */
  extractTableRows(content) {
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = trRegex.exec(content)) !== null) {
      const rowHtml = match[0];
      const cells = this.extractCells(match[1]);
      
      rows.push({
        html: rowHtml,
        cells: cells
      });
    }

    return rows;
  }

  /**
   * Extrait les cellules d'une ligne
   */
  extractCells(rowContent) {
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    const cells = [];
    let match;

    while ((match = cellRegex.exec(rowContent)) !== null) {
      const cellContent = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    return cells;
  }

  /**
   * Analyse et propose une correction pour une ligne
   */
  analyzeAndCorrect(row, conventionName, conventionData) {
    const cells = row.cells;
    const fullText = cells.join(' ').toLowerCase();
    
    let bestMatch = {
      suggestedStatus: "Statut non spécifié",
      confidence: 0,
      reasons: []
    };

    // Analyse par qualification
    this.rules.qualification.forEach(rule => {
      if (rule.pattern.test(fullText) && rule.confidence > bestMatch.confidence) {
        bestMatch = {
          suggestedStatus: rule.replacement,
          confidence: rule.confidence,
          reasons: ['Qualification identifiée']
        };
      }
    });

    // Analyse par fonction
    this.rules.fonction.forEach(rule => {
      if (rule.pattern.test(fullText)) {
        const newConfidence = rule.confidence * 0.9; // Légèrement moins fiable que la qualification
        if (newConfidence > bestMatch.confidence) {
          bestMatch = {
            suggestedStatus: rule.replacement,
            confidence: newConfidence,
            reasons: ['Fonction identifiée']
          };
        }
      }
    });

    // Analyse par coefficient (si disponible)
    const coefficientCell = cells.find(cell => /^\d{2,3}$/.test(cell.trim()));
    if (coefficientCell) {
      const coeff = parseInt(coefficientCell);
      this.rules.coefficient.forEach(rule => {
        if (coeff >= rule.range[0] && coeff <= rule.range[1]) {
          const newConfidence = rule.confidence * 0.8; // Moins fiable que fonction/qualification
          if (newConfidence > bestMatch.confidence) {
            bestMatch = {
              suggestedStatus: rule.replacement,
              confidence: newConfidence,
              reasons: [`Coefficient ${coeff} dans la fourchette ${rule.range[0]}-${rule.range[1]}`]
            };
          }
        }
      });
    }

    // Analyse par autonomie
    this.rules.autonomie.forEach(rule => {
      if (rule.pattern.test(fullText)) {
        const newConfidence = rule.confidence * 0.85;
        if (newConfidence > bestMatch.confidence) {
          bestMatch = {
            suggestedStatus: rule.replacement,
            confidence: newConfidence,
            reasons: ['Niveau d\'autonomie identifié']
          };
        }
      }
    });

    // Analyse sectorielle
    this.rules.secteur.forEach(rule => {
      if (rule.secteur.test(conventionName) && rule.pattern.test(fullText)) {
        const newConfidence = rule.confidence * 0.9;
        if (newConfidence > bestMatch.confidence) {
          bestMatch = {
            suggestedStatus: rule.replacement,
            confidence: newConfidence,
            reasons: ['Spécificité sectorielle']
          };
        }
      }
    });

    // Ajuste la confiance selon le contexte
    if (bestMatch.confidence > 0.5) {
      bestMatch.confidence = Math.min(bestMatch.confidence, 0.95); // Plafond de confiance
    }

    return bestMatch;
  }

  /**
   * Sauvegarde les données corrigées
   */
  saveData(outputFile = 'data-corrected.json') {
    try {
      fs.writeFileSync(outputFile, JSON.stringify(this.data, null, 2));
      console.log(`\n💾 Données corrigées sauvegardées dans: ${outputFile}`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  }

  /**
   * Génère un rapport de corrections
   */
  generateReport(outputFile = 'statuts-corrections-report.json') {
    const report = {
      generatedAt: new Date().toISOString(),
      totalConventions: this.corrections.length,
      totalCorrections: this.corrections.reduce((sum, c) => sum + c.correctionsCount, 0),
      conventionsProcessed: this.corrections.map(correction => ({
        convention: correction.convention,
        idcc: correction.idcc,
        correctionsCount: correction.correctionsCount,
        averageConfidence: correction.corrections.reduce((sum, c) => sum + c.confiance, 0) / correction.corrections.length,
        corrections: correction.corrections
      }))
    };

    try {
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(`📊 Rapport de corrections sauvegardé dans: ${outputFile}`);
    } catch (error) {
      console.error(`Erreur lors de la génération du rapport: ${error.message}`);
    }

    return report;
  }

  /**
   * Affiche un résumé des corrections
   */
  displaySummary() {
    if (this.corrections.length === 0) {
      console.log('\n✅ Aucune correction appliquée.');
      return;
    }

    console.log('\n📈 RÉSUMÉ DES CORRECTIONS\n');
    console.log('='.repeat(60));

    const totalCorrections = this.corrections.reduce((sum, c) => sum + c.correctionsCount, 0);
    const avgConfidence = this.corrections.reduce((sum, conv) => {
      const convAvg = conv.corrections.reduce((s, c) => s + c.confiance, 0) / conv.corrections.length;
      return sum + convAvg;
    }, 0) / this.corrections.length;

    console.log(`Conventions traitées: ${this.corrections.length}`);
    console.log(`Total corrections: ${totalCorrections}`);
    console.log(`Confiance moyenne: ${(avgConfidence * 100).toFixed(1)}%\n`);

    // Top 5 des conventions avec le plus de corrections
    const topConventions = [...this.corrections]
      .sort((a, b) => b.correctionsCount - a.correctionsCount)
      .slice(0, 5);

    console.log('🏆 Top 5 conventions avec le plus de corrections:');
    topConventions.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.convention} (IDCC: ${conv.idcc}) - ${conv.correctionsCount} corrections`);
    });

    // Analyse des types de corrections
    const statusTypes = {};
    this.corrections.forEach(conv => {
      conv.corrections.forEach(corr => {
        statusTypes[corr.nouveau] = (statusTypes[corr.nouveau] || 0) + 1;
      });
    });

    console.log('\n📊 Types de statuts attribués:');
    Object.entries(statusTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count} occurrences`);
      });
  }

  /**
   * Exécute le processus complet
   */
  run() {
    console.log('🚀 Démarrage de la correction des statuts "non spécifié"...\n');
    
    this.loadData();
    this.processAllConventions();
    this.displaySummary();
    this.generateReport();
    this.saveData();
    
    console.log('\n✅ Processus de correction terminé !');
  }
}

// Exécution si script lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node correct-non-specifie-statuts.js [options]

Options:
  --help, -h          Affiche cette aide
  --dry-run          Simulation sans modification des données
  --output <file>    Fichier de sortie (défaut: data-corrected.json)

Le script analyse le contexte (qualifications, fonctions, coefficients, autonomie)
pour proposer des statuts appropriés en remplacement de "non spécifié".
    `);
    process.exit(0);
  }

  const corrector = new StatutCorrector();
  corrector.run();
}

export default StatutCorrector;