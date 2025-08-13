import { HtmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testConventionRapide() {
  console.log('🧪 Test rapide avec une convention plus petite...\n');
  
  try {
    // Prendre un PDF de taille moyenne pour un test complet
    const pdfPath = 'resultats_telechargements/complet_20250813_102543/1147_Cabinets médicaux.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Fichier PDF non trouvé. Listage des fichiers disponibles:');
      const files = fs.readdirSync('resultats_telechargements/complet_20250813_102543/')
        .filter(f => f.endsWith('.pdf'))
        .slice(0, 10);
      console.log(files.join('\n'));
      return;
    }
    
    console.log(`📄 Test avec: ${pdfPath}`);
    
    // Extraire le texte du PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const texteExtrait = pdfData.text;
    
    console.log(`✅ PDF lu: ${texteExtrait.length} caractères, ${pdfData.numpages} pages\n`);
    
    // Si le texte est trop long, prendre un échantillon représentatif
    const texteTest = texteExtrait.length > 50000 ? 
      texteExtrait.substring(0, 25000) + '\n\n[...TEXTE COUPÉ POUR TEST...]\n\n' + texteExtrait.substring(texteExtrait.length - 25000) :
      texteExtrait;
    
    console.log(`📝 Texte de test: ${texteTest.length} caractères`);
    console.log('─'.repeat(50));
    console.log('ÉCHANTILLON:');
    console.log(texteTest.substring(0, 400) + '...');
    console.log('─'.repeat(50));
    console.log();
    
    // Initialiser l'extracteur
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Extraction en cours...');
    const startTime = Date.now();
    
    const result = await extractor.extractWithHtmlTables(
      texteTest,
      '1147',
      'Convention collective Cabinets médicaux'
    );
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n📊 RÉSULTATS :');
    console.log('═'.repeat(50));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`✅ Sections réussies: ${result.successCount}/${result.totalSections}`);
    console.log(`🗂️  Tableaux HTML: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps: ${(totalTime/1000).toFixed(1)}s`);
    console.log('═'.repeat(50));
    
    // Afficher les sections avec tableaux
    const sectionsAvecTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content && 
      typeof r.content === 'object' &&
      r.content.contenu && 
      r.content.contenu.includes('<table>')
    );
    
    if (sectionsAvecTableaux.length > 0) {
      console.log('\n🎯 TABLEAUX HTML GÉNÉRÉS :');
      sectionsAvecTableaux.forEach((section, index) => {
        console.log(`\n${index + 1}. ${section.section}`);
        const tableCount = (section.content.contenu.match(/<table>/g) || []).length;
        console.log(`   📊 ${tableCount} tableau(x)`);
        
        const tableMatch = section.content.contenu.match(/<table>.*?<\/table>/s);
        if (tableMatch) {
          const preview = tableMatch[0].substring(0, 200);
          console.log(`   📝 Aperçu: ${preview}...`);
        }
      });
    }
    
    console.log('\n✅ Test rapide terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConventionRapide();