/**
 * Script pour synchroniser les sections modifiées de la base de données vers data.json
 */

import { db } from './db/index.js';
import { conventionSections } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync, writeFileSync } from 'fs';

interface JsonSection {
  [key: string]: any;
}

interface JsonData {
  [conventionId: string]: {
    [sectionType: string]: JsonSection;
  };
}

/**
 * Charge le fichier data.json existant
 */
function loadJsonData(): JsonData {
  try {
    const jsonContent = readFileSync('./data.json', 'utf-8');
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Erreur lors du chargement de data.json:', error);
    return {};
  }
}

/**
 * Récupère les sections transformées (avec tableaux) depuis la base de données
 */
async function getTransformedSections() {
  console.log('🔍 Récupération des sections transformées depuis la base de données...');
  
  const sections = await db
    .select()
    .from(conventionSections)
    .where(eq(conventionSections.sectionType, 'conges.evenement-familial'));
  
  const transformedSections = sections.filter(section => 
    section.content && section.content.includes('|')
  );
  
  console.log(`✅ ${transformedSections.length} sections transformées trouvées`);
  return transformedSections;
}

/**
 * Met à jour le fichier data.json avec les sections transformées
 */
async function syncToJson() {
  console.log('🚀 Démarrage de la synchronisation database -> data.json');
  
  // Charger les données JSON existantes
  const jsonData = loadJsonData();
  
  // Récupérer les sections transformées
  const transformedSections = await getTransformedSections();
  
  let updatedCount = 0;
  
  for (const section of transformedSections) {
    const conventionId = section.conventionId;
    const sectionKey = 'Evènement_familial'; // Clé exacte utilisée dans data.json
    
    // Chercher la convention par son IDCC dans toutes les clés
    let conventionFound = false;
    
    for (const [conventionName, conventionData] of Object.entries(jsonData)) {
      if (conventionData && typeof conventionData === 'object' && 
          'idcc' in conventionData && conventionData.idcc === conventionId) {
        
        // Vérifier si la section existe
        if (conventionData.sections && conventionData.sections[sectionKey]) {
          // Mettre à jour le contenu
          conventionData.sections[sectionKey].contenu = section.content;
          updatedCount++;
          conventionFound = true;
          console.log(`✅ Convention ${conventionId} (${conventionName}) - Section mise à jour`);
        }
        break;
      }
    }
    
    if (!conventionFound) {
      console.log(`⚠️  Convention ${conventionId} - Pas trouvée dans data.json`);
    }
  }
  
  // Sauvegarder le fichier JSON mis à jour
  try {
    writeFileSync('./data.json', JSON.stringify(jsonData, null, 2));
    console.log(`🎉 Synchronisation terminée: ${updatedCount} sections mises à jour dans data.json`);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  try {
    await syncToJson();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();