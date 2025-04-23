import { db } from "./db";
import { conventions } from "./db/schema";
import { createExtractionTask, updateExtractionTask, SECTION_TYPES } from "./server/services/section-manager";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

/**
 * Script pour le traitement par lots des conventions collectives
 * 
 * Ce script peut être exécuté régulièrement pour :
 * 1. Convertir un lot de conventions en Markdown (pré-conversion)
 * 2. Générer à l'avance les sections les plus demandées
 */
async function batchProcessConventions() {
  try {
    console.log("=== DÉMARRAGE DU TRAITEMENT PAR LOTS DES CONVENTIONS ===");
    console.log("Date:", new Date().toISOString());
    
    // Nombre de conventions à traiter par lot
    const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10");
    console.log(`Taille du lot: ${BATCH_SIZE} conventions`);
    
    // 1. Trouver les conventions qui n'ont pas encore de version Markdown pré-convertie
    console.log("Recherche des conventions sans version Markdown...");
    
    // Exécuter une commande qui permet de compter les conventions pré-converties
    const { stdout } = await execAsync(`npx tsx test-sections.ts | grep "sections pré-converties" | awk '{print $1}'`);
    const preConvertedCount = parseInt(stdout.trim()) || 0;
    
    // Récupérer toutes les conventions de la base de données
    const allConventions = await db.select({
      id: conventions.id,
      name: conventions.name,
      url: conventions.url
    }).from(conventions);
    
    // Calculer combien il en reste à traiter
    const remainingCount = allConventions.length - preConvertedCount;
    console.log(`${preConvertedCount} conventions déjà pré-converties sur ${allConventions.length}`);
    console.log(`${remainingCount} conventions restantes à traiter`);
    
    if (remainingCount === 0) {
      console.log("Toutes les conventions sont déjà pré-converties. Aucune action nécessaire.");
      return;
    }
    
    // On va utiliser un identifiant de convention réel pour éviter les problèmes de clé étrangère
    // Récupérer la première convention qui n'a pas encore été convertie
    const conventionsToConvert = allConventions.filter(conv => {
      // Si on a déjà converti preConvertedCount conventions, on doit regarder celles qui restent
      const conventionIndex = allConventions.findIndex(c => c.id === conv.id);
      return conventionIndex >= preConvertedCount;
    });
    
    if (conventionsToConvert.length === 0) {
      console.log("Aucune convention à convertir n'a été trouvée");
      return;
    }
    
    // Utiliser l'ID de la première convention à convertir pour créer la tâche
    const targetConventionId = conventionsToConvert[0].id;
    console.log(`Utilisation de la convention ${targetConventionId} comme référence pour la tâche par lots`);
    
    // Créer une tâche d'extraction pour suivre le traitement par lots
    const batchTask = await createExtractionTask({
      conventionId: targetConventionId,
      sectionTypes: [SECTION_TYPES.FULL_TEXT],
      status: "processing",
      progress: 0,
      completedSections: [],
      errorSections: []
    });
    
    if (!batchTask || !batchTask.id) {
      throw new Error("Impossible de créer la tâche d'extraction par lots");
    }
    
    // 2. Exécuter le script de conversion pour un lot spécifique
    const batchSize = Math.min(BATCH_SIZE, remainingCount);
    console.log(`Lancement de la conversion pour ${batchSize} conventions...`);
    
    try {
      // Exécuter le script de conversion avec les variables d'environnement appropriées
      const command = `TEST_MODE=true MAX_CONVENTIONS=${batchSize} npx tsx server/convert-conventions-to-markdown.ts`;
      
      console.log(`Exécution de la commande: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error("Erreurs lors de l'exécution:", stderr);
      }
      
      console.log("Résultat du traitement:");
      console.log(stdout);
      
      // Mettre à jour la tâche d'extraction comme terminée
      await updateExtractionTask(batchTask.id, {
        status: "complete",
        progress: 100
      });
      
      console.log("Traitement par lots terminé avec succès");
    } catch (execError) {
      console.error("Erreur lors de l'exécution du script de conversion:", execError);
      
      // Mettre à jour la tâche d'extraction avec l'erreur
      await updateExtractionTask(batchTask.id, {
        status: "error",
        errorSections: [{
          section: SECTION_TYPES.FULL_TEXT,
          error: execError.message || "Erreur inconnue"
        }]
      });
    }
  } catch (error) {
    console.error("Erreur lors du traitement par lots des conventions:", error);
  }
}

// Exécuter la fonction principale
batchProcessConventions().then(() => {
  console.log("Fin du traitement par lots");
  process.exit(0);
}).catch(error => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});