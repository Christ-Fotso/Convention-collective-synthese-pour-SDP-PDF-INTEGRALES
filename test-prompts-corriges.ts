import { HtmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';

async function testPromptsCorrections() {
  console.log('🧪 Test des prompts corrigés avec tableaux HTML...\n');
  
  try {
    // Charger le fichier de prompts corrigé
    const promptsContent = fs.readFileSync('./user_prompt_html_tableaux_corriges.md', 'utf-8');
    console.log(`✅ Prompts corrigés chargés (${promptsContent.length} caractères)\n`);
    
    // Initialiser l'extracteur
    const extractor = new HtmlTableExtractor();
    console.log('✅ Extracteur HTML initialisé\n');
    
    // Exemple de texte de convention avec données tabulaires
    const testText = `
    ARTICLE 12 - GRILLES DE SALAIRES
    
    Les salaires minimaux applicables sont les suivants :
    
    Niveau I : 
    - Échelon 1 : 1 800 € (coefficient 120)
    - Échelon 2 : 1 950 € (coefficient 130)
    
    Niveau II :
    - Échelon 1 : 2 100 € (coefficient 140)
    - Échelon 2 : 2 300 € (coefficient 150)
    
    ARTICLE 15 - HEURES SUPPLEMENTAIRES
    
    Les taux de majoration sont :
    - De la 36ème à la 43ème heure : 25%
    - Au-delà de 43 heures : 50%
    - Pour les cadres : repos compensateur obligatoire
    
    ARTICLE 20 - CONGES SUPPLEMENTAIRES
    
    Congés d'ancienneté :
    Après 5 ans : 1 jour supplémentaire
    Après 10 ans : 2 jours supplémentaires  
    Après 15 ans : 3 jours supplémentaires
    `;
    
    console.log('📄 Texte de test préparé\n');
    
    // Test de l'extracteur avec tableaux HTML
    console.log('🎯 Test avec extracteur HTML spécialisé...');
    const result = await extractor.extractWithHtmlTables(
      testText, 
      'TEST_001',
      'Convention de test'
    );
    
    console.log('📊 Résultat global :');
    console.log('─'.repeat(50));
    console.log(`Convention: ${result.conventionName}`);
    console.log(`Sections traitées: ${result.successCount}/${result.totalSections}`);
    console.log(`Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`Temps de traitement: ${result.processingTime}ms`);
    console.log('─'.repeat(50));
    console.log();
    
    // Afficher les résultats de chaque section
    result.results.forEach(sectionResult => {
      console.log(`📋 Section: ${sectionResult.section}`);
      console.log(`Status: ${sectionResult.status}`);
      
      if (sectionResult.status === 'success' && sectionResult.content) {
        const content = sectionResult.content.contenu || sectionResult.content;
        const hasTable = content.includes('<table>') && content.includes('<tr>') && content.includes('<td>');
        console.log(`Tableau HTML: ${hasTable ? '✅ OUI' : '❌ NON'}`);
        console.log('Contenu:');
        console.log(content.substring(0, 300) + (content.length > 300 ? '...' : ''));
      } else if (sectionResult.error) {
        console.log(`Erreur: ${sectionResult.error}`);
      }
      console.log('─'.repeat(30));
    });
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
}

// Lancer le test
testPromptsCorrections();