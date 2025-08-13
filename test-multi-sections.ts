import { multiSectionExtractor } from './server/services/multi-section-extractor';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function testMultiSections() {
  console.log('🚀 DÉBUT TEST STRATÉGIE MULTI-SECTIONS');
  
  // Test sur une convention moyenne d'abord
  const testPdfPath = 'resultats_telechargements/complet_20250813_102543/1412_Aéraulique, thermique et frigorifique.pdf';
  
  if (!fs.existsSync(testPdfPath)) {
    console.error('❌ PDF de test introuvable:', testPdfPath);
    return;
  }
  
  try {
    console.log('📄 Extraction du texte PDF...');
    const pdfBuffer = fs.readFileSync(testPdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const conventionText = pdfData.text;
    
    console.log(`📊 Convention: IDCC 1412 - Aéraulique`);
    console.log(`📏 Taille: ${conventionText.length} caractères (~${Math.ceil(conventionText.length/4)} tokens)`);
    
    // Test BLOC 1: 18 sections simples
    console.log('\n🚀 TEST BLOC 1: 18 sections simples...');
    const startTime1 = Date.now();
    
    const result1 = await multiSectionExtractor.extractSimpleSections(
      conventionText, 
      '1412', 
      'Aéraulique, thermique et frigorifique'
    );
    
    console.log(`✅ Bloc 1 terminé en ${result1.processingTime}ms`);
    console.log(`📊 Succès: ${result1.successCount}/${result1.totalSections} sections`);
    console.log(`🔄 Chunking utilisé: ${result1.chunked ? 'OUI' : 'NON'}`);
    
    // Affichage résultats détaillés Bloc 1
    console.log('\n📋 RÉSULTATS BLOC 1:');
    result1.results.forEach(r => {
      const status = r.status === 'success' ? '✅' : 
                    r.status === 'empty' ? '⭕' : '❌';
      console.log(`${status} ${r.section}: ${r.status}`);
      
      if (r.status === 'success' && r.content?.contenu && r.content.contenu !== 'RAS') {
        const preview = r.content.contenu.toString().substring(0, 100) + '...';
        console.log(`   📝 Aperçu: ${preview}`);
      }
    });
    
    // Test BLOC 2: 10 sections moyennes
    console.log('\n⚡ TEST BLOC 2: 10 sections moyennes...');
    const startTime2 = Date.now();
    
    const result2 = await multiSectionExtractor.extractMediumSections(
      conventionText, 
      '1412', 
      'Aéraulique, thermique et frigorifique'
    );
    
    console.log(`✅ Bloc 2 terminé en ${result2.processingTime}ms`);
    console.log(`📊 Succès: ${result2.successCount}/${result2.totalSections} sections`);
    console.log(`🔄 Chunking utilisé: ${result2.chunked ? 'OUI' : 'NON'}`);
    
    // Affichage résultats détaillés Bloc 2
    console.log('\n📋 RÉSULTATS BLOC 2:');
    result2.results.forEach(r => {
      const status = r.status === 'success' ? '✅' : 
                    r.status === 'empty' ? '⭕' : '❌';
      console.log(`${status} ${r.section}: ${r.status}`);
      
      if (r.status === 'success' && r.content?.contenu && r.content.contenu !== 'RAS') {
        const preview = r.content.contenu.toString().substring(0, 100) + '...';
        console.log(`   📝 Aperçu: ${preview}`);
      }
    });
    
    // Statistiques globales
    const totalTime = result1.processingTime + result2.processingTime;
    const totalSections = result1.totalSections + result2.totalSections;
    const totalSuccess = result1.successCount + result2.successCount;
    
    console.log('\n📊 STATISTIQUES GLOBALES:');
    console.log(`⏱️  Temps total: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    console.log(`📈 Sections extraites: ${totalSuccess}/${totalSections} (${((totalSuccess/totalSections)*100).toFixed(1)}%)`);
    console.log(`🎯 Performance: ${(totalSections/(totalTime/1000)).toFixed(1)} sections/seconde`);
    
    // Estimation pour 584 conventions
    const estimatedTimeFor584 = (totalTime * 584) / 1000 / 60; // en minutes
    console.log(`🔮 Estimation 584 conventions: ${estimatedTimeFor584.toFixed(0)} minutes`);
    
    // Sauvegarde résultats test
    const testResults = {
      convention: { id: '1412', name: 'Aéraulique, thermique et frigorifique' },
      bloc1: result1,
      bloc2: result2,
      stats: {
        totalTime,
        totalSections,
        totalSuccess,
        successRate: (totalSuccess/totalSections)*100,
        estimatedTimeFor584: estimatedTimeFor584
      }
    };
    
    fs.writeFileSync('test-results-multi-sections.json', JSON.stringify(testResults, null, 2));
    console.log('\n💾 Résultats sauvegardés dans test-results-multi-sections.json');
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  }
}

// Test sur plusieurs conventions si disponibles
async function testMultipleConventions() {
  console.log('\n🔄 TEST SUR PLUSIEURS CONVENTIONS...');
  
  const testFiles = [
    '1412_Aéraulique, thermique et frigorifique.pdf',
    '1043_Gardiens, concierges et employés d\'immeubles.pdf',
    '1077_Produits du sol _ négoce et industrie.pdf'
  ].map(f => path.join('resultats_telechargements/complet_20250813_102543', f));
  
  const results: Array<{
    file: string;
    idcc: string;
    name: string;
    bloc1: { success: number; total: number; time: number };
    bloc2: { success: number; total: number; time: number };
  }> = [];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      try {
        console.log(`\n📄 Test: ${path.basename(filePath)}`);
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        
        const idcc = path.basename(filePath).split('_')[0];
        const name = path.basename(filePath).replace('.pdf', '').split('_').slice(1).join(' ');
        
        const result1 = await multiSectionExtractor.extractSimpleSections(pdfData.text, idcc, name);
        const result2 = await multiSectionExtractor.extractMediumSections(pdfData.text, idcc, name);
        
        results.push({
          file: path.basename(filePath),
          idcc,
          name,
          bloc1: { success: result1.successCount, total: result1.totalSections, time: result1.processingTime },
          bloc2: { success: result2.successCount, total: result2.totalSections, time: result2.processingTime }
        });
        
        console.log(`✅ ${idcc}: Bloc1(${result1.successCount}/${result1.totalSections}) Bloc2(${result2.successCount}/${result2.totalSections}) - ${result1.processingTime + result2.processingTime}ms`);
        
      } catch (error) {
        console.error(`❌ Erreur ${path.basename(filePath)}:`, error.message);
      }
    }
  }
  
  console.log('\n📊 RÉSUMÉ TESTS MULTIPLES:');
  results.forEach(r => {
    const totalSuccess = r.bloc1.success + r.bloc2.success;
    const totalSections = r.bloc1.total + r.bloc2.total;
    const totalTime = r.bloc1.time + r.bloc2.time;
    console.log(`${r.idcc}: ${totalSuccess}/${totalSections} (${((totalSuccess/totalSections)*100).toFixed(1)}%) - ${totalTime}ms`);
  });
}

// Lancement des tests
testMultiSections()
  .then(() => testMultipleConventions())
  .then(() => {
    console.log('\n🎉 TESTS TERMINÉS !');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  });