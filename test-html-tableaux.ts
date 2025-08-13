import { multiSectionExtractor } from './server/services/multi-section-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testHtmlTableaux() {
  console.log('🧪 TEST CONSIGNES TABLEAUX HTML');
  
  try {
    // Test avec une convention contenant des cotisations (devrait générer un tableau)
    const pdfPath = 'resultats_telechargements/complet_20250813_102543/1412_Aéraulique, thermique et frigorifique.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF test introuvable');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const conventionText = pdfData.text;
    
    console.log(`📄 Convention: IDCC 1412 - Aéraulique`);
    console.log(`📏 Taille: ${conventionText.length} caractères`);
    
    // Test UNIQUEMENT section cotisation-prevoyance (qui devrait avoir un tableau)
    console.log('\n🚀 Test avec consignes HTML corrigées...');
    const startTime = Date.now();
    
    const result = await multiSectionExtractor.extractSimpleSections(conventionText, '1412', 'Aéraulique Test HTML');
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Traitement terminé en ${processingTime}ms`);
    
    // Recherche de la section cotisation-prevoyance
    const cotisationSection = result.results.find(r => r.section === 'cotisation-prevoyance');
    
    if (cotisationSection && cotisationSection.status === 'success') {
      const contenu = cotisationSection.content.contenu;
      
      console.log('\n📋 SECTION COTISATION-PREVOYANCE:');
      console.log('='.repeat(80));
      console.log(contenu);
      console.log('='.repeat(80));
      
      // Vérification HTML
      const hasHtmlTable = contenu.includes('<table>') && contenu.includes('<tr>') && contenu.includes('<td>');
      
      if (hasHtmlTable) {
        console.log('\n✅ TABLEAU HTML DÉTECTÉ !');
        console.log('🎯 Les consignes HTML sont respectées');
        
        // Comptage des balises
        const tableCount = (contenu.match(/<table>/g) || []).length;
        const rowCount = (contenu.match(/<tr>/g) || []).length;
        const cellCount = (contenu.match(/<td>/g) || []).length;
        
        console.log(`📊 Statistiques HTML:`);
        console.log(`   Tableaux: ${tableCount}`);
        console.log(`   Lignes: ${rowCount}`);
        console.log(`   Cellules: ${cellCount}`);
        
      } else {
        console.log('\n❌ AUCUN TABLEAU HTML DÉTECTÉ');
        console.log('🚨 Les consignes HTML ne sont PAS respectées');
        console.log('📝 Format détecté: Format texte avec tirets/listes');
      }
      
    } else {
      console.log('\n❌ Section cotisation-prevoyance non extraite ou en erreur');
    }
    
    // Test d'autres sections susceptibles d'avoir des tableaux
    const sectionsTableaux = ['evenement-familial', 'cotisation-mutuelle'];
    
    console.log('\n🔍 VÉRIFICATION AUTRES SECTIONS TABLEAUX:');
    sectionsTableaux.forEach(sectionName => {
      const section = result.results.find(r => r.section === sectionName);
      if (section && section.status === 'success') {
        const hasTable = section.content.contenu.includes('<table>');
        const hasStructuredData = section.content.contenu.includes(':') && section.content.contenu.includes('\n');
        
        console.log(`   ${sectionName}: ${hasTable ? '✅ HTML' : hasStructuredData ? '⚠️  Texte structuré' : '📝 Texte simple'}`);
      }
    });
    
    // Statistiques globales
    console.log(`\n📊 RÉSULTATS GLOBAUX:`);
    console.log(`   Sections extraites: ${result.successCount}/${result.totalSections}`);
    console.log(`   Temps total: ${result.processingTime}ms`);
    
    // Sauvegarde pour analyse
    const testResult = {
      timestamp: new Date().toISOString(),
      processingTime: result.processingTime,
      sectionsWithHTML: result.results.filter(r => 
        r.status === 'success' && r.content.contenu.includes('<table>')
      ).map(r => r.section),
      allResults: result.results
    };
    
    fs.writeFileSync('test-html-tableaux-result.json', JSON.stringify(testResult, null, 2));
    console.log('\n💾 Résultats sauvegardés: test-html-tableaux-result.json');
    
  } catch (error) {
    console.error('💥 Erreur test:', error.message);
  }
}

testHtmlTableaux()
  .then(() => {
    console.log('\n🎉 Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });