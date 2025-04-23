import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cette fonction ajoute uniquement les conventions manquantes dans la base de données
 * par rapport au fichier JSON, sans toucher aux conventions existantes
 */
async function addMissingConventions() {
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
    
    // Obtenir toutes les conventions existantes de la base de données
    const dbConventions = await db.select().from(conventions);
    console.log(`${dbConventions.length} conventions trouvées dans la base de données`);
    
    // Trouver les conventions manquantes
    const existingIds = new Set(dbConventions.map(c => c.id));
    const missingConventions = conventionsData.filter(c => !existingIds.has(c.id));
    
    console.log(`${missingConventions.length} conventions manquantes identifiées`);
    
    // Nettoyer les conventions manquantes
    const cleanedMissingConventions = missingConventions.map(convention => ({
      id: convention.id,
      name: convention.name,
      url: convention.url.trim()
    }));
    
    // Ajouter les conventions manquantes par lots de 50
    const batchSize = 50;
    let addedCount = 0;
    
    for (let i = 0; i < cleanedMissingConventions.length; i += batchSize) {
      const batch = cleanedMissingConventions.slice(i, i + batchSize);
      
      if (batch.length > 0) {
        await db.insert(conventions).values(batch);
        addedCount += batch.length;
        console.log(`Lot ${Math.floor(i/batchSize) + 1} : ${batch.length} conventions ajoutées`);
      }
    }
    
    console.log(`Synchronisation terminée: ${addedCount} conventions ajoutées`);
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout des conventions manquantes:', error);
  }
}

// Exécution de la fonction
addMissingConventions().then(() => {
  console.log('Ajout des conventions manquantes terminé');
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});