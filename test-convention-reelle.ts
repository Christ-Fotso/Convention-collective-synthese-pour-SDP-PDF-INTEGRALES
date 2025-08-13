import { HtmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';

async function testConventionReelle() {
  console.log('🧪 Test avec une convention collective réelle...\n');
  
  try {
    // Charger les conventions disponibles avec le bon fichier
    const conventionsData = JSON.parse(fs.readFileSync('./attached_assets/conventions_collectives_integrales_lienpdf_nettoye_1755080256357.json', 'utf-8'));
    
    console.log(`📊 ${conventionsData.length} conventions chargées`);
    
    // Afficher quelques exemples pour comprendre la structure
    const sample = conventionsData.slice(0, 3);
    sample.forEach((c: any, i: number) => {
      console.log(`${i+1}. IDCC: ${c.idcc} - ${c.libelle} - Texte: ${c.texte_integral ? c.texte_integral.length : 0} chars`);
    });
    
    // Prendre une convention intéressante (pas trop courte)
    const conventionTest = conventionsData.find((c: any) => 
      c.idcc && 
      c.texte_integral && 
      c.texte_integral.length > 20000
    );
    
    if (!conventionTest) {
      // Fallback: prendre n'importe quelle convention avec du texte
      const fallback = conventionsData.find((c: any) => 
        c.idcc && c.texte_integral && c.texte_integral.length > 5000
      );
      if (fallback) {
        console.log('🔄 Fallback: convention plus courte sélectionnée');
        return fallback;
      }
    }
    
    if (!conventionTest) {
      console.log('❌ Aucune convention appropriée trouvée');
      return;
    }
    
    console.log(`✅ Convention sélectionnée: ${conventionTest.libelle}`);
    console.log(`📊 IDCC: ${conventionTest.idcc}`);
    console.log(`📄 Taille: ${conventionTest.texte_integral.length} caractères`);
    console.log(`🔗 URL: ${conventionTest.url}\n`);
    
    // Initialiser l'extracteur HTML avec prompts corrigés
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Lancement de l\'extraction avec toutes les sections...\n');
    const startTime = Date.now();
    
    // Test avec la méthode complète (toutes les 34 sections)
    const result = await extractor.extractWithHtmlTables(
      conventionTest.texte_integral,
      conventionTest.idcc,
      conventionTest.libelle
    );
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log('📊 RÉSULTATS COMPLETS :');
    console.log('═'.repeat(60));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`🎯 Sections traitées: ${result.successCount}/${result.totalSections}`);
    console.log(`📊 Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps de traitement: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    console.log(`💰 Coût estimé: ~${Math.ceil(totalTime/1000/10)} requêtes`);
    console.log('═'.repeat(60));
    console.log();
    
    // Analyser les résultats par section
    const sectionsAvecTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content && 
      r.content.contenu && 
      r.content.contenu.includes('<table>') &&
      r.content.contenu.includes('<tr>') &&
      r.content.contenu.includes('<td>')
    );
    
    const sectionsReussies = result.results.filter(r => r.status === 'success');
    const sectionsVides = result.results.filter(r => r.status === 'empty');
    const sectionsErreur = result.results.filter(r => r.status === 'error');
    
    console.log('📈 ANALYSE DES RÉSULTATS :');
    console.log('─'.repeat(40));
    console.log(`✅ Sections réussies: ${sectionsReussies.length}`);
    console.log(`🔳 Sections vides: ${sectionsVides.length}`);
    console.log(`❌ Sections en erreur: ${sectionsErreur.length}`);
    console.log(`🗂️  Sections avec tableaux HTML: ${sectionsAvecTableaux.length}`);
    console.log('─'.repeat(40));
    console.log();
    
    // Afficher les sections avec tableaux HTML
    if (sectionsAvecTableaux.length > 0) {
      console.log('🎯 SECTIONS AVEC TABLEAUX HTML :');
      sectionsAvecTableaux.forEach((section, index) => {
        console.log(`\n${index + 1}. 📋 ${section.section}`);
        console.log('─'.repeat(30));
        const content = section.content.contenu;
        
        // Extraire juste le tableau pour un aperçu
        const tableMatch = content.match(/<table>.*?<\/table>/s);
        if (tableMatch) {
          const tableHtml = tableMatch[0];
          console.log('Tableau HTML généré:');
          console.log(tableHtml.substring(0, 400) + (tableHtml.length > 400 ? '...' : ''));
        }
      });
    }
    
    // Afficher les sections en erreur si il y en a
    if (sectionsErreur.length > 0) {
      console.log('\n❌ SECTIONS EN ERREUR :');
      sectionsErreur.forEach((section, index) => {
        console.log(`${index + 1}. ${section.section}: ${section.error}`);
      });
    }
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
}

// Lancer le test
testConventionReelle();