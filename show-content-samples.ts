import fs from 'fs';

interface ExtractedContent {
  section: string;
  content: any;
  status: string;
}

function showContentSamples() {
  console.log('📄 EXEMPLES DÉTAILLÉS DU CONTENU EXTRAIT\n');
  console.log('Convention IDCC 1412 - Aéraulique, thermique et frigorifique\n');
  
  try {
    const results = JSON.parse(fs.readFileSync('test-results-multi-sections.json', 'utf8'));
    
    // Affichage des sections les plus intéressantes
    const sectionsToShow = [
      'cotisation-prevoyance',
      'classification-details', 
      'indemnite-licenciement',
      'heures-supplementaires',
      'conges-payes',
      'evenement-familial'
    ];
    
    console.log('='.repeat(80));
    console.log('🎯 EXEMPLES DE CONTENU EXTRAIT AVEC SUCCÈS');
    console.log('='.repeat(80));
    
    // Parcours des résultats bloc 1 et bloc 2
    const allResults = [
      ...(results.bloc1?.results || []),
      ...(results.bloc2?.results || [])
    ];
    
    sectionsToShow.forEach(targetSection => {
      const result = allResults.find(r => r.section === targetSection && r.status === 'success');
      
      if (result) {
        console.log(`\n📋 SECTION: ${targetSection.toUpperCase()}`);
        console.log('-'.repeat(60));
        
        const content = result.content.contenu;
        if (content && content !== 'RAS') {
          // Formatage du contenu pour l'affichage
          const formattedContent = content
            .replace(/\n/g, '\n   ')  // Indentation
            .substring(0, 800);       // Limite d'affichage
          
          console.log(`   ${formattedContent}`);
          
          if (content.length > 800) {
            console.log(`   ... (${content.length - 800} caractères supplémentaires)`);
          }
          
          // Statistiques du contenu
          const wordCount = content.split(/\s+/).length;
          const lineCount = content.split('\n').length;
          console.log(`\n   📊 Stats: ${wordCount} mots, ${lineCount} lignes`);
          
        } else {
          console.log('   ❌ Contenu vide ou RAS');
        }
      } else {
        console.log(`\n❌ SECTION: ${targetSection.toUpperCase()} - NON EXTRAITE`);
      }
    });
    
    // Statistiques globales
    console.log('\n' + '='.repeat(80));
    console.log('📊 STATISTIQUES GLOBALES');
    console.log('='.repeat(80));
    
    const totalSections = allResults.length;
    const successfulSections = allResults.filter(r => r.status === 'success').length;
    const emptySections = allResults.filter(r => r.status === 'empty').length;
    const failedSections = allResults.filter(r => r.status === 'error').length;
    
    console.log(`✅ Sections extraites avec succès: ${successfulSections}/${totalSections}`);
    console.log(`🔍 Sections vides (RAS): ${emptySections}/${totalSections}`);
    console.log(`❌ Sections en erreur: ${failedSections}/${totalSections}`);
    console.log(`🎯 Taux de réussite: ${(successfulSections/totalSections*100).toFixed(1)}%`);
    
    // Performance
    console.log(`\n⏱️  Temps traitement:`);
    console.log(`   Bloc 1 (18 sections): ${(results.bloc1?.processingTime/1000).toFixed(1)}s`);
    console.log(`   Bloc 2 (10 sections): ${(results.bloc2?.processingTime/1000).toFixed(1)}s`);
    console.log(`   Total: ${(results.stats?.totalTime/1000).toFixed(1)}s`);
    
    // Analyse des types de contenu les plus riches
    console.log('\n🏆 TOP 5 SECTIONS LES PLUS DÉTAILLÉES:');
    const richSections = allResults
      .filter(r => r.status === 'success' && r.content?.contenu && r.content.contenu !== 'RAS')
      .map(r => ({
        section: r.section,
        length: r.content.contenu.length,
        words: r.content.contenu.split(/\s+/).length
      }))
      .sort((a, b) => b.length - a.length)
      .slice(0, 5);
    
    richSections.forEach((section, i) => {
      console.log(`   ${i+1}. ${section.section}: ${section.words} mots (${section.length} caractères)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lecture résultats:', error.message);
  }
}

showContentSamples();