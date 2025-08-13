import { htmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testHtmlTablesSpecialise() {
  console.log('🎯 TEST EXTRACTEUR SPÉCIALISÉ TABLEAUX HTML');
  
  try {
    // Test avec convention IDCC 1412 (Aéraulique) - riche en cotisations
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
    
    console.log('\n🚀 EXTRACTION AVEC TABLEAUX HTML OBLIGATOIRES...');
    const startTime = Date.now();
    
    const result = await htmlTableExtractor.extractWithHtmlTables(conventionText, '1412', 'Aéraulique HTML Test');
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Traitement terminé en ${processingTime}ms`);
    
    console.log(`\n📊 RÉSULTATS GLOBAUX:`);
    console.log(`   Sections extraites: ${result.successCount}/${result.totalSections}`);
    console.log(`   Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`   Temps total: ${result.processingTime}ms`);
    
    if (result.htmlTableCount === 0) {
      console.log('\n❌ AUCUN TABLEAU HTML GÉNÉRÉ !');
    } else {
      console.log(`\n✅ ${result.htmlTableCount} TABLEAUX HTML GÉNÉRÉS AVEC SUCCÈS !`);
    }
    
    // Analyse détaillée des sections avec tableaux
    console.log('\n🔍 ANALYSE DÉTAILLÉE DES SECTIONS:');
    console.log('='.repeat(80));
    
    for (const section of result.results) {
      if (section.status === 'success') {
        const contenu = section.content.contenu;
        const hasTable = contenu.includes('<table>') && contenu.includes('<tr>') && contenu.includes('<td>');
        
        console.log(`\n📋 ${section.section.toUpperCase()}:`);
        console.log(`   Statut: ${hasTable ? '✅ TABLEAU HTML' : '⚠️  Format texte'}`);
        
        if (hasTable) {
          // Comptage des éléments HTML
          const tableCount = (contenu.match(/<table>/g) || []).length;
          const rowCount = (contenu.match(/<tr>/g) || []).length;
          const cellCount = (contenu.match(/<td>/g) || []).length;
          const headerCount = (contenu.match(/<th>/g) || []).length;
          
          console.log(`   📊 Détails: ${tableCount} table(s), ${rowCount} ligne(s), ${cellCount} cellule(s), ${headerCount} header(s)`);
          
          // Affichage du début du contenu
          const preview = contenu.substring(0, 200);
          console.log(`   📝 Aperçu: ${preview}${contenu.length > 200 ? '...' : ''}`);
        } else {
          // Pour les sections sans tableau, vérifier si elles contiennent des données structurées
          const hasStructuredData = (contenu.includes(':') && contenu.includes('\n')) || 
                                   contenu.includes('%') || 
                                   contenu.includes('€');
          
          if (hasStructuredData) {
            console.log(`   ⚠️  DONNÉES STRUCTURÉES DÉTECTÉES MAIS PAS DE TABLEAU !`);
            const preview = contenu.substring(0, 150);
            console.log(`   📝 Contenu: ${preview}${contenu.length > 150 ? '...' : ''}`);
          }
        }
      } else {
        console.log(`\n❌ ${section.section}: ${section.status} - ${section.error || 'Pas de contenu'}`);
      }
    }
    
    // Test de validation HTML
    console.log('\n🔬 VALIDATION HTML:');
    const sectionsAvecTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content.contenu.includes('<table>')
    );
    
    if (sectionsAvecTableaux.length > 0) {
      sectionsAvecTableaux.forEach(section => {
        const contenu = section.content.contenu;
        
        // Vérifications HTML basiques
        const tableOpen = (contenu.match(/<table>/g) || []).length;
        const tableClose = (contenu.match(/<\/table>/g) || []).length;
        const trOpen = (contenu.match(/<tr>/g) || []).length;
        const trClose = (contenu.match(/<\/tr>/g) || []).length;
        
        const isValidHtml = tableOpen === tableClose && trOpen === trClose;
        
        console.log(`   ${section.section}: ${isValidHtml ? '✅ HTML valide' : '❌ HTML invalide'}`);
        
        if (!isValidHtml) {
          console.log(`     Tables: ${tableOpen} ouvertes, ${tableClose} fermées`);
          console.log(`     TR: ${trOpen} ouvertes, ${trClose} fermées`);
        }
      });
    }
    
    // Sauvegarde des résultats
    const testResult = {
      timestamp: new Date().toISOString(),
      conventionId: '1412',
      conventionName: 'Aéraulique HTML Test',
      processingTime: result.processingTime,
      totalSections: result.totalSections,
      successCount: result.successCount,
      htmlTableCount: result.htmlTableCount,
      sectionsWithTables: sectionsAvecTableaux.map(s => s.section),
      results: result.results
    };
    
    fs.writeFileSync('test-html-tables-specialise-result.json', JSON.stringify(testResult, null, 2));
    console.log('\n💾 Résultats détaillés sauvegardés: test-html-tables-specialise-result.json');
    
    // Conclusion
    if (result.htmlTableCount > 0) {
      console.log(`\n🎉 SUCCÈS ! ${result.htmlTableCount} tableaux HTML générés correctement`);
      console.log('✅ L\'extracteur spécialisé fonctionne comme attendu');
    } else {
      console.log('\n❌ ÉCHEC : Aucun tableau HTML généré malgré les consignes');
      console.log('🔧 Il faut ajuster les prompts ou la logique d\'extraction');
    }
    
  } catch (error) {
    console.error('💥 Erreur test:', error.message);
  }
}

testHtmlTablesSpecialise()
  .then(() => {
    console.log('\n🏁 Test spécialisé terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });