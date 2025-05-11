/**
 * Service de fourniture des sections préextraites via JSON
 * 
 * Ce service remplace l'accès à la base de données pour les sections
 * en lisant directement depuis un fichier JSON statique
 */

import fs from 'fs';
import path from 'path';

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
  sourceUrl?: string;
}

// Variable pour stocker les sections en mémoire
let sectionsCache: Record<string, Record<string, ConventionSection>> = {};
let initialized = false;

/**
 * Initialise le cache des sections depuis le fichier JSON
 */
export async function initSectionsFromJson(): Promise<void> {
  try {
    // Charger le fichier JSON
    const filePath = path.join(process.cwd(), 'sections-data.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Le fichier de sections ${filePath} n'existe pas. Le cache de sections est vide.`);
      sectionsCache = {};
      initialized = true;
      return;
    }
    
    const data = await fs.promises.readFile(filePath, 'utf8');
    const sections = JSON.parse(data) as ConventionSection[];
    
    // Organiser les sections par convention et type pour un accès rapide
    sectionsCache = {};
    
    for (const section of sections) {
      if (!sectionsCache[section.conventionId]) {
        sectionsCache[section.conventionId] = {};
      }
      
      sectionsCache[section.conventionId][section.sectionType] = section;
    }
    
    console.log(`Cache de sections initialisé avec ${sections.length} sections.`);
    initialized = true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des sections depuis JSON:', error);
    // En cas d'erreur, on initialise un cache vide
    sectionsCache = {};
    initialized = true;
  }
}

/**
 * Récupère une section spécifique d'une convention
 */
export async function getConventionSection(conventionId: string, sectionType: string): Promise<ConventionSection | null> {
  // S'assurer que l'initialisation a été faite
  if (!initialized) {
    await initSectionsFromJson();
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[conventionId]) {
    return null;
  }
  
  // Vérifier si la section existe
  if (!sectionsCache[conventionId][sectionType]) {
    return null;
  }
  
  return sectionsCache[conventionId][sectionType];
}

/**
 * Récupère toutes les sections d'une convention
 */
export async function getAllConventionSections(conventionId: string): Promise<ConventionSection[]> {
  // S'assurer que l'initialisation a été faite
  if (!initialized) {
    await initSectionsFromJson();
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[conventionId]) {
    return [];
  }
  
  // Convertir l'objet en tableau
  return Object.values(sectionsCache[conventionId]);
}

/**
 * Récupère la liste des types de sections disponibles pour une convention
 */
export async function getAvailableSectionTypes(conventionId: string): Promise<string[]> {
  // S'assurer que l'initialisation a été faite
  if (!initialized) {
    await initSectionsFromJson();
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[conventionId]) {
    return [];
  }
  
  // Récupérer les clés
  return Object.keys(sectionsCache[conventionId]);
}

/**
 * Récupère la liste des conventions ayant des sections
 */
export async function getConventionsWithSections(): Promise<string[]> {
  // S'assurer que l'initialisation a été faite
  if (!initialized) {
    await initSectionsFromJson();
  }
  
  // Récupérer les clés
  return Object.keys(sectionsCache);
}