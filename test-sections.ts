import { db } from "./db";
import { conventionSections } from "./db/schema";
import { eq } from "drizzle-orm";
import { SECTION_TYPES } from "./server/services/section-manager";

// Script pour lister les sections pré-converties en Markdown

async function checkConvertedSections() {
  try {
    // Récupérer toutes les sections de type full-text
    console.log(`Recherche de sections de type: ${SECTION_TYPES.FULL_TEXT}`);
    const sections = await db.select().from(conventionSections)
      .where(eq(conventionSections.sectionType, SECTION_TYPES.FULL_TEXT));
    
    console.log(`${sections.length} sections pré-converties (full-text) trouvées:`);
    
    if (sections.length === 0) {
      console.log("Aucune section pré-convertie trouvée. Exécutez le script convert-conventions-to-markdown.ts pour en créer.");
    } else {
      // Afficher un résumé des sections trouvées
      for (const section of sections) {
        console.log(`- Convention ${section.conventionId}: ${section.status}, taille: ${section.content.length} caractères`);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des sections:", error);
  }
}

// Exécuter la fonction puis terminer le script
checkConvertedSections().then(() => {
  console.log("Vérification terminée");
  process.exit(0);
}).catch(error => {
  console.error("Erreur:", error);
  process.exit(1);
});