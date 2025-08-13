import { batchProcessor } from './server/services/batch-processor';

async function runFullExtraction() {
  console.log('🚀 LANCEMENT EXTRACTION MASSIVE 584 CONVENTIONS');
  console.log('📋 Stratégie: Blocs 1+2 Gemini 2.5 Pro en parallèle');
  
  try {
    // 1. Scanner les conventions disponibles
    console.log('\n📁 Scan des conventions...');
    const conventions = await batchProcessor.scanConventions();
    
    if (conventions.length === 0) {
      console.error('❌ Aucune convention trouvée');
      return;
    }
    
    // Affichage des plus grandes conventions (potentiel chunking)
    console.log('\n📏 Top 10 plus grosses conventions:');
    conventions
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 10)
      .forEach((conv, i) => {
        const sizeMB = (conv.fileSize / 1024 / 1024).toFixed(1);
        console.log(`  ${i + 1}. ${conv.idcc} - ${sizeMB}MB - ${conv.name.substring(0, 50)}...`);
      });
    
    // 2. Choix du mode de traitement
    console.log('\n🎛️  MODES DISPONIBLES:');
    console.log('1. TEST (10 premières conventions)');
    console.log('2. ÉCHANTILLON (50 conventions variées)'); 
    console.log('3. COMPLET (584 conventions - production)');
    
    // Pour ce test, on fait l'échantillon
    const mode = process.argv[2] || '2';
    let selectedConventions = conventions;
    
    switch (mode) {
      case '1':
        selectedConventions = conventions.slice(0, 10);
        console.log(`🧪 Mode TEST: ${selectedConventions.length} conventions`);
        break;
      case '2':
        // Échantillon varié: petites, moyennes et grosses
        const small = conventions.slice(0, 17);  // 17 plus petites
        const medium = conventions.slice(Math.floor(conventions.length * 0.3), Math.floor(conventions.length * 0.3) + 17); // 17 moyennes
        const large = conventions.slice(-16); // 16 plus grosses
        selectedConventions = [...small, ...medium, ...large];
        console.log(`📊 Mode ÉCHANTILLON: ${selectedConventions.length} conventions variées`);
        break;
      case '3':
        console.log(`🏭 Mode COMPLET: ${selectedConventions.length} conventions`);
        break;
    }
    
    // 3. Configuration parallélisme
    const maxParallel = mode === '3' ? 2 : 3; // Mode prod plus conservateur
    console.log(`⚙️  Parallélisme: ${maxParallel} threads`);
    
    // 4. Callback de progression
    let lastProgressLog = 0;
    const progressCallback = (progress: any) => {
      const now = Date.now();
      
      // Log toutes les 10 secondes ou toutes les 5 conventions
      if (now - lastProgressLog > 10000 || progress.processed % 5 === 0) {
        const elapsed = (now - progress.startTime) / 1000 / 60;
        const eta = progress.estimatedTimeLeft / 1000 / 60;
        const successRate = (progress.successful / progress.processed * 100).toFixed(1);
        
        console.log(`📊 ${progress.processed}/${progress.total} | ✅ ${successRate}% | ⏱️  ${elapsed.toFixed(1)}min | ETA: ${eta.toFixed(1)}min`);
        
        if (progress.currentConvention) {
          console.log(`🔄 En cours: ${progress.currentConvention}`);
        }
        
        lastProgressLog = now;
      }
    };
    
    // 5. Lancement du traitement
    console.log(`\n🚀 DÉBUT EXTRACTION - ${new Date().toLocaleTimeString()}`);
    const startTime = Date.now();
    
    await batchProcessor.processBatch(selectedConventions, maxParallel, progressCallback);
    
    const totalTime = (Date.now() - startTime) / 1000 / 60;
    console.log(`\n✅ EXTRACTION TERMINÉE - ${new Date().toLocaleTimeString()}`);
    console.log(`⏱️  Temps total: ${totalTime.toFixed(1)} minutes`);
    
    // 6. Sauvegarde des résultats
    const outputFile = `batch-results-${mode === '1' ? 'test' : mode === '2' ? 'sample' : 'full'}-${Date.now()}.json`;
    await batchProcessor.saveResults(outputFile);
    
    // 7. Estimation coûts
    const results = batchProcessor.getResults();
    const totalSections = results.reduce((sum, r) => {
      const bloc1Sections = r.bloc1?.successCount || 0;
      const bloc2Sections = r.bloc2?.successCount || 0;
      return sum + bloc1Sections + bloc2Sections;
    }, 0);
    
    console.log('\n💰 ESTIMATION COÛTS:');
    const apiCalls = results.length * 2; // 2 appels par convention (bloc1 + bloc2)
    const estimatedCost = apiCalls * 0.03; // ~$0.03 par appel Gemini
    console.log(`🔄 Appels API: ${apiCalls}`);
    console.log(`📄 Sections extraites: ${totalSections}`);
    console.log(`💵 Coût estimé: $${estimatedCost.toFixed(2)}`);
    
    if (mode === '2') {
      const fullCost = (estimatedCost / selectedConventions.length) * 584;
      console.log(`🏭 Projection 584 conventions: $${fullCost.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  }
}

// Arguments de ligne de commande
console.log('Arguments disponibles:');
console.log('npm run extract-batch 1  # Test 10 conventions');
console.log('npm run extract-batch 2  # Échantillon 50 conventions');
console.log('npm run extract-batch 3  # Production 584 conventions');
console.log('');

runFullExtraction()
  .then(() => {
    console.log('\n🎉 EXTRACTION TERMINÉE AVEC SUCCÈS !');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ÉCHEC EXTRACTION:', error);
    process.exit(1);
  });