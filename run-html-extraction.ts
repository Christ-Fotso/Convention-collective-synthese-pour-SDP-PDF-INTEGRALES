import { htmlTableExtractor } from './server/services/html-table-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { performance } from 'perf_hooks';

interface ConventionInfo {
  id: string;
  name: string;
  pdfPath: string;
}

async function runHtmlExtraction() {
  console.log('🎯 EXTRACTION EN MASSE AVEC TABLEAUX HTML');
  
  try {
    // Charger la liste des conventions
    const conventionsData = JSON.parse(fs.readFileSync('conventions_collectives_integrales_lienpdf_nettoye.json', 'utf8'));
    
    // Sélectionner les 10 premières conventions pour test
    const conventionsToProcess = conventionsData.slice(0, 10);
    
    console.log(`📋 ${conventionsToProcess.length} conventions sélectionnées pour test HTML`);
    
    const results = [];
    const startGlobal = performance.now();
    
    for (let i = 0; i < conventionsToProcess.length; i++) {
      const convention = conventionsToProcess[i];
      const pdfPath = `resultats_telechargements/complet_20250813_102543/${convention.idcc}_${convention.libelle}.pdf`;
      
      console.log(`\n📄 [${i+1}/${conventionsToProcess.length}] ${convention.idcc} - ${convention.libelle}`);
      
      if (!fs.existsSync(pdfPath)) {
        console.log(`❌ PDF introuvable: ${pdfPath}`);
        results.push({
          conventionId: convention.idcc,
          conventionName: convention.libelle,
          status: 'pdf_not_found',
          error: 'PDF file not found'
        });
        continue;
      }
      
      try {
        // Extraction PDF
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const conventionText = pdfData.text;
        
        console.log(`📏 Taille: ${conventionText.length} caractères`);
        
        // Extraction avec tableaux HTML
        const result = await htmlTableExtractor.extractWithHtmlTables(
          conventionText, 
          convention.idcc, 
          convention.libelle
        );
        
        console.log(`✅ Succès: ${result.successCount}/${result.totalSections} sections, ${result.htmlTableCount} tableaux HTML`);
        
        results.push({
          ...result,
          status: 'success'
        });
        
      } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
        results.push({
          conventionId: convention.idcc,
          conventionName: convention.libelle,
          status: 'extraction_error',
          error: error.message
        });
      }
      
      // Pause entre extractions pour éviter rate limiting
      if (i < conventionsToProcess.length - 1) {
        console.log('⏱️  Pause 3s...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    const totalTime = performance.now() - startGlobal;
    
    // Statistiques finales
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.status === 'success');
    const totalSections = successful.reduce((sum, r) => sum + (r.totalSections || 0), 0);
    const totalSuccessful = successful.reduce((sum, r) => sum + (r.successCount || 0), 0);
    const totalHtmlTables = successful.reduce((sum, r) => sum + (r.htmlTableCount || 0), 0);
    
    console.log(`✅ Conventions traitées avec succès: ${successful.length}/${conventionsToProcess.length}`);
    console.log(`📋 Sections extraites: ${totalSuccessful}/${totalSections}`);
    console.log(`🎯 Tableaux HTML générés: ${totalHtmlTables}`);
    console.log(`⏱️  Temps total: ${Math.round(totalTime/1000)}s (${Math.round(totalTime/1000/60)}min)`);
    
    if (successful.length > 0) {
      const avgTime = totalTime / successful.length;
      console.log(`⚡ Temps moyen par convention: ${Math.round(avgTime/1000)}s`);
      
      const avgTablesPerConvention = totalHtmlTables / successful.length;
      console.log(`📊 Tableaux HTML moyens par convention: ${avgTablesPerConvention.toFixed(1)}`);
    }
    
    // Détail par section
    console.log('\n📈 RÉPARTITION PAR TYPE DE SECTION:');
    const sectionStats: {[key: string]: {success: number, total: number, tables: number}} = {};
    
    successful.forEach(result => {
      result.results?.forEach((section: any) => {
        const sectionName = section.section;
        if (!sectionStats[sectionName]) {
          sectionStats[sectionName] = {success: 0, total: 0, tables: 0};
        }
        sectionStats[sectionName].total++;
        if (section.status === 'success') {
          sectionStats[sectionName].success++;
          if (section.content.contenu.includes('<table>')) {
            sectionStats[sectionName].tables++;
          }
        }
      });
    });
    
    Object.entries(sectionStats).forEach(([section, stats]) => {
      const successRate = (stats.success / stats.total * 100).toFixed(1);
      const tableRate = (stats.tables / stats.success * 100).toFixed(1);
      console.log(`   ${section}: ${stats.success}/${stats.total} (${successRate}%) - ${stats.tables} tableaux (${tableRate}%)`);
    });
    
    // Erreurs
    const errors = results.filter(r => r.status !== 'success');
    if (errors.length > 0) {
      console.log('\n❌ ERREURS:');
      errors.forEach(error => {
        console.log(`   ${error.conventionId}: ${error.error}`);
      });
    }
    
    // Sauvegarde résultats
    const finalResults = {
      timestamp: new Date().toISOString(),
      totalConventions: conventionsToProcess.length,
      successfulConventions: successful.length,
      totalProcessingTime: totalTime,
      totalSections: totalSections,
      successfulSections: totalSuccessful,
      htmlTablesGenerated: totalHtmlTables,
      sectionStatistics: sectionStats,
      detailedResults: results
    };
    
    fs.writeFileSync('html-extraction-results.json', JSON.stringify(finalResults, null, 2));
    console.log('\n💾 Résultats complets sauvegardés: html-extraction-results.json');
    
    // Estimation pour toutes les conventions
    if (successful.length > 0) {
      const avgTimePerConvention = totalTime / successful.length;
      const totalConventions = 584; // Total des conventions téléchargées
      const estimatedTimeTotal = (avgTimePerConvention * totalConventions) / 1000 / 60 / 60; // en heures
      
      console.log('\n🔮 PROJECTION POUR TOUTES LES CONVENTIONS:');
      console.log(`   Conventions totales: ${totalConventions}`);
      console.log(`   Temps estimé: ${estimatedTimeTotal.toFixed(1)} heures`);
      console.log(`   Tableaux HTML estimés: ${Math.round(totalHtmlTables / successful.length * totalConventions)}`);
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
  }
}

runHtmlExtraction()
  .then(() => {
    console.log('\n🎉 Extraction HTML terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur:', error);
    process.exit(1);
  });