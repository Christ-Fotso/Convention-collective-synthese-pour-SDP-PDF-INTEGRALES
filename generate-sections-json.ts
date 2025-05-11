import fs from 'fs';
import path from 'path';

/**
 * Script pour générer un fichier JSON à partir des fichiers texte des sections extraites
 * 
 * Format des fichiers attendu:
 * "[Nom convention] - [IDCC]_[Numéro]_[Type_section].md"
 * Exemple: "Bureaux d'études - 1486_03_Période_d'essai.md"
 */

interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
  sourceUrl?: string;
}

// Mapping des numéros de sections vers les catégories standard
const SECTION_TYPE_MAPPING: Record<string, string> = {
  '01': 'informations-generales.generale',
  '02': 'embauche.delai-prevenance',
  '03': 'embauche.periode-essai',
  '04': 'temps-travail.duree-travail',
  '05': 'temps-travail.amenagement-temps',
  '06': 'temps-travail.heures-sup',
  '07': 'temps-travail.temps-partiel',
  '08': 'temps-travail.forfait-jours',
  '09': 'temps-travail.travail-nuit',
  '10': 'temps-travail.astreintes',
  '11': 'temps-travail.jours-feries',
  '12': 'temps-travail.repos-hebdomadaire',
  '13': 'temps-travail.travail-dimanche',
  '14': 'conges.conges-payes',
  '15': 'conges.cet',
  '16': 'conges.evenement-familial',
  '17': 'conges.anciennete',
  '18': 'conges.conges-exceptionnels',
  '19': 'conges.jours-supplementaires',
  '20': 'conges.fractionnement',
  '21': 'conges.sans-solde',
  '22': 'conges.deces',
  '23': 'conges.enfant-malade',
  '24': 'depart.preavis',
  '25': 'depart.licenciement',
  '26': 'depart.mise-retraite',
  '27': 'depart.depart-retraite',
  '28': 'depart.rupture-conventionnelle',
  '29': 'depart.precarite',
  '30': 'classification.classification',
  '31': 'classification.grille',
  '32': 'classification.evolution',
  '33': 'classification.emplois-reperes',
  '34': 'classification.coefficients',
  '35': 'remuneration.grille',
  '36': 'remuneration.13eme-mois',
  '37': 'remuneration.anciennete',
  '38': 'remuneration.transport',
  '39': 'remuneration.repas',
  '40': 'remuneration.astreinte',
  '41': 'remuneration.prime',
  '42': 'remuneration.apprenti',
  '43': 'remuneration.contrat-pro',
  '44': 'remuneration.stagiaire',
  '45': 'remuneration.majoration-dimanche',
  '46': 'remuneration.majoration-ferie',
  '47': 'remuneration.majoration-nuit',
  '48': 'maintien-salaire.accident-travail',
  '49': 'maintien-salaire.maladie',
  '50': 'maintien-salaire.maternite-paternite',
  '51': 'cotisations.prevoyance',
  '52': 'cotisations.retraite',
  '53': 'cotisations.mutuelle',
  '54': 'cotisations.formation',
  '55': 'cotisations.paritarisme',
  '56': 'cotisations.contributions-formation',
};

// Fonction pour extraire les informations du nom de fichier
function extractFileInfo(filename: string): { conventionId: string; sectionType: string; } | null {
  try {
    // Extraire la partie après le tiret (-) qui contient l'IDCC et le numéro de section
    const parts = filename.split(' - ');
    if (parts.length < 2) return null;
    
    const idccPart = parts[1];
    
    // Format attendu: IDCC_NuméroSection_NomSection.md
    const idccMatch = idccPart.match(/(\d+)_(\d+)_(.+)\./);
    if (!idccMatch) return null;
    
    const conventionId = idccMatch[1];
    const sectionNumber = idccMatch[2];
    
    // Mapper le numéro de section vers le type de section standard
    const sectionType = SECTION_TYPE_MAPPING[sectionNumber] || `section-${sectionNumber}`;
    
    return {
      conventionId,
      sectionType
    };
  } catch (error) {
    return null;
  }
}

async function generateSectionsJson(directoryPath: string, outputPath: string) {
  try {
    console.log(`Analyse du répertoire ${directoryPath}...`);
    
    // Lire tous les fichiers du répertoire
    const files = fs.readdirSync(directoryPath);
    const sections: SectionData[] = [];
    
    // Filtrer uniquement les fichiers markdown
    const markdownFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.md';
    });
    
    console.log(`${markdownFiles.length} fichiers markdown trouvés.`);
    
    // Maps pour suivre les progressions
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Traiter chaque fichier
    for (const file of markdownFiles) {
      try {
        const fullPath = path.join(directoryPath, file);
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        
        // Extraire les informations du nom de fichier
        const fileInfo = extractFileInfo(file);
        
        if (!fileInfo) {
          console.warn(`Format de nom de fichier non reconnu: ${file}, ignoré.`);
          skippedCount++;
          continue;
        }
        
        const { conventionId, sectionType } = fileInfo;
        
        // Construire l'URL source d'ElNet (si nécessaire)
        const sourceUrl = `https://www.elnet.fr/documentation/Document?id=CCNS0${conventionId}`;
        
        // Ajouter à notre liste de sections
        sections.push({
          conventionId,
          sectionType,
          content: fileContent,
          sourceUrl
        });
        
        processedCount++;
        
        // Afficher la progression tous les 1000 fichiers
        if (processedCount % 1000 === 0) {
          console.log(`Progression: ${processedCount}/${markdownFiles.length} fichiers traités`);
        }
        
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
        errorCount++;
      }
    }
    
    console.log(`
    Traitement terminé:
    - ${processedCount} fichiers traités avec succès
    - ${skippedCount} fichiers ignorés (format non reconnu)
    - ${errorCount} erreurs
    `);
    
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