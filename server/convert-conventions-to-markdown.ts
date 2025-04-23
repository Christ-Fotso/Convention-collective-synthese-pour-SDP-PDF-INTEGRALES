import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from "../db";
import { conventions, conventionSections } from "../db/schema";
import { eq, and, sql } from 'drizzle-orm';
import { extractTextFromURL } from './services/pdf-extractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dossiers pour stocker les fichiers
const MARKDOWN_DIR = path.join(process.cwd(), 'temp', 'markdown');
const PDF_DIR = path.join(process.cwd(), 'temp', 'pdf');

// Assurer que les dossiers existent
if (!fs.existsSync(MARKDOWN_DIR)) {
  fs.mkdirSync(MARKDOWN_DIR, { recursive: true });
}
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Convertit un texte brut en Markdown simple
 */
function convertTextToMarkdown(text: string): string {
  // Reconnaissance des titres (texte en majuscules sur une ligne seule)
  let markdown = text.replace(/^([A-Z][A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ0-9 \-'".,;:!?)(]+)$/gm, '## $1');
  
  // Conserver les paragraphes
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  // Reconnaissance des listes à puces
  markdown = markdown.replace(/^[-•]\s+(.+)$/gm, '* $1');
  
  // Reconnaissance des listes numérotées
  markdown = markdown.replace(/^(\d+[).:])\s+(.+)$/gm, '1. $2');
  
  // Mettre en gras les points importants (termes juridiques courants)
  const importantTerms = [
    "Article", "Convention collective", "Accord", "Avenant", 
    "Contrat de travail", "Licenciement", "Préavis", "Indemnité",
    "Congés payés", "Durée du travail", "Salaire", "Rémunération",
    "Prime", "Qualification", "Classification", "Grille"
  ];
  
  importantTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    markdown = markdown.replace(regex, '**$&**');
  });
  
  return markdown;
}

/**
 * Convertit tous les PDFs de conventions en Markdown et les stocke dans la base de données
 */
async function convertConventionsToMarkdown() {
  try {
    // Récupérer toutes les conventions 
    const allConventions = await db.select().from(conventions);
    
    // Trier les conventions par source (préférer les URLs Elnet car plus stables)
    // 1. Les conventions avec URLs Elnet
    const elnetConventions = allConventions.filter(conv => conv.url.includes('elnet.fr'));
    // 2. Les conventions avec d'autres URLs
    const otherConventions = allConventions.filter(conv => !conv.url.includes('elnet.fr'));
    
    console.log(`${elnetConventions.length} conventions Elnet trouvées sur ${allConventions.length} conventions au total`);
    console.log(`${otherConventions.length} conventions avec d'autres URLs (potentiellement instables)`);
    
    // Option de test pour limiter le nombre de conventions à traiter
    const TEST_MODE = false; // Définir à true pour tester avec quelques conventions seulement
    const MAX_CONVENTIONS = 10;
    
    // Traiter en priorité les conventions Elnet, puis les autres
    const conventionsToProcess = TEST_MODE 
      ? elnetConventions.slice(0, MAX_CONVENTIONS) 
      : [...elnetConventions, ...otherConventions];
    console.log(`Mode test: ${TEST_MODE ? 'activé (limité à ' + MAX_CONVENTIONS + ' conventions)' : 'désactivé'}`);
    
    // Traiter chaque convention
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < conventionsToProcess.length; i++) {
      const convention = conventionsToProcess[i];
      const conventionId = convention.id;
      const conventionName = convention.name;
      const url = convention.url;
      
      console.log(`[${i+1}/${conventionsToProcess.length}] Traitement de la convention ${conventionId} (${conventionName})`);
      
      try {
        // Chemin du fichier Markdown
        const markdownFilePath = path.join(MARKDOWN_DIR, `convention_${conventionId}.md`);
        
        // Vérifier si le fichier Markdown existe déjà
        if (fs.existsSync(markdownFilePath)) {
          console.log(`Markdown déjà existant pour la convention ${conventionId}`);
          const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
          
          // Enregistrer dans la base de données si ce n'est pas déjà fait
          await saveConventionSection(conventionId, 'full-text', markdownContent);
          successCount++;
          continue;
        }
        
        // Extraire le texte du PDF
        console.log(`Extraction du texte depuis ${url}`);
        const fullText = await extractTextFromURL(url, conventionId);
        
        // Convertir en Markdown
        console.log(`Conversion en Markdown pour la convention ${conventionId}`);
        const markdown = convertTextToMarkdown(fullText);
        
        // Sauvegarder dans un fichier
        fs.writeFileSync(markdownFilePath, markdown);
        console.log(`Markdown sauvegardé dans ${markdownFilePath}`);
        
        // Sauvegarder dans la base de données
        await saveConventionSection(conventionId, 'full-text', markdown);
        
        console.log(`Convention ${conventionId} traitée avec succès`);
        successCount++;
      } catch (error: any) {
        console.error(`Erreur lors du traitement de la convention ${conventionId}:`, error);
        errorCount++;
      }
      
      // Pause pour éviter de surcharger le serveur
      if (i % 5 === 4) {
        console.log('Pause de 2 secondes pour éviter de surcharger le serveur...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\nTraitement terminé:`);
    console.log(`- ${successCount} conventions traitées avec succès`);
    console.log(`- ${errorCount} conventions en erreur`);
    
  } catch (error) {
    console.error('Erreur lors de la conversion des conventions:', error);
  }
}

/**
 * Enregistre ou met à jour une section de convention
 */
async function saveConventionSection(conventionId: string, sectionType: string, content: string): Promise<void> {
  try {
    console.log(`Début enregistrement section ${sectionType} pour convention ${conventionId}`);
    
    // Vérifier si la section existe déjà
    const existingSection = await db.select()
      .from(conventionSections)
      .where(and(
        eq(conventionSections.conventionId, conventionId),
        eq(conventionSections.sectionType, sectionType)
      ));
    
    console.log(`Vérification existence: ${existingSection.length > 0 ? 'section existante' : 'nouvelle section'}`);
    
    if (existingSection.length > 0) {
      // Mettre à jour la section existante
      try {
        await db.update(conventionSections)
          .set({
            content,
            status: 'complete',
            updatedAt: new Date()
          })
          .where(and(
            eq(conventionSections.conventionId, conventionId),
            eq(conventionSections.sectionType, sectionType)
          ));
        
        console.log(`Section ${sectionType} mise à jour pour la convention ${conventionId}`);
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        throw updateError;
      }
    } else {
      // Créer une nouvelle section
      try {
        // Générer un UUID v4 manuellement pour contourner le problème
        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();
        
        await db.insert(conventionSections).values({
          id,
          conventionId,
          sectionType,
          content,
          status: 'complete',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Section ${sectionType} créée pour la convention ${conventionId}`);
      } catch (insertError) {
        console.error('Erreur lors de l\'insertion:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement de la section ${sectionType} pour la convention ${conventionId}:`, error);
    throw error;
  }
}

// Exécution de la fonction principale
convertConventionsToMarkdown().then(() => {
  console.log('Conversion des conventions en Markdown terminée');
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});