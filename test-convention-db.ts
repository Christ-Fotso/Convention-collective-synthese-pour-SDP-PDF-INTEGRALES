import { HtmlTableExtractor } from './server/services/html-table-extractor';
import { db } from './db';
import { conventions } from './db/schema';
import { eq } from 'drizzle-orm';

async function testConventionDepuisDB() {
  console.log('🧪 Test avec une convention depuis la base de données...\n');
  
  try {
    // Récupérer une convention avec du contenu depuis la DB
    const conventionTest = await db.query.conventions.findFirst({
      where: (conventions, { and, isNotNull, gt }) => and(
        isNotNull(conventions.title),
        gt(conventions.id, '100') // Prendre une convention avec un ID raisonnable
      )
    });
    
    if (!conventionTest) {
      console.log('❌ Aucune convention trouvée dans la base de données');
      return;
    }
    
    console.log(`✅ Convention sélectionnée: ${conventionTest.title}`);
    console.log(`📊 ID: ${conventionTest.id}`);
    console.log(`🔗 URL: ${conventionTest.url || 'N/A'}\n`);
    
    // Créer un texte de test réaliste basé sur une vraie structure de convention
    const texteRealiste = `
    CONVENTION COLLECTIVE NATIONALE
    ${conventionTest.title || 'Convention de test'}
    
    TITRE I - DISPOSITIONS GÉNÉRALES
    
    Article 1 - Champ d'application
    La présente convention s'applique sur l'ensemble du territoire français.
    
    TITRE II - CLASSIFICATION ET RÉMUNÉRATION
    
    Article 10 - Classification professionnelle
    Les emplois sont répartis en niveaux selon les critères suivants :
    
    Niveau I - Ouvriers et employés :
    - Échelon 1 : coefficient 100, salaire minimum 1600 €
    - Échelon 2 : coefficient 110, salaire minimum 1700 €
    - Échelon 3 : coefficient 120, salaire minimum 1800 €
    
    Niveau II - Techniciens et agents de maîtrise :
    - Échelon 1 : coefficient 140, salaire minimum 2000 €  
    - Échelon 2 : coefficient 160, salaire minimum 2200 €
    - Échelon 3 : coefficient 180, salaire minimum 2400 €
    
    Niveau III - Cadres :
    - Échelon 1 : coefficient 200, salaire minimum 2800 €
    - Échelon 2 : coefficient 220, salaire minimum 3200 €
    - Échelon 3 : coefficient 240, salaire minimum 3600 €
    
    Article 15 - Heures supplémentaires
    Les heures supplémentaires donnent lieu aux majorations suivantes :
    - De la 36e à la 43e heure hebdomadaire : 25%
    - Au-delà de la 43e heure hebdomadaire : 50%
    - Dimanche et jours fériés : 100%
    - Travail de nuit (22h-6h) : 25%
    
    TITRE III - TEMPS DE TRAVAIL
    
    Article 20 - Durée du travail
    La durée hebdomadaire est fixée à 35 heures réparties sur 5 jours.
    Possibilité de modulation annuelle dans la limite de 1600 heures.
    
    Article 25 - Période d'essai
    Les durées de période d'essai sont les suivantes :
    - Ouvriers et employés : 2 mois renouvelable 1 fois
    - Techniciens et agents de maîtrise : 3 mois renouvelable 1 fois  
    - Cadres : 4 mois renouvelable 1 fois
    
    TITRE IV - CONGÉS ET ABSENCES
    
    Article 30 - Congés payés
    Congés supplémentaires d'ancienneté :
    - Après 5 ans : 1 jour ouvrable supplémentaire
    - Après 10 ans : 2 jours ouvrables supplémentaires
    - Après 15 ans : 3 jours ouvrables supplémentaires
    - Après 20 ans : 4 jours ouvrables supplémentaires
    
    Article 35 - Événements familiaux
    Les congés pour événements familiaux sont accordés selon les durées suivantes :
    - Mariage du salarié : 4 jours ouvrables
    - Naissance ou adoption : 3 jours ouvrables
    - Décès conjoint ou enfant : 3 jours ouvrables
    - Décès parent : 2 jours ouvrables
    - Mariage enfant : 1 jour ouvrable
    
    TITRE V - PROTECTION SOCIALE
    
    Article 40 - Prévoyance
    Cotisations obligatoires réparties comme suit :
    
    Garantie décès/invalidité :
    - Ouvriers/Employés : 1,50% (0,90% employeur / 0,60% salarié)
    - Techniciens/Agents de maîtrise : 1,80% (1,08% employeur / 0,72% salarié)
    - Cadres : 2,20% (1,32% employeur / 0,88% salarié)
    
    Garantie incapacité temporaire :
    - Toutes catégories : 1,20% (0,80% employeur / 0,40% salarié)
    
    Article 45 - Mutuelle santé
    Participation employeur aux frais de complémentaire santé :
    - Couverture de base : 60% de la cotisation
    - Option famille : 40% de la cotisation
    - Taux global moyen : 2,80% du salaire brut
    
    TITRE VI - RUPTURE DU CONTRAT
    
    Article 50 - Préavis
    Les durées de préavis sont les suivantes :
    
    En cas de licenciement :
    - Ouvriers/Employés : 1 mois (< 2 ans), 2 mois (≥ 2 ans)
    - Techniciens/Maîtrise : 2 mois (< 2 ans), 3 mois (≥ 2 ans)  
    - Cadres : 3 mois quel que soit l'ancienneté
    
    En cas de démission :
    - Ouvriers/Employés : 1 mois
    - Techniciens/Maîtrise : 2 mois
    - Cadres : 3 mois
    
    Article 55 - Indemnité de licenciement
    L'indemnité conventionnelle de licenciement est calculée comme suit :
    - De 1 à 5 ans d'ancienneté : 1/4 mois par année
    - De 5 à 10 ans d'ancienneté : 1/3 mois par année
    - Au-delà de 10 ans : 1/2 mois par année
    Avec un minimum de 2 mois de salaire après 5 ans d'ancienneté.
    
    Cette convention est étendue par arrêté du 15 janvier 2023.
    `;
    
    // Initialiser l'extracteur HTML
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Lancement de l\'extraction avec toutes les sections prioritaires...\n');
    const startTime = Date.now();
    
    // Utiliser l'extracteur avec le texte réaliste
    const result = await extractor.extractWithHtmlTables(
      texteRealiste,
      conventionTest.id,
      conventionTest.title || 'Convention de test'
    );
    
    const totalTime = Date.now() - startTime;
    
    console.log('📊 RÉSULTATS COMPLETS :');
    console.log('═'.repeat(60));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`🎯 Sections traitées: ${result.successCount}/${result.totalSections}`);
    console.log(`📊 Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps de traitement: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    console.log('═'.repeat(60));
    console.log();
    
    // Analyser les résultats
    const sectionsAvecTableaux = result.results.filter(r => 
      r.status === 'success' && 
      r.content && 
      typeof r.content === 'object' &&
      r.content.contenu && 
      r.content.contenu.includes('<table>')
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
    
    // Afficher les sections avec tableaux
    if (sectionsAvecTableaux.length > 0) {
      console.log('🎯 SECTIONS AVEC TABLEAUX HTML :');
      sectionsAvecTableaux.forEach((section, index) => {
        console.log(`\n${index + 1}. 📋 ${section.section}`);
        console.log('─'.repeat(30));
        const content = section.content.contenu;
        
        // Montrer le tableau généré
        const tableMatch = content.match(/<table>.*?<\/table>/s);
        if (tableMatch) {
          const tableHtml = tableMatch[0];
          console.log('Tableau HTML généré:');
          console.log(tableHtml.length > 500 ? tableHtml.substring(0, 500) + '...' : tableHtml);
        }
      });
    }
    
    // Afficher les erreurs
    if (sectionsErreur.length > 0) {
      console.log('\n❌ SECTIONS EN ERREUR :');
      sectionsErreur.forEach((section, index) => {
        console.log(`${index + 1}. ${section.section}: ${section.error}`);
      });
    }
    
    console.log('\n✅ Test complet terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  } finally {
    process.exit(0);
  }
}

testConventionDepuisDB();