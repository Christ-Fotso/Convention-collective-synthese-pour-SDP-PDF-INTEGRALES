/**
 * Script pour réinitialiser TOUTES les sections extraites des conventions collectives
 * Cela force la régénération complète des données avec les nouvelles instructions de formatage
 */

import { db } from '../db';
import { conventionSections, conventions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Réinitialise toutes les sections de toutes les conventions
 */
async function resetAllSections() {
  console.log('🚨 RÉINITIALISATION DE TOUTES LES SECTIONS EN BASE DE DONNÉES 🚨');
  console.log('Cette opération va supprimer toutes les extractions et forcer leur régénération');
  console.log('----------------------------------------------------------------------');
  
  // Récupérer la liste des conventions depuis la base de données
  const allConventions = await db.select().from(conventions);
  console.log(`Nombre total de conventions: ${allConventions.length}`);
  
  // Supprimer toutes les sections
  try {
    const result = await db.delete(conventionSections);
    console.log(`Suppression réussie: ${result.rowCount} sections supprimées`);
  } catch (error) {
    console.error('Erreur lors de la suppression des sections:', error);
    return;
  }
  
  console.log('----------------------------------------------------------------------');
  console.log('🟢 Réinitialisation terminée avec succès');
  console.log('Les sections seront régénérées à la demande avec le nouveau format');
}

// Point d'entrée du script
resetAllSections()
  .then(() => {
    console.log('Script terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });