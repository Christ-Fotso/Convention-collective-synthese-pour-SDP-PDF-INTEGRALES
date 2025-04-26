/**
 * Script utilitaire pour réinitialiser les sections extraites des conventions collectives
 * Utile pour forcer la réextraction des données ou corriger des problèmes de formatage
 */

import { db } from "../db";
import { conventionSections } from "../db/schema";
import { eq, and, or } from "drizzle-orm";

async function resetSections() {
  try {
    // Option 1: Supprimer toutes les sections spécifiques (classification, salaires...)
    console.log("Suppression des sections de classification...");
    const deletedClassifications = await db.delete(conventionSections)
      .where(
        or(
          eq(conventionSections.sectionType, 'classification'),
          eq(conventionSections.sectionType, 'classification-classification')
        )
      )
      .returning();
    
    console.log(`${deletedClassifications.length} sections de classification supprimées.`);
    
    console.log("Suppression des sections de rémunération...");
    const deletedSalaires = await db.delete(conventionSections)
      .where(
        or(
          eq(conventionSections.sectionType, 'remuneration-grille'),
          eq(conventionSections.sectionType, 'salaires')
        )
      )
      .returning();
    
    console.log(`${deletedSalaires.length} sections de rémunération supprimées.`);
    
    // Option 2: Supprimer les sections pour une convention spécifique
    const conventionId = '843'; // Exemple: convention de la Boulangerie-pâtisserie
    console.log(`Suppression des sections pour la convention ${conventionId}...`);
    const deletedConventionSections = await db.delete(conventionSections)
      .where(eq(conventionSections.conventionId, conventionId))
      .returning();
    
    console.log(`${deletedConventionSections.length} sections supprimées pour la convention ${conventionId}.`);
    
    console.log("Réinitialisation des sections terminée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des sections:", error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
resetSections();