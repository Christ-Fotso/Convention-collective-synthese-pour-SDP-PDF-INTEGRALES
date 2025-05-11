import fs from 'fs';
import { db } from './db';
import { conventionSections } from './db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Script pour importer des sections pré-extraites dans la base de données
 * avec un traitement par lots pour améliorer les performances
 * 
 * Utilisation: npx tsx import-sections-batch.ts sections-to-import.json [batch-size] [start-index]
 * - batch-size: Nombre de sections à traiter par exécution (défaut: 500)
 * - start-index: Index de début pour le traitement (défaut: 0)
 */

interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
  sourceUrl?: string;
}

/**
 * Importe un lot de sections depuis un fichier JSON
 */
async function importSectionsBatch(filePath: string, batchSize: number, startIndex: number) {
  try {
    console.log(`Importation des sections depuis ${filePath}...`);
    console.log(`Paramètres: batchSize=${batchSize}, startIndex=${startIndex}`);
    
    // Lire le fichier JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const allSections: SectionData[] = JSON.parse(fileContent);
    
    console.log(`${allSections.length} sections trouvées dans le fichier.`);
    
    // Calculer l'index de fin
    const endIndex = Math.min(startIndex + batchSize, allSections.length);
    const sections = allSections.slice(startIndex, endIndex);
    
    console.log(`Traitement du lot ${startIndex} à ${endIndex-1} (${sections.length} sections)`);
    
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Pré-récupérer toutes les conventions disponibles
    console.log("Récupération de la liste des conventions disponibles...");
    const allConventions = await db.query.conventions.findMany({
      columns: { id: true }
    });
    const availableConventionIds = new Set(allConventions.map(c => c.id));
    console.log(`${availableConventionIds.size} conventions disponibles dans la base de données`);
    
    // Filtrer les sections dont la convention existe dans la base de données
    const validSections = sections.filter(section => availableConventionIds.has(section.conventionId));
    const missingSections = sections.filter(section => !availableConventionIds.has(section.conventionId));
    
    console.log(`${validSections.length} sections valides, ${missingSections.length} sections avec convention manquante`);
    
    skippedCount = missingSections.length;
    
    // Récupérer les sections existantes pour les sections valides
    const sectionKeys = validSections.map(s => ({ 
      conventionId: s.conventionId, 
      sectionType: s.sectionType 
    }));
    
    console.log("Récupération des sections existantes...");
    const existingSections = await Promise.all(
      sectionKeys.map(async key => {
        const sections = await db.select()
          .from(conventionSections)
          .where(
            and(
              eq(conventionSections.conventionId, key.conventionId),
              eq(conventionSections.sectionType, key.sectionType)
            )
          );
        return {
          key: `${key.conventionId}-${key.sectionType}`,
          exists: sections.length > 0
        };
      })
    );
    
    // Créer un Map pour faciliter les recherches
    const existingSectionMap = new Map();
    existingSections.forEach(section => {
      existingSectionMap.set(section.key, section.exists);
    });
    
    // Séparer les sections à insérer et à mettre à jour
    const sectionsToInsert = [];
    const sectionsToUpdate = [];
    
    for (const section of validSections) {
      const key = `${section.conventionId}-${section.sectionType}`;
      if (existingSectionMap.get(key)) {
        sectionsToUpdate.push(section);
      } else {
        sectionsToInsert.push(section);
      }
    }
    
    console.log(`${sectionsToInsert.length} sections à insérer, ${sectionsToUpdate.length} sections à mettre à jour`);
    
    // Traiter les insertions par lots
    if (sectionsToInsert.length > 0) {
      console.log("Insertion de nouvelles sections...");
      try {
        // Insérer par lots de 100
        const insertBatchSize = 100;
        for (let i = 0; i < sectionsToInsert.length; i += insertBatchSize) {
          const batch = sectionsToInsert.slice(i, i + insertBatchSize);
          const valuesToInsert = batch.map(section => ({
            id: uuidv4(),
            conventionId: section.conventionId,
            sectionType: section.sectionType,
            content: section.content,
            sourceUrl: section.sourceUrl,
            status: 'complete',
            updatedAt: new Date()
          }));
          
          await db.insert(conventionSections).values(valuesToInsert);
          importedCount += batch.length;
          console.log(`Lot ${i}-${i+batch.length-1} inséré`);
        }
      } catch (error) {
        console.error("Erreur lors de l'insertion des sections:", error);
        errorCount += sectionsToInsert.length;
      }
    }
    
    // Traiter les mises à jour une par une (les mises à jour en batch sont plus complexes)
    if (sectionsToUpdate.length > 0) {
      console.log("Mise à jour des sections existantes...");
      for (const section of sectionsToUpdate) {
        try {
          await db.update(conventionSections)
            .set({
              content: section.content,
              sourceUrl: section.sourceUrl,
              status: 'complete',
              updatedAt: new Date()
            })
            .where(
              and(
                eq(conventionSections.conventionId, section.conventionId),
                eq(conventionSections.sectionType, section.sectionType)
              )
            );
          updatedCount++;
          
          if (updatedCount % 50 === 0) {
            console.log(`${updatedCount}/${sectionsToUpdate.length} sections mises à jour`);
          }
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de la section ${section.conventionId}/${section.sectionType}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log(`
    Importation du lot terminée:
    - ${importedCount} sections importées
    - ${updatedCount} sections mises à jour
    - ${skippedCount} sections ignorées (conventions manquantes)
    - ${errorCount} erreurs
    `);
    
    // Afficher les informations sur le prochain lot
    if (endIndex < allSections.length) {
      console.log(`\nPour continuer l'importation, exécutez:`);
      console.log(`npx tsx import-sections-batch.ts ${filePath} ${batchSize} ${endIndex}`);
    } else {
      console.log("\nTous les lots ont été traités. Importation terminée!");
    }
    
  } catch (error) {
    console.error("Erreur lors de l'importation des sections:", error);
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("Usage: ts-node import-sections-batch.ts <chemin-vers-fichier.json> [taille-du-lot] [index-debut]");
    process.exit(1);
  }
  
  const filePath = args[0];
  const batchSize = args.length > 1 ? parseInt(args[1]) : 500;
  const startIndex = args.length > 2 ? parseInt(args[2]) : 0;
  
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas.`);
    process.exit(1);
  }
  
  await importSectionsBatch(filePath, batchSize, startIndex);
  process.exit(0);
}

// Exécuter le script
main();