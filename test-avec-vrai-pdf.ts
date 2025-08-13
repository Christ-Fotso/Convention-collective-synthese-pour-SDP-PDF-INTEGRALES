import { HtmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testAvecVraiPDF() {
  console.log('🧪 Test avec un vrai PDF de convention collective...\n');
  
  try {
    // Choisir un PDF intéressant (Transports routiers IDCC 16)
    const pdfPath = 'resultats_telechargements/complet_20250813_102543/16_Transports routiers.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Fichier PDF non trouvé:', pdfPath);
      return;
    }
    
    console.log(`📄 Lecture du PDF: ${pdfPath}`);
    
    // Extraire le texte du PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const texteExtrait = pdfData.text;
    
    console.log(`✅ PDF extrait avec succès (${texteExtrait.length} caractères)`);
    console.log(`📊 Pages: ${pdfData.numpages}\n`);
    
    // Afficher un échantillon du contenu
    console.log('📝 ÉCHANTILLON DU CONTENU :');
    console.log('─'.repeat(50));
    console.log(texteExtrait.substring(0, 500) + '...');
    console.log('─'.repeat(50));
    console.log();
    
    // Vérifier s'il y a du contenu intéressant
    const hasTableData = texteExtrait.includes('salaire') || texteExtrait.includes('coefficient') || 
                        texteExtrait.includes('grille') || texteExtrait.includes('rémunération') ||
                        texteExtrait.includes('heures supplémentaires') || texteExtrait.includes('congés');
    
    if (!hasTableData) {
      console.log('⚠️  Ce PDF ne semble pas contenir de données tabulaires intéressantes');
      return;
    }
    
    console.log('🎯 PDF contient des données intéressantes pour les tableaux HTML !');
    
    // Initialiser l'extracteur HTML
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Lancement de l\'extraction avec Gemini...\n');
    const startTime = Date.now();
    
    // Tester avec l'extracteur HTML spécialisé
    const result = await extractor.extractWithHtmlTables(
      texteExtrait,
      '16',
      'Convention collective Transports routiers'
    );
    
    const totalTime = Date.now() - startTime;
    
    console.log('📊 RÉSULTATS AVEC VRAIE CONVENTION :');
    console.log('═'.repeat(60));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`📄 Source: PDF réel (${texteExtrait.length} caractères)`);
    console.log(`🎯 Sections extraites: ${result.successCount}/${result.totalSections}`);
    console.log(`📊 Tableaux HTML créés: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps total: ${(totalTime/1000).toFixed(1)} secondes`);
    console.log(`💰 API calls: 1 requête Gemini 2.5 Pro`);
    console.log('═'.repeat(60));
    
    // Statistiques
    const sectionsReussies = result.results.filter(r => r.status === 'success');
    const sectionsVides = result.results.filter(r => r.status === 'empty');
    const sectionsErreur = result.results.filter(r => r.status === 'error');
    const sectionsTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content && 
      typeof r.content === 'object' &&
      r.content.contenu && 
      r.content.contenu.includes('<table>')
    );
    
    console.log();
    console.log('📈 ANALYSE COMPLÈTE :');
    console.log('─'.repeat(40));
    console.log(`✅ Extractions réussies: ${sectionsReussies.length}`);
    console.log(`🔳 Sections sans données: ${sectionsVides.length}`);
    console.log(`❌ Erreurs: ${sectionsErreur.length}`);
    console.log(`🗂️  Avec tableaux HTML: ${sectionsTableaux.length}`);
    console.log(`📊 Taux de réussite: ${((sectionsReussies.length/result.totalSections)*100).toFixed(1)}%`);
    console.log(`🎯 Taux de tableaux: ${sectionsReussies.length > 0 ? ((sectionsTableaux.length/sectionsReussies.length)*100).toFixed(1) : 0}%`);
    console.log('─'.repeat(40));
    
    // Afficher les sections avec tableaux HTML
    if (sectionsTableaux.length > 0) {
      console.log();
      console.log('🎯 SECTIONS AVEC TABLEAUX HTML (DONNÉES RÉELLES) :');
      sectionsTableaux.forEach((section, index) => {
        console.log(`\n${index + 1}. 📋 Section: ${section.section}`);
        console.log('─'.repeat(35));
        
        const content = section.content.contenu;
        
        // Compter les tableaux
        const tableMatches = content.match(/<table>/g);
        const tableCount = tableMatches ? tableMatches.length : 0;
        console.log(`📊 Nombre de tableaux: ${tableCount}`);
        
        // Afficher un aperçu du tableau
        const tableMatch = content.match(/<table>.*?<\/table>/s);
        if (tableMatch) {
          const tableHtml = tableMatch[0];
          console.log('📝 Aperçu du tableau HTML:');
          const preview = tableHtml.length > 600 ? tableHtml.substring(0, 600) + '...' : tableHtml;
          console.log(preview);
        }
        
        // Vérifier si c'est bien structuré
        const hasProperStructure = content.includes('<th>') && content.includes('<td>') && content.includes('<tr>');
        console.log(`🏗️  Structure valide: ${hasProperStructure ? '✅' : '❌'}`);
      });
    }
    
    // Afficher les sections réussies sans tableau
    const sectionsTexte = sectionsReussies.filter(r => !sectionsTableaux.includes(r));
    if (sectionsTexte.length > 0) {
      console.log();
      console.log('📝 SECTIONS RÉUSSIES (TEXTE SEUL) :');
      sectionsTexte.forEach((section, index) => {
        console.log(`${index + 1}. ${section.section}`);
      });
    }
    
    // Afficher les erreurs éventuelles
    if (sectionsErreur.length > 0) {
      console.log();
      console.log('❌ SECTIONS EN ERREUR :');
      sectionsErreur.forEach((section, index) => {
        console.log(`${index + 1}. ${section.section}: ${section.error}`);
      });
    }
    
    console.log();
    console.log('✅ TEST AVEC VRAIE CONVENTION TERMINÉ !');
    console.log('🎉 Validation complète des prompts corrigés avec données réelles !');
    
    // Sauvegarder les résultats pour inspection
    const resultatsDetailles = {
      convention: result.conventionName,
      sourceInfo: {
        pdfPath,
        pdfPages: pdfData.numpages,
        textLength: texteExtrait.length,
      },
      statistics: {
        totalSections: result.totalSections,
        successCount: result.successCount,
        htmlTableCount: result.htmlTableCount,
        processingTime: totalTime,
        successRate: ((result.successCount/result.totalSections)*100).toFixed(1) + '%'
      },
      sectionsAvecTableaux: sectionsTableaux.map(s => ({
        section: s.section,
        hasTable: s.content.contenu.includes('<table>'),
        contentLength: s.content.contenu.length
      }))
    };
    
    fs.writeFileSync('test-resultats-convention-reelle.json', JSON.stringify(resultatsDetailles, null, 2));
    console.log('📁 Résultats sauvegardés dans: test-resultats-convention-reelle.json');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
}

testAvecVraiPDF();