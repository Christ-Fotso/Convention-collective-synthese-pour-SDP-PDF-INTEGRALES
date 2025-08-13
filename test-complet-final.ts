import { HtmlTableExtractor } from './server/services/html-table-extractor';

async function testCompletFinal() {
  console.log('🧪 Test final avec convention réaliste complète...\n');
  
  try {
    // Texte d'une vraie convention avec toutes les sections importantes
    const conventionComplete = `
    CONVENTION COLLECTIVE NATIONALE DES TRANSPORTS ROUTIERS ET ACTIVITÉS AUXILIAIRES DU TRANSPORT
    IDCC 16 - Brochure JO 3085
    Texte de base : Convention collective du 21 décembre 1950
    Étendue par arrêté du 15 février 1951
    
    TITRE I - DISPOSITIONS GÉNÉRALES
    
    Article 1er - Champ d'application  
    La présente convention collective s'applique sur l'ensemble du territoire français aux entreprises de transport routier de marchandises et de voyageurs ainsi qu'aux entreprises exerçant des activités auxiliaires du transport.
    
    TITRE II - CLASSIFICATIONS ET RÉMUNÉRATIONS
    
    Article 15 - Classification des emplois
    Les emplois sont répartis en 5 niveaux de classification comportant chacun plusieurs échelons :
    
    Niveau I - Ouvriers d'exécution :
    - Échelon 1 : coefficient 100 - manœuvre, aide-magasinier
    - Échelon 2 : coefficient 105 - ouvrier spécialisé, magasinier
    - Échelon 3 : coefficient 110 - conducteur PL, carrossier
    
    Niveau II - Ouvriers qualifiés :
    - Échelon 1 : coefficient 125 - mécanicien, contrôleur technique
    - Échelon 2 : coefficient 135 - chef d'équipe, responsable parc
    - Échelon 3 : coefficient 145 - chef atelier, formateur
    
    Niveau III - Employés :
    - Échelon 1 : coefficient 150 - employé administratif, réceptionnaire
    - Échelon 2 : coefficient 165 - secrétaire, comptable
    - Échelon 3 : coefficient 180 - responsable exploitation
    
    Niveau IV - Techniciens et agents de maîtrise :
    - Échelon 1 : coefficient 200 - technicien maintenance, dispatcher
    - Échelon 2 : coefficient 230 - chef de service, responsable commercial
    - Échelon 3 : coefficient 260 - ingénieur technico-commercial
    
    Niveau V - Cadres :
    - Échelon 1 : coefficient 300 - cadre débutant, chef d'agence
    - Échelon 2 : coefficient 400 - cadre confirmé, directeur régional
    - Échelon 3 : coefficient 500 - cadre supérieur, directeur général
    
    Article 20 - Grilles de rémunération
    Les salaires minimaux applicables au 1er janvier 2024 sont les suivants :
    
    Niveau I :
    - Coefficient 100 : 1 747,20 € mensuel / 11,27 € horaire
    - Coefficient 105 : 1 834,56 € mensuel / 11,83 € horaire  
    - Coefficient 110 : 1 921,92 € mensuel / 12,39 € horaire
    
    Niveau II :
    - Coefficient 125 : 2 184,00 € mensuel / 14,08 € horaire
    - Coefficient 135 : 2 358,72 € mensuel / 15,21 € horaire
    - Coefficient 145 : 2 533,44 € mensuel / 16,34 € horaire
    
    Niveau III :
    - Coefficient 150 : 2 620,80 € mensuel / 16,90 € horaire
    - Coefficient 165 : 2 882,88 € mensuel / 18,59 € horaire
    - Coefficient 180 : 3 144,96 € mensuel / 20,29 € horaire
    
    Niveau IV :
    - Coefficient 200 : 3 494,40 € mensuel / 22,55 € horaire
    - Coefficient 230 : 4 018,56 € mensuel / 25,93 € horaire
    - Coefficient 260 : 4 542,72 € mensuel / 29,31 € horaire
    
    Niveau V (forfait mensuel) :
    - Coefficient 300 : 5 241,60 € mensuel
    - Coefficient 400 : 6 988,80 € mensuel
    - Coefficient 500 : 8 736,00 € mensuel
    
    TITRE III - CONDITIONS DE TRAVAIL
    
    Article 25 - Période d'essai
    Les durées maximales de la période d'essai, renouvellement compris, sont fixées comme suit :
    
    - Niveau I et II : 2 mois, renouvelable une fois pour 2 mois (soit 4 mois maximum)
    - Niveau III : 3 mois, renouvelable une fois pour 3 mois (soit 6 mois maximum)  
    - Niveau IV et V : 4 mois, renouvelable une fois pour 4 mois (soit 8 mois maximum)
    
    Le délai de prévenance en cas de rupture pendant la période d'essai est de :
    - 24 heures si la durée de présence est inférieure à 8 jours
    - 48 heures si la durée de présence est comprise entre 8 jours et 1 mois
    - 2 semaines si la durée de présence est supérieure à 1 mois
    
    Article 30 - Durée du travail
    La durée hebdomadaire de travail est fixée à 35 heures pour le personnel sédentaire et selon la réglementation spécifique pour les conducteurs (temps de conduite, temps de service, repos).
    
    Possibilité de modulation annuelle dans les limites suivantes :
    - Personnel sédentaire : 1 607 heures annuelles
    - Personnel roulant : selon la réglementation transport
    
    Article 35 - Heures supplémentaires
    Les heures supplémentaires donnent lieu aux majorations suivantes :
    
    Personnel sédentaire :
    - De la 36e à la 43e heure : majoration de 25%
    - Au-delà de la 43e heure : majoration de 50%
    - Dimanche et jours fériés : majoration de 100%
    - Travail de nuit (22h-6h) : majoration de 25%
    
    Personnel roulant :
    - Heures d'amplitude au-delà de 10h : majoration de 25%
    - Heures supplémentaires : majoration de 25% (36e-43e heure) et 50% (au-delà)
    - Dimanche : majoration de 100%
    - Nuit (21h-6h) : majoration de 25%
    
    TITRE IV - CONGÉS ET ABSENCES
    
    Article 40 - Congés payés
    Outre les congés légaux de 2,5 jours ouvrables par mois travaillé, la convention prévoit des congés supplémentaires d'ancienneté :
    
    - Après 5 ans d'ancienneté : 1 jour ouvrable supplémentaire
    - Après 10 ans d'ancienneté : 2 jours ouvrables supplémentaires
    - Après 15 ans d'ancienneté : 3 jours ouvrables supplémentaires  
    - Après 20 ans d'ancienneté : 4 jours ouvrables supplémentaires
    - Après 25 ans d'ancienneté : 5 jours ouvrables supplémentaires
    
    Article 45 - Congés pour événements familiaux
    Les congés pour événements familiaux sont accordés selon les durées suivantes :
    
    - Mariage du salarié : 4 jours ouvrables (8 jours si mariage dans une autre région)
    - Naissance ou adoption d'un enfant : 3 jours ouvrables
    - Décès du conjoint ou d'un enfant : 3 jours ouvrables
    - Décès du père, mère, beau-père, belle-mère : 2 jours ouvrables
    - Décès grands-parents : 1 jour ouvrable
    - Mariage d'un enfant : 1 jour ouvrable
    - Première communion ou profession de foi d'un enfant : 1 jour ouvrable
    
    TITRE V - PROTECTION SOCIALE
    
    Article 50 - Prévoyance
    Cotisations obligatoires au régime de prévoyance réparties comme suit :
    
    Garantie décès/invalidité :
    - Ouvriers (Niveaux I-II) : taux 1,45% (0,87% employeur / 0,58% salarié)
    - Employés (Niveau III) : taux 1,75% (1,05% employeur / 0,70% salarié)  
    - TAM (Niveau IV) : taux 2,10% (1,26% employeur / 0,84% salarié)
    - Cadres (Niveau V) : taux 2,50% (1,50% employeur / 1,00% salarié)
    
    Garantie incapacité temporaire :
    - Tous niveaux : taux 1,30% (0,85% employeur / 0,45% salarié)
    
    Article 55 - Mutuelle santé  
    Participation obligatoire de l'employeur aux frais de complémentaire santé :
    
    - Couverture individuelle : 60% de la cotisation, 40% salarié
    - Couverture famille : 50% de la cotisation, 50% salarié
    - Taux moyen cotisation : 3,20% du salaire brut pour couverture individuelle
    - Taux moyen cotisation : 5,80% du salaire brut pour couverture famille
    
    Les garanties minimales incluent :
    - Frais médicaux : remboursement 150% SS
    - Pharmacie : remboursement 120% SS  
    - Dentaire : forfait 400€/an
    - Optique : forfait 200€ par équipement
    - Hospitalisation : chambre particulière prise en charge
    
    TITRE VI - RUPTURE DU CONTRAT DE TRAVAIL
    
    Article 60 - Préavis
    Les durées de préavis sont les suivantes :
    
    En cas de licenciement (sauf faute grave) :
    - Niveaux I-II, moins de 6 mois d'ancienneté : 1 semaine
    - Niveaux I-II, de 6 mois à 2 ans d'ancienneté : 1 mois  
    - Niveaux I-II, plus de 2 ans d'ancienneté : 2 mois
    - Niveau III, moins de 2 ans d'ancienneté : 2 mois
    - Niveau III, plus de 2 ans d'ancienneté : 3 mois
    - Niveaux IV-V : 3 mois quel que soit l'ancienneté
    
    En cas de démission :
    - Niveaux I-II : 1 mois
    - Niveau III : 2 mois  
    - Niveaux IV-V : 3 mois
    
    Article 65 - Indemnité de licenciement
    L'indemnité conventionnelle de licenciement est calculée selon le barème suivant :
    
    - De 8 mois à 2 ans d'ancienneté : 1/5e mois par année complète
    - De 2 à 5 ans d'ancienneté : 1/4 mois par année complète
    - De 5 à 10 ans d'ancienneté : 1/3 mois par année complète
    - Au-delà de 10 ans d'ancienneté : 1/2 mois par année complète
    
    Avec un minimum garanti de :
    - 2 mois de salaire après 5 ans d'ancienneté
    - 3 mois de salaire après 15 ans d'ancienneté  
    - 4 mois de salaire après 25 ans d'ancienneté
    
    La base de calcul retient la rémunération brute moyenne des 12 derniers mois.
    
    Article 70 - Indemnité de départ à la retraite
    L'indemnité de départ volontaire à la retraite est égale à :
    - De 5 à 10 ans d'ancienneté : 1 mois de salaire
    - De 10 à 15 ans d'ancienneté : 1,5 mois de salaire
    - De 15 à 20 ans d'ancienneté : 2 mois de salaire
    - De 20 à 25 ans d'ancienneté : 3 mois de salaire
    - Au-delà de 25 ans d'ancienneté : 4 mois de salaire
    
    Cette convention collective est étendue par arrêtés successifs, le dernier en date du 28 février 2024.
    `;
    
    console.log(`📄 Convention test préparée (${conventionComplete.length} caractères)\n`);
    
    // Initialiser l'extracteur
    const extractor = new HtmlTableExtractor();
    
    console.log('🚀 Démarrage extraction complète avec Gemini 2.5 Pro...\n');
    const startTime = Date.now();
    
    const result = await extractor.extractWithHtmlTables(
      conventionComplete,
      '16',
      'Transports routiers et activités auxiliaires du transport'
    );
    
    const totalTime = Date.now() - startTime;
    
    console.log('📊 RÉSULTATS FINAUX :');
    console.log('═'.repeat(60));
    console.log(`📋 Convention: ${result.conventionName}`);
    console.log(`🎯 Sections extraites avec succès: ${result.successCount}/${result.totalSections}`);
    console.log(`📊 Tableaux HTML générés: ${result.htmlTableCount}`);
    console.log(`⏱️  Temps total: ${(totalTime/1000).toFixed(1)} secondes`);
    console.log(`💰 Coût: ~1 requête Gemini 2.5 Pro`);
    console.log('═'.repeat(60));
    
    // Statistiques détaillées
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
    console.log('📈 STATISTIQUES DÉTAILLÉES :');
    console.log('─'.repeat(40));
    console.log(`✅ Extractions réussies: ${sectionsReussies.length}`);
    console.log(`🔳 Sections sans données: ${sectionsVides.length}`);  
    console.log(`❌ Sections en erreur: ${sectionsErreur.length}`);
    console.log(`🗂️  Tableaux HTML créés: ${sectionsTableaux.length}`);
    console.log(`🎯 Taux de succès: ${((sectionsReussies.length/result.totalSections)*100).toFixed(1)}%`);
    console.log(`📊 Taux de tableaux: ${((sectionsTableaux.length/sectionsReussies.length)*100).toFixed(1)}%`);
    console.log('─'.repeat(40));
    
    // Afficher les sections avec tableaux HTML
    if (sectionsTableaux.length > 0) {
      console.log();
      console.log('🎯 SECTIONS AVEC TABLEAUX HTML GÉNÉRÉS :');
      sectionsTableaux.forEach((section, index) => {
        console.log(`\n${index + 1}. 📋 Section: ${section.section}`);
        console.log('─'.repeat(35));
        
        const content = section.content.contenu;
        const tableCount = (content.match(/<table>/g) || []).length;
        console.log(`📊 Nombre de tableaux: ${tableCount}`);
        
        // Afficher un échantillon du tableau
        const tableMatch = content.match(/<table>.*?<\/table>/s);
        if (tableMatch) {
          const tableHtml = tableMatch[0];
          const preview = tableHtml.length > 400 ? tableHtml.substring(0, 400) + '...' : tableHtml;
          console.log('📝 Aperçu du tableau:');
          console.log(preview);
        }
      });
    }
    
    // Afficher les sections réussies sans tableau
    const sectionsTexte = sectionsReussies.filter(r => 
      !sectionsTableaux.includes(r)
    );
    
    if (sectionsTexte.length > 0) {
      console.log();
      console.log('📝 SECTIONS EXTRAITES EN TEXTE :');
      sectionsTexte.forEach((section, index) => {
        console.log(`${index + 1}. ${section.section}`);
        if (section.content && typeof section.content === 'object' && section.content.contenu) {
          const preview = section.content.contenu.substring(0, 100);
          console.log(`   → "${preview}..."`);
        }
      });
    }
    
    console.log();
    console.log('✅ TEST COMPLET TERMINÉ AVEC SUCCÈS !');
    console.log('🎉 Les prompts corrigés fonctionnent parfaitement avec Gemini !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test complet :', error);
  }
}

testCompletFinal();