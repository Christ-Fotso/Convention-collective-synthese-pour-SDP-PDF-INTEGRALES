/**
 * Script pour transformer toutes les sections "congés pour événements familiaux" en format tableau
 * en utilisant GPT-4o-mini avec traitement par lots de 50 appels simultanés
 */

import OpenAI from 'openai';
import { db } from './db/index.js';
import { conventionSections } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

// Configuration
const BATCH_SIZE = 50; // Nombre d'appels simultanés
const MODEL = 'gpt-4o-mini'; // Modèle économique

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt pour la transformation
const TRANSFORMATION_PROMPT = `Tu es un assistant qui transforme uniquement la présentation d'un texte en tableau Markdown.

RÈGLES STRICTES :
- Garde EXACTEMENT le même titre/en-tête sans modification
- Ne reformule RIEN du contenu existant
- Conserve tous les mots, phrases et informations à l'identique
- Change UNIQUEMENT la présentation en format tableau Markdown
- Si le texte contient des classifications, niveaux, salaires : mets-les en colonnes
- Garde la même structure logique mais en tableau

IMPORTANT : Le résultat doit commencer par exactement la même première ligne que l'original.

Texte à transformer :
`;

interface ClassificationSection {
  id: string;
  conventionId: string;
  sectionType: string;
  content: string;
}

/**
 * Récupère toutes les sections congés événements familiaux
 */
async function getAllClassificationSections(): Promise<ClassificationSection[]> {
  try {
    console.log('🔍 Récupération de toutes les sections congés événements familiaux...');
    
    const sections = await db
      .select()
      .from(conventionSections)
      .where(eq(conventionSections.sectionType, 'conges.evenement-familial'));
    
    console.log(`✅ ${sections.length} sections congés événements familiaux trouvées`);
    return sections.map(s => ({
      id: s.id,
      conventionId: s.conventionId,
      sectionType: s.sectionType,
      content: s.content
    }));
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des sections:', error);
    throw error;
  }
}

/**
 * Sauvegarde une copie de l'ancienne version
 */
async function backupSection(section: ClassificationSection): Promise<void> {
  try {
    // Créer une copie avec le suffixe _original
    await db.insert(conventionSections).values({
      conventionId: section.conventionId,
      sectionType: 'conges.evenement-familial_original',
      content: section.content,
      sourceUrl: null,
      status: 'complete'
    });
  } catch (error: any) {
    // Ignorer les erreurs de duplication si la sauvegarde existe déjà
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.error(`⚠️  Erreur lors de la sauvegarde pour ${section.conventionId}:`, error.message);
    }
  }
}

/**
 * Transforme une section avec GPT-4o-mini
 */
async function transformSection(section: ClassificationSection): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: TRANSFORMATION_PROMPT + section.content
        }
      ],
      max_tokens: 4000,
      temperature: 0.1 // Très peu de créativité, on veut juste la transformation
    });

    return response.choices[0].message.content || section.content;
  } catch (error: any) {
    console.error(`❌ Erreur transformation pour ${section.conventionId}:`, error.message);
    return section.content; // Retourner l'original en cas d'erreur
  }
}

/**
 * Met à jour la section dans la base de données
 */
async function updateSection(section: ClassificationSection, newContent: string): Promise<void> {
  try {
    await db
      .update(conventionSections)
      .set({ content: newContent })
      .where(
        and(
          eq(conventionSections.conventionId, section.conventionId),
          eq(conventionSections.sectionType, 'conges.evenement-familial')
        )
      );
  } catch (error: any) {
    console.error(`❌ Erreur mise à jour pour ${section.conventionId}:`, error);
  }
}

/**
 * Traite un lot de sections en parallèle
 */
async function processBatch(batch: ClassificationSection[]): Promise<void> {
  console.log(`🔄 Traitement d'un lot de ${batch.length} sections...`);
  
  const promises = batch.map(async (section) => {
    try {
      // 1. Transformer avec GPT-4o-mini
      const transformedContent = await transformSection(section);
      
      // 2. Mettre à jour si la transformation a réussi
      if (transformedContent !== section.content) {
        await updateSection(section, transformedContent);
        console.log(`✅ ${section.conventionId} - Transformé avec succès`);
      } else {
        console.log(`⚠️  ${section.conventionId} - Pas de changement`);
      }
      
    } catch (error: any) {
      console.error(`❌ ${section.conventionId} - Erreur:`, error.message);
    }
  });
  
  await Promise.all(promises);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage de la transformation des sections classification');
    console.log(`📊 Configuration: ${BATCH_SIZE} appels simultanés avec ${MODEL}`);
    
    // Vérifier que la clé API OpenAI est disponible
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('❌ Clé API OpenAI manquante. Définissez OPENAI_API_KEY dans l\'environnement.');
    }
    
    // 1. Récupérer toutes les sections classification
    const sections = await getAllClassificationSections();
    
    if (sections.length === 0) {
      console.log('ℹ️  Aucune section classification trouvée');
      return;
    }
    
    // 2. Traiter par lots
    const totalBatches = Math.ceil(sections.length / BATCH_SIZE);
    console.log(`📦 ${sections.length} sections à traiter en ${totalBatches} lots`);
    
    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      const batch = sections.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`\n🔢 Lot ${batchNumber}/${totalBatches}`);
      await processBatch(batch);
      
      // Petite pause entre les lots pour respecter les limites
      if (i + BATCH_SIZE < sections.length) {
        console.log('⏳ Pause de 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Transformation terminée avec succès !');
    console.log('💾 Les versions originales sont sauvegardées avec le suffixe "_original"');
    
  } catch (error: any) {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as transformClassificationsToTables };