import fs from 'fs';
import path from 'path';

/**
 * Script pour générer un fichier JSON à partir des fichiers texte des sections extraites
 * 
 * Convention de nommage des fichiers attendue:
 * [IDCC]_[Section]_[Sous-section].txt ou [IDCC]_[Section]_[Sous-section].md
 * 
 * Exemple: 1486_embauche_periode-essai.txt
 */

interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
}

async function generateSectionsJson(directoryPath: string, outputPath: string) {
  try {
    console.log(`Analyse du répertoire ${directoryPath}...`);
    
    // Lire tous les fichiers du répertoire
    const files = fs.readdirSync(directoryPath);
    const sections: SectionData[] = [];
    
    // Filtrer uniquement les fichiers texte et markdown
    const textFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.txt' || ext === '.md';
    });
    
    console.log(`${textFiles.length} fichiers texte/markdown trouvés.`);
    
    // Traiter chaque fichier
    for (const file of textFiles) {
      try {
        const fullPath = path.join(directoryPath, file);
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        
        // Extraire les informations du nom de fichier
        let filename = path.basename(file, path.extname(file));
        
        // Gérer différents formats de nommage
        let conventionId = '';
        let sectionType = '';
        
        // Format: [IDCC]_[SECTION]_[SOUS-SECTION]
        const filenameParts = filename.split('_');
        if (filenameParts.length >= 3) {
          conventionId = filenameParts[0];
          
          // Regrouper les parties du nom de section
          const section = filenameParts[1];
          const subsection = filenameParts.slice(2).join('_');
          
          sectionType = `${section}.${subsection}`;
        } 
        // Format alternatif: [IDCC]_[SECTION].[SOUS-SECTION]
        else if (filenameParts.length === 2 && filenameParts[1].includes('.')) {
          conventionId = filenameParts[0];
          sectionType = filenameParts[1];
        }
        else {
          console.warn(`Format de nom de fichier non reconnu: ${file}, ignoré.`);
          continue;
        }
        
        // Ajouter à notre liste de sections
        sections.push({
          conventionId,
          sectionType,
          content: fileContent
        });
        
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
      }
    }
    
    // Écrire le fichier JSON
    fs.writeFileSync(
      outputPath,
      JSON.stringify(sections, null, 2),
      'utf-8'
    );
    
    console.log(`${sections.length} sections ont été écrites dans ${outputPath}`);
    
  } catch (error) {
    console.error("Erreur lors de la génération du fichier JSON:", error);
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: ts-node generate-sections-json.ts <répertoire-des-sections> <fichier-json-output>");
    process.exit(1);
  }
  
  const directoryPath = args[0];
  const outputPath = args[1];
  
  if (!fs.existsSync(directoryPath)) {
    console.error(`Le répertoire ${directoryPath} n'existe pas.`);
    process.exit(1);
  }
  
  await generateSectionsJson(directoryPath, outputPath);
  process.exit(0);
}

// Exécuter le script
main();