/**
 * Script de recherche des mentions "non spécifié" dans les tableaux de classification
 * Convention Collective Analytics Platform
 */

import fs from 'fs';

class NonSpecifieSearcher {
  constructor(dataFilePath = './data.json') {
    this.dataFilePath = dataFilePath;
    this.data = null;
    this.results = [];
  }

  /**
   * Charge les données du fichier JSON
   */
  loadData() {
    try {
      const rawData = fs.readFileSync(this.dataFilePath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log(`✅ Données chargées: ${Object.keys(this.data).length} conventions`);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement des données: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Recherche les mentions "non spécifié" dans les classifications
   */
  searchNonSpecifie() {
    if (!this.data) {
      console.error('❌ Données non chargées. Appelez loadData() d\'abord.');
      return;
    }

    console.log('\n🔍 Recherche des mentions "non spécifié" dans les classifications...\n');

    for (const [conventionName, conventionData] of Object.entries(this.data)) {
      const classificationSection = conventionData.sections?.["Classification_Con_+_Détails"];
      
      if (classificationSection) {
        this.analyzeClassificationSection(conventionName, conventionData, classificationSection);
      }
    }
  }

  /**
   * Analyse une section de classification
   */
  analyzeClassificationSection(conventionName, conventionData, section) {
    const content = section.contenu;
    
    // Recherche des patterns "non spécifié"
    const patterns = [
      /non spécifié/gi,
      /non specifié/gi,
      /statut non spécifié/gi,
      /critères non spécifiés/gi,
      /modalités non spécifiées/gi
    ];

    let hasMatches = false;
    const matches = [];

    patterns.forEach(pattern => {
      const found = content.match(pattern);
      if (found) {
        hasMatches = true;
        matches.push(...found);
      }
    });

    if (hasMatches) {
      // Extraction des lignes de tableau contenant "non spécifié"
      const tableRows = this.extractTableRowsWithNonSpecifie(content);
      
      const result = {
        convention: conventionName,
        idcc: conventionData.idcc || 'N/A',
        url: conventionData.url || 'N/A',
        totalMatches: matches.length,
        uniqueMatches: [...new Set(matches.map(m => m.toLowerCase()))],
        tableRows: tableRows,
        fullContent: content
      };

      this.results.push(result);
      
      console.log(`📋 ${conventionName} (IDCC: ${conventionData.idcc})`);
      console.log(`   Occurrences: ${matches.length}`);
      console.log(`   Types: ${result.uniqueMatches.join(', ')}`);
      console.log(`   Lignes de tableau concernées: ${tableRows.length}`);
      console.log('');
    }
  }

  /**
   * Extrait les lignes de tableau contenant "non spécifié"
   */
  extractTableRowsWithNonSpecifie(content) {
    const rows = [];
    
    // Recherche des éléments <tr> contenant "non spécifié"
    const trRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const trMatches = content.match(trRegex) || [];
    
    trMatches.forEach(tr => {
      if (/non spécifié/gi.test(tr)) {
        // Nettoie et structure les données de la ligne
        const cleanRow = this.cleanTableRow(tr);
        if (cleanRow.cells.length > 0) {
          rows.push(cleanRow);
        }
      }
    });

    return rows;
  }

  /**
   * Nettoie et structure une ligne de tableau
   */
  cleanTableRow(trContent) {
    // Extraction des cellules
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    const cells = [];
    let match;

    while ((match = cellRegex.exec(trContent)) !== null) {
      const cellContent = match[1]
        .replace(/<[^>]*>/g, '') // Supprime les balises HTML
        .replace(/\s+/g, ' ')    // Normalise les espaces
        .trim();
      
      if (cellContent) {
        cells.push(cellContent);
      }
    }

    return {
      rawHtml: trContent,
      cells: cells,
      cellsWithNonSpecifie: cells.filter(cell => /non spécifié/gi.test(cell))
    };
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport() {
    console.log('\n📊 RAPPORT DÉTAILLÉ\n');
    console.log('='.repeat(80));

    if (this.results.length === 0) {
      console.log('✅ Aucune mention "non spécifié" trouvée dans les classifications.');
      return;
    }

    // Statistiques globales
    const totalConventions = this.results.length;
    const totalOccurrences = this.results.reduce((sum, r) => sum + r.totalMatches, 0);
    
    console.log(`📈 STATISTIQUES GLOBALES:`);
    console.log(`   Conventions concernées: ${totalConventions}`);
    console.log(`   Total des occurrences: ${totalOccurrences}`);
    console.log(`   Moyenne par convention: ${(totalOccurrences / totalConventions).toFixed(1)}`);
    console.log('');

    // Top 10 des conventions avec le plus d'occurrences
    const sortedResults = [...this.results].sort((a, b) => b.totalMatches - a.totalMatches);
    
    console.log(`🏆 TOP 10 DES CONVENTIONS AVEC LE PLUS D'OCCURRENCES:`);
    sortedResults.slice(0, 10).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.convention} (IDCC: ${result.idcc}) - ${result.totalMatches} occurrences`);
    });
    console.log('');

    // Détail par convention
    console.log(`📋 DÉTAIL PAR CONVENTION:\n`);
    
    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.convention}`);
      console.log(`   IDCC: ${result.idcc}`);
      console.log(`   Occurrences: ${result.totalMatches}`);
      console.log(`   Types trouvés: ${result.uniqueMatches.join(', ')}`);
      
      if (result.tableRows.length > 0) {
        console.log(`   Exemples de lignes concernées:`);
        result.tableRows.slice(0, 3).forEach((row, rowIndex) => {
          console.log(`     Ligne ${rowIndex + 1}: ${row.cells.join(' | ')}`);
        });
        if (result.tableRows.length > 3) {
          console.log(`     ... et ${result.tableRows.length - 3} autres lignes`);
        }
      }
      console.log('');
    });
  }

  /**
   * Exporte les résultats vers un fichier JSON
   */
  exportResults(outputFile = 'non-specifie-classifications-report.json') {
    const report = {
      generatedAt: new Date().toISOString(),
      totalConventions: this.results.length,
      totalOccurrences: this.results.reduce((sum, r) => sum + r.totalMatches, 0),
      conventions: this.results.map(result => ({
        convention: result.convention,
        idcc: result.idcc,
        url: result.url,
        totalMatches: result.totalMatches,
        uniqueMatches: result.uniqueMatches,
        tableRowsCount: result.tableRows.length,
        examples: result.tableRows.slice(0, 5).map(row => row.cells)
      }))
    };

    try {
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(`💾 Rapport exporté vers: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'export: ${error.message}`);
    }
  }

  /**
   * Fonction de recherche spécifique
   */
  searchSpecificPattern(pattern, description = 'Pattern personnalisé') {
    console.log(`\n🎯 Recherche: ${description}`);
    console.log(`   Pattern: ${pattern}\n`);

    const specificResults = [];

    for (const [conventionName, conventionData] of Object.entries(this.data)) {
      const classificationSection = conventionData.sections?.["Classification_Con_+_Détails"];
      
      if (classificationSection) {
        const content = classificationSection.contenu;
        const matches = content.match(new RegExp(pattern, 'gi'));
        
        if (matches) {
          specificResults.push({
            convention: conventionName,
            idcc: conventionData.idcc,
            matches: matches.length,
            examples: matches.slice(0, 3)
          });
        }
      }
    }

    if (specificResults.length > 0) {
      console.log(`Trouvé dans ${specificResults.length} conventions:`);
      specificResults.forEach(result => {
        console.log(`   ${result.convention} (IDCC: ${result.idcc}) - ${result.matches} occurrences`);
        console.log(`     Exemples: ${result.examples.join(', ')}`);
      });
    } else {
      console.log('Aucun résultat trouvé.');
    }

    return specificResults;
  }

  /**
   * Exécute l'analyse complète
   */
  run() {
    console.log('🚀 Démarrage de l\'analyse des classifications...\n');
    
    this.loadData();
    this.searchNonSpecifie();
    this.generateReport();
    this.exportResults();
    
    console.log('\n✅ Analyse terminée !');
  }
}

// Si le script est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const searcher = new NonSpecifieSearcher();
  
  // Vérification des arguments de ligne de commande
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node search-non-specifie-classifications.js [options]

Options:
  --help, -h          Affiche cette aide
  --pattern <regex>   Recherche un pattern spécifique
  --output <file>     Fichier de sortie (défaut: non-specifie-classifications-report.json)

Exemples:
  node search-non-specifie-classifications.js
  node search-non-specifie-classifications.js --pattern "statut.*spécifié"
  node search-non-specifie-classifications.js --output mon-rapport.json
    `);
    process.exit(0);
  }

  // Recherche de pattern spécifique
  const patternIndex = args.indexOf('--pattern');
  if (patternIndex !== -1 && args[patternIndex + 1]) {
    searcher.loadData();
    searcher.searchSpecificPattern(args[patternIndex + 1], 'Pattern personnalisé');
    process.exit(0);
  }

  // Analyse complète
  searcher.run();
}

export default NonSpecifieSearcher;