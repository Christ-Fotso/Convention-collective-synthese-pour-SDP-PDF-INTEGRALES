import { db } from "./db";
import { getConventionText } from "./server/services/openai";
import { conventions } from "./db/schema";
import { eq } from "drizzle-orm";

// Script pour tester la récupération de texte de convention avec notre stratégie à 3 niveaux

async function testConventionTextStrategy() {
  try {
    // Choisir une convention qui a une version pré-convertie (1486 d'après le test précédent)
    const conventionId = "1486";
    
    console.log(`Test de récupération du texte pour la convention ${conventionId}`);
    
    // D'abord, récupérer l'URL de la convention
    const convention = await db.select().from(conventions)
      .where(eq(conventions.id, conventionId))
      .limit(1);
    
    if (convention.length === 0) {
      console.error(`Convention ${conventionId} non trouvée dans la base de données`);
      return;
    }
    
    console.log(`Convention trouvée: ${convention[0].name}`);
    
    // Premier appel - devrait récupérer depuis la base de données et mettre en cache
    console.log("\n=== PREMIER APPEL (devrait utiliser la base de données) ===");
    const startTime1 = Date.now();
    const text1 = await getConventionText(conventionId, convention[0].url, "test", "test");
    const elapsedTime1 = Date.now() - startTime1;
    
    console.log(`Longueur du texte: ${text1.length} caractères`);
    console.log(`Temps d'exécution: ${elapsedTime1}ms`);
    console.log(`Début du texte: ${text1.substring(0, 200)}...`);
    
    // Deuxième appel - devrait utiliser le cache mémoire (plus rapide)
    console.log("\n=== DEUXIÈME APPEL (devrait utiliser le cache mémoire) ===");
    const startTime2 = Date.now();
    const text2 = await getConventionText(conventionId, convention[0].url, "test", "test");
    const elapsedTime2 = Date.now() - startTime2;
    
    console.log(`Longueur du texte: ${text2.length} caractères`);
    console.log(`Temps d'exécution: ${elapsedTime2}ms`);
    
    // Test avec une convention sans version pré-convertie, par exemple la convention 16
    const nonConvertedId = "16";
    
    // Récupérer l'URL de la convention
    const nonConvertedConvention = await db.select().from(conventions)
      .where(eq(conventions.id, nonConvertedId))
      .limit(1);
    
    if (nonConvertedConvention.length === 0) {
      console.error(`Convention ${nonConvertedId} non trouvée dans la base de données`);
      return;
    }
    
    console.log(`\n=== TEST AVEC CONVENTION NON PRÉ-CONVERTIE: ${nonConvertedId} ===`);
    console.log(`Convention trouvée: ${nonConvertedConvention[0].name}`);
    
    // Cet appel devrait extraire le texte du PDF à la volée (plus lent)
    const startTime3 = Date.now();
    const text3 = await getConventionText(nonConvertedId, nonConvertedConvention[0].url, "test", "test");
    const elapsedTime3 = Date.now() - startTime3;
    
    console.log(`Longueur du texte: ${text3.length} caractères`);
    console.log(`Temps d'exécution: ${elapsedTime3}ms`);
    console.log(`Début du texte: ${text3.substring(0, 200)}...`);
    
    // Résumé
    console.log("\n=== RÉSUMÉ ===");
    console.log(`Premier appel (base de données): ${elapsedTime1}ms`);
    console.log(`Deuxième appel (cache mémoire): ${elapsedTime2}ms`);
    console.log(`Convention non pré-convertie (PDF): ${elapsedTime3}ms`);
    console.log(`Accélération avec le cache mémoire: ${(elapsedTime1 / elapsedTime2).toFixed(2)}x`);
    console.log(`Accélération avec la pré-conversion: ${(elapsedTime3 / elapsedTime1).toFixed(2)}x`);
    
  } catch (error) {
    console.error("Erreur lors du test:", error);
  }
}

// Exécuter la fonction puis terminer le script
testConventionTextStrategy().then(() => {
  console.log("\nTest terminé");
  process.exit(0);
}).catch(error => {
  console.error("\nErreur:", error);
  process.exit(1);
});