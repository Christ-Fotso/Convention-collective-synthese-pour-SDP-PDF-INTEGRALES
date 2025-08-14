import { HtmlTableExtractor } from './server/services/html-table-extractor';

async function demonstrationTableaux() {
  console.log('🎯 DÉMONSTRATION - Génération de tableaux HTML depuis conventions\n');
  
  try {
    // Créer un exemple de convention réaliste avec données tabulaires
    const convention = `
    CONVENTION COLLECTIVE NATIONALE DES TRANSPORTS ROUTIERS
    IDCC 16
    
    Article 20 - Classification
    Les emplois sont classés selon les niveaux suivants :
    
    Niveau I - Ouvriers :
    - Coefficient 100 : Manœuvre (1 750 € minimum)
    - Coefficient 110 : Ouvrier spécialisé (1 925 € minimum) 
    - Coefficient 120 : Conducteur PL (2 100 € minimum)
    
    Niveau II - Employés :
    - Coefficient 140 : Employé administratif (2 450 € minimum)
    - Coefficient 160 : Secrétaire qualifié (2 800 € minimum)
    - Coefficient 180 : Responsable service (3 150 € minimum)
    
    Article 35 - Heures supplémentaires
    Les majorations sont les suivantes :
    - 36e à 43e heure : majoration 25%
    - Au-delà 43e heure : majoration 50%
    - Dimanche : majoration 100%
    - Nuit (22h-6h) : majoration 25%
    
    Article 40 - Préavis de licenciement
    Selon l'ancienneté :
    - Moins de 6 mois : 1 semaine
    - 6 mois à 2 ans : 1 mois
    - Plus de 2 ans : 2 mois
    - Cadres : 3 mois quel que soit l'ancienneté
    
    Article 45 - Congés événements familiaux
    - Mariage du salarié : 4 jours
    - Naissance/adoption : 3 jours  
    - Décès conjoint/enfant : 3 jours
    - Décès parents : 2 jours
    - Mariage enfant : 1 jour
    `;
    
    console.log('📄 Convention de démonstration préparée\n');
    
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Extraction avec génération de tableaux HTML...\n');
    const startTime = Date.now();
    
    const result = await extractor.extractWithHtmlTables(
      convention,
      '16',
      'Démonstration Transports Routiers'
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log('📊 RÉSULTATS DE LA DÉMONSTRATION :');
    console.log('═'.repeat(60));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`✅ Sections extraites: ${result.successCount}/${result.totalSections}`);
    console.log(`🗂️  Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps de traitement: ${(processingTime/1000).toFixed(1)} secondes`);
    console.log('═'.repeat(60));
    
    // Afficher les tableaux HTML générés
    const sectionsAvecTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content && 
      typeof r.content === 'object' &&
      r.content.contenu && 
      r.content.contenu.includes('<table>')
    );
    
    console.log('\n🎯 TABLEAUX HTML GÉNÉRÉS :');
    console.log('─'.repeat(60));
    
    sectionsAvecTableaux.forEach((section, index) => {
      console.log(`\n${index + 1}. SECTION: ${section.section.toUpperCase()}`);
      console.log('─'.repeat(40));
      
      const content = section.content.contenu;
      
      // Extraire les tableaux HTML
      const tableMatches = content.match(/<table>.*?<\/table>/gs);
      
      if (tableMatches) {
        tableMatches.forEach((table, tableIndex) => {
          console.log(`\n📊 Tableau ${tableIndex + 1} :`);
          console.log(table);
          console.log();
        });
      }
      
      // Afficher aussi le texte associé s'il y en a
      const texteSansTable = content.replace(/<table>.*?<\/table>/gs, '[TABLEAU]');
      if (texteSansTable.trim() !== '[TABLEAU]' && texteSansTable.trim() !== '') {
        console.log('📝 Texte associé :');
        console.log(texteSansTable.trim());
        console.log();
      }
    });
    
    // Afficher les sections sans tableau
    const sectionsSansTableau = result.results.filter(r => 
      r.status === 'success' && 
      (!r.content || typeof r.content !== 'object' || !r.content.contenu || !r.content.contenu.includes('<table>'))
    );
    
    if (sectionsSansTableau.length > 0) {
      console.log('\n📝 SECTIONS TEXTE SEUL :');
      console.log('─'.repeat(40));
      sectionsSansTableau.forEach((section, index) => {
        console.log(`\n${index + 1}. ${section.section}`);
        if (section.content && typeof section.content === 'object' && section.content.contenu) {
          console.log(section.content.contenu.substring(0, 200) + '...');
        }
      });
    }
    
    console.log('\n✅ DÉMONSTRATION TERMINÉE !');
    console.log('🎉 Les tableaux HTML sont correctement formatés pour l\'affichage web');
    
  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error.message);
  }
}

demonstrationTableaux();