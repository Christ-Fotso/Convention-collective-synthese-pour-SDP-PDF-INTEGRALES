import fs from 'fs';
import path from 'path';
import { db } from './db';
import { conventionSections } from './db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

/**
 * Script pour importer des sections pré-extraites dans la base de données
 * 
 * Format du fichier JSON attendu:
 * [
 *   {
 *     "conventionId": "123",      // IDCC de la convention
 *     "sectionType": "category.subcategory", // Format: catégorie.sous-catégorie
 *     "content": "Contenu Markdown..." // Contenu de la section en Markdown
 *   },
 *   ...
 * ]
 */

interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
  sourceUrl?: string;
}

/**
 * Importe les sections depuis un fichier JSON
 */
async function importSectionsFromJson(filePath: string) {
  try {
    console.log(`Importation des sections depuis ${filePath}...`);
    
    // Lire le fichier JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sections: SectionData[] = JSON.parse(fileContent);
    
    console.log(`${sections.length} sections trouvées dans le fichier.`);
    
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const totalCount = sections.length;
    
    // Garder une trace des conventions manquantes
    const missingConventions = new Set<string>();
    
    // Importer chaque section
    for (const section of sections) {
      processedCount++;
      
      // Afficher la progression toutes les 500 sections
      if (processedCount % 500 === 0) {
        console.log(`Progression: ${processedCount}/${totalCount} sections traitées (${Math.round(processedCount / totalCount * 100)}%)`);
      }
      try {
        // Vérifier si la convention existe
        const conventionId = section.conventionId;
        
        // Si nous avons déjà identifié que cette convention est manquante, passer à la suivante
        if (missingConventions.has(conventionId)) {
          continue;
        }
        
        // Vérifier si la section existe déjà
        const existingSections = await db.select()
          .from(conventionSections)
          .where(
            and(
              eq(conventionSections.conventionId, conventionId),
              eq(conventionSections.sectionType, section.sectionType)
            )
          );
        
        if (existingSections.length > 0) {
          // Mettre à jour la section existante
          await db.update(conventionSections)
            .set({
              content: section.content,
              sourceUrl: section.sourceUrl,
              status: 'complete',
              updatedAt: new Date()
            })
            .where(
              and(
                eq(conventionSections.conventionId, conventionId),
                eq(conventionSections.sectionType, section.sectionType)
              )
            );
          updatedCount++;
        } else {
          try {
            // Insérer une nouvelle section
            await db.insert(conventionSections)
              .values({
                // l'id sera généré automatiquement avec defaultRandom()
                conventionId: conventionId,
                sectionType: section.sectionType,
                content: section.content,
                sourceUrl: section.sourceUrl,
                status: 'complete',
                updatedAt: new Date()
                // createdAt sera défini automatiquement avec defaultNow()
              });
            importedCount++;
          } catch (error) {
            // Si l'erreur est due à une contrainte de clé étrangère, la convention n'existe pas
            if (error.message.includes('violates foreign key constraint')) {
              // Ajouter à la liste des conventions manquantes
              missingConventions.add(conventionId);
              console.warn(`Convention ${conventionId} n'existe pas dans la base de données`);
            } else {
              // Autre erreur
              throw error;
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'importation de la section ${section.conventionId}/${section.sectionType}:`, error);
        errorCount++;
      }
    }
    
    console.log(`
    Importation terminée:
    - ${importedCount} sections importées
    - ${updatedCount} sections mises à jour
    - ${errorCount} erreurs
    - ${missingConventions.size} conventions manquantes
    `);
    
    // Afficher les conventions manquantes
    if (missingConventions.size > 0) {
      console.log("Conventions manquantes dans la base de données :");
      console.log(Array.from(missingConventions).join(", "));
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
    console.error("Usage: ts-node import-sections.ts <chemin-vers-fichier.json>");
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas.`);
    process.exit(1);
  }
  
  await importSectionsFromJson(filePath);
  process.exit(0);
}

// Exécuter le script
main();