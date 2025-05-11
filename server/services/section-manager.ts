import { db } from "../../db";
import { conventionSections, apiMetrics, extractionTasks } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { log } from "../vite";
import { v4 as uuidv4 } from "uuid";

// Constantes pour les types de sections supportées
export const SECTION_TYPES = {
  // Texte complet pré-converti
  FULL_TEXT: 'full-text',
  
  // Classifications
  CLASSIFICATION: 'classification.classification',
  CLASSIFICATION_GRILLE: 'classification.grille',
  CLASSIFICATION_EVOLUTION: 'classification.evolution',
  CLASSIFICATION_EMPLOIS_REPERES: 'classification.emplois-reperes',
  CLASSIFICATION_COEFFICIENTS: 'classification.coefficients',
  
  // Rémunérations
  REMUNERATION_GRILLE: 'remuneration.grille',
  REMUNERATION_13EME_MOIS: 'remuneration.13eme-mois',
  REMUNERATION_ANCIENNETE: 'remuneration.anciennete',
  REMUNERATION_TRANSPORT: 'remuneration.transport',
  REMUNERATION_REPAS: 'remuneration.repas',
  REMUNERATION_ASTREINTE: 'remuneration.astreinte',
  REMUNERATION_PRIME: 'remuneration.prime',
  REMUNERATION_APPRENTI: 'remuneration.apprenti',
  REMUNERATION_CONTRAT_PRO: 'remuneration.contrat-pro',
  REMUNERATION_STAGIAIRE: 'remuneration.stagiaire',
  REMUNERATION_MAJORATION_DIMANCHE: 'remuneration.majoration-dimanche',
  REMUNERATION_MAJORATION_FERIE: 'remuneration.majoration-ferie',
  REMUNERATION_MAJORATION_NUIT: 'remuneration.majoration-nuit',
  
  // Temps de travail
  TEMPS_TRAVAIL: 'temps-travail.duree-travail',
  TEMPS_TRAVAIL_AMENAGEMENT: 'temps-travail.amenagement-temps',
  TEMPS_TRAVAIL_HEURES_SUP: 'temps-travail.heures-sup',
  TEMPS_TRAVAIL_TEMPS_PARTIEL: 'temps-travail.temps-partiel',
  TEMPS_TRAVAIL_FORFAIT_JOURS: 'temps-travail.forfait-jours',
  TEMPS_TRAVAIL_NUIT: 'temps-travail.travail-nuit',
  TEMPS_TRAVAIL_ASTREINTES: 'temps-travail.astreintes',
  TEMPS_TRAVAIL_FERIES: 'temps-travail.jours-feries',
  TEMPS_TRAVAIL_REPOS: 'temps-travail.repos-hebdomadaire',
  TEMPS_TRAVAIL_DIMANCHE: 'temps-travail.travail-dimanche',
  
  // Congés
  CONGES: 'conges.conges-payes',
  CONGES_CET: 'conges.cet',
  CONGES_EVENEMENT_FAMILIAL: 'conges.evenement-familial',
  CONGES_ANCIENNETE: 'conges.anciennete',
  CONGES_EXCEPTIONNELS: 'conges.conges-exceptionnels',
  CONGES_SUPPLEMENTAIRES: 'conges.jours-supplementaires',
  CONGES_FRACTIONNEMENT: 'conges.fractionnement',
  CONGES_SANS_SOLDE: 'conges.sans-solde',
  CONGES_DECES: 'conges.deces',
  CONGES_ENFANT_MALADE: 'conges.enfant-malade',
  
  // Départ
  DEPART_PREAVIS: 'depart.preavis',
  DEPART_LICENCIEMENT: 'depart.licenciement',
  DEPART_MISE_RETRAITE: 'depart.mise-retraite',
  DEPART_RETRAITE: 'depart.depart-retraite',
  DEPART_RUPTURE_CONVENTIONNELLE: 'depart.rupture-conventionnelle',
  DEPART_PRECARITE: 'depart.precarite',
  
  // Embauche
  EMBAUCHE: 'embauche.periode-essai',
  EMBAUCHE_DELAI_PREVENANCE: 'embauche.delai-prevenance',
  
  // Informations générales
  INFORMATIONS_GENERALES: 'informations-generales.generale',
  
  // Cotisations
  COTISATIONS_PREVOYANCE: 'cotisations.prevoyance',
  COTISATIONS_RETRAITE: 'cotisations.retraite',
  COTISATIONS_MUTUELLE: 'cotisations.mutuelle',
  COTISATIONS_FORMATION: 'cotisations.formation',
  COTISATIONS_PARITARISME: 'cotisations.paritarisme',
  
  // Maintien de salaire
  MAINTIEN_SALAIRE_ACCIDENT: 'maintien-salaire.accident-travail',
  MAINTIEN_SALAIRE_MALADIE: 'maintien-salaire.maladie',
  MAINTIEN_SALAIRE_MATERNITE: 'maintien-salaire.maternite-paternite',
};

// Interface pour les sections de convention
export interface ConventionSection {
  id?: string;
  conventionId: string;
  sectionType: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour les métriques API
export interface ApiMetric {
  apiName: string;
  endpoint: string;
  conventionId?: string;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCost?: number;
  success: boolean;
  errorMessage?: string;
}

// Interface pour les tâches d'extraction
export interface ExtractionTask {
  id?: string;
  conventionId: string;
  sectionTypes: string[];
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress?: number;
  completedSections?: string[];
  errorSections?: Array<{section: string, error: string}>;
}

/**
 * Récupère une section spécifique d'une convention
 */
// Fonction utilitaire pour convertir les résultats de la base de données vers notre type ConventionSection
function convertToConventionSection(dbSection: any): ConventionSection {
  return {
    id: dbSection.id,
    conventionId: dbSection.conventionId,
    sectionType: dbSection.sectionType,
    content: dbSection.content,
    status: dbSection.status as 'pending' | 'complete' | 'error',
    errorMessage: dbSection.errorMessage || undefined,
    createdAt: dbSection.createdAt,
    updatedAt: dbSection.updatedAt
  };
}

// Fonction utilitaire pour convertir les résultats de la base de données vers notre type ExtractionTask
function convertToExtractionTask(dbTask: any): ExtractionTask {
  return {
    id: dbTask.id,
    conventionId: dbTask.conventionId,
    sectionTypes: dbTask.sectionTypes,
    status: dbTask.status as 'pending' | 'processing' | 'complete' | 'error',
    progress: dbTask.progress || undefined,
    completedSections: dbTask.completedSections || undefined,
    errorSections: dbTask.errorSections || undefined
    // Nous ne stockons pas createdAt et updatedAt dans le type ExtractionTask
  };
}

export async function getConventionSection(conventionId: string, sectionType: string): Promise<ConventionSection | null> {
  try {
    const sections = await db.select().from(conventionSections)
      .where(
        and(
          eq(conventionSections.conventionId, conventionId),
          eq(conventionSections.sectionType, sectionType)
        )
      );
    
    return sections.length > 0 ? convertToConventionSection(sections[0]) : null;
  } catch (error) {
    log(`Erreur lors de la récupération de la section ${sectionType} pour la convention ${conventionId}: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Récupère toutes les sections d'une convention
 */
export async function getAllConventionSections(conventionId: string): Promise<ConventionSection[]> {
  try {
    const sections = await db.select().from(conventionSections)
      .where(eq(conventionSections.conventionId, conventionId));
    
    return sections.map(section => convertToConventionSection(section));
  } catch (error) {
    log(`Erreur lors de la récupération des sections pour la convention ${conventionId}: ${error}`, "section-manager");
    return [];
  }
}

/**
 * Sauvegarde ou met à jour une section de convention
 */
export async function saveConventionSection(section: ConventionSection): Promise<ConventionSection | null> {
  try {
    // Vérifier si la section existe déjà
    const existingSection = await getConventionSection(section.conventionId, section.sectionType);
    
    if (existingSection) {
      // Mise à jour
      const updated = await db.update(conventionSections)
        .set({
          content: section.content,
          status: section.status,
          errorMessage: section.errorMessage,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(conventionSections.conventionId, section.conventionId),
            eq(conventionSections.sectionType, section.sectionType)
          )
        )
        .returning();
      
      return updated.length > 0 ? convertToConventionSection(updated[0]) : null;
    } else {
      // Insertion
      const inserted = await db.insert(conventionSections)
        .values({
          id: uuidv4(),
          conventionId: section.conventionId,
          sectionType: section.sectionType,
          content: section.content,
          status: section.status,
          errorMessage: section.errorMessage,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return inserted.length > 0 ? convertToConventionSection(inserted[0]) : null;
    }
  } catch (error) {
    log(`Erreur lors de la sauvegarde de la section ${section.sectionType} pour la convention ${section.conventionId}: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Enregistre une métrique d'utilisation API
 */
export async function saveApiMetric(metric: ApiMetric): Promise<void> {
  try {
    await db.insert(apiMetrics)
      .values({
        id: uuidv4(),
        apiName: metric.apiName,
        endpoint: metric.endpoint,
        conventionId: metric.conventionId,
        tokensIn: metric.tokensIn || 0,
        tokensOut: metric.tokensOut || 0,
        estimatedCost: metric.estimatedCost || 0,
        success: metric.success,
        errorMessage: metric.errorMessage,
        createdAt: new Date()
      });
  } catch (error) {
    log(`Erreur lors de l'enregistrement des métriques API: ${error}`, "section-manager");
  }
}

/**
 * Récupère des statistiques sur l'utilisation de l'API
 */
export async function getApiMetrics(conventionId?: string) {
  try {
    // TODO: Implement API metrics aggregation
    return {
      totalRequests: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCost: 0,
      successRate: 100,
    };
  } catch (error) {
    log(`Erreur lors de la récupération des métriques API: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Crée une nouvelle tâche d'extraction
 */
export async function createExtractionTask(task: ExtractionTask): Promise<ExtractionTask | null> {
  try {
    const inserted = await db.insert(extractionTasks)
      .values({
        id: uuidv4(),
        conventionId: task.conventionId,
        sectionTypes: task.sectionTypes,
        status: task.status,
        progress: task.progress || 0,
        completedSections: task.completedSections || [],
        errorSections: task.errorSections || [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return inserted.length > 0 ? convertToExtractionTask(inserted[0]) : null;
  } catch (error) {
    log(`Erreur lors de la création d'une tâche d'extraction: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Met à jour le statut d'une tâche d'extraction
 */
export async function updateExtractionTask(taskId: string, updates: Partial<ExtractionTask>): Promise<ExtractionTask | null> {
  try {
    const updated = await db.update(extractionTasks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(extractionTasks.id, taskId))
      .returning();
    
    return updated.length > 0 ? convertToExtractionTask(updated[0]) : null;
  } catch (error) {
    log(`Erreur lors de la mise à jour de la tâche d'extraction ${taskId}: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Récupère une tâche d'extraction par son ID
 */
export async function getExtractionTask(taskId: string): Promise<ExtractionTask | null> {
  try {
    const tasks = await db.select().from(extractionTasks)
      .where(eq(extractionTasks.id, taskId));
    
    return tasks.length > 0 ? convertToExtractionTask(tasks[0]) : null;
  } catch (error) {
    log(`Erreur lors de la récupération de la tâche d'extraction ${taskId}: ${error}`, "section-manager");
    return null;
  }
}

/**
 * Récupère toutes les tâches d'extraction pour une convention
 */
export async function getExtractionTasksByConvention(conventionId: string): Promise<ExtractionTask[]> {
  try {
    const tasks = await db.select().from(extractionTasks)
      .where(eq(extractionTasks.conventionId, conventionId));
    
    return tasks.map(task => convertToExtractionTask(task));
  } catch (error) {
    log(`Erreur lors de la récupération des tâches d'extraction pour la convention ${conventionId}: ${error}`, "section-manager");
    return [];
  }
}

/**
 * Récupère toutes les tâches d'extraction
 */
export async function getAllExtractionTasks(): Promise<ExtractionTask[]> {
  try {
    const tasks = await db.select().from(extractionTasks);
    return tasks.map(task => convertToExtractionTask(task));
  } catch (error) {
    log(`Erreur lors de la récupération des tâches d'extraction: ${error}`, "section-manager");
    return [];
  }
}