import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cette fonction synchronise les URLs des conventions collectives entre
 * le fichier JSON et la base de données pour assurer la cohérence.
 */
async function syncConventionUrls() {
  try {
    // Chemin vers le fichier JSON des conventions
    const filePath = path.join(__dirname, '..', 'data', 'conventions.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('Fichier conventions.json non trouvé');
      return;
    }
    
    // Lecture du fichier JSON
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const conventionsData = JSON.parse(fileContent);
    
    if (!Array.isArray(conventionsData)) {
      console.error('Format JSON invalide, tableau attendu');
      return;
    }
    
    console.log(`Lecture de ${conventionsData.length} conventions depuis le fichier JSON`);
    
    // Obtenir toutes les conventions de la base de données
    const dbConventions = await db.select().from(conventions);
    console.log(`${dbConventions.length} conventions trouvées dans la base de données`);
    
    // Nombre de mise à jour compteur
    let updatedCount = 0;
    let missingCount = 0;
    
    // Boucle de synchronisation
    for (const jsonConvention of conventionsData) {
      try {
        // Nettoyage de l'URL pour enlever les espaces éventuels
        const cleanUrl = jsonConvention.url.trim();
        
        // Vérifier si la convention existe dans la base de données
        const dbConvention = dbConventions.find(c => c.id === jsonConvention.id);
        
        if (dbConvention) {
          // Si l'URL dans la base de données est différente de celle du JSON, mise à jour
          if (dbConvention.url !== cleanUrl) {
            await db.update(conventions)
              .set({ url: cleanUrl })
              .where(eq(conventions.id, jsonConvention.id));
            
            console.log(`Convention ${jsonConvention.id} (${jsonConvention.name}) mise à jour:`);
            console.log(`  Ancienne URL: ${dbConvention.url}`);
            console.log(`  Nouvelle URL: ${cleanUrl}`);
            updatedCount++;
          }
        } else {
          // Si la convention n'existe pas dans la base de données, l'ajouter
          console.log(`Convention ${jsonConvention.id} (${jsonConvention.name}) non trouvée dans la base, ajout en cours...`);
          await db.insert(conventions).values({
            id: jsonConvention.id,
            name: jsonConvention.name,
            url: cleanUrl
          });
          missingCount++;
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de la convention ${jsonConvention.id}:`, error);
      }
    }
    
    console.log(`Synchronisation terminée:`);
    console.log(`- ${updatedCount} conventions mises à jour`);
    console.log(`- ${missingCount} conventions ajoutées`);
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation des conventions:', error);
  }
}

// Exécution de la fonction
syncConventionUrls().then(() => {
  console.log('Synchronisation des URLs terminée');
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});