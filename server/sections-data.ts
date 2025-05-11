/**
 * Données statiques des sections de conventions collectives
 * 
 * Ce fichier contient les sections préextraites au format JSON
 * directement intégrées dans le code pour éviter les problèmes
 * de base de données et d'importation
 */

import fs from 'fs';
import path from 'path';

// Interface pour les sections de conventions
export interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
}

// Structure du fichier JSON
interface ConventionDataJSON {
  [conventionName: string]: {
    libelle: string;
    idcc: string;
    sections: {
      [sectionName: string]: {
        section: string;
        contenu: string;
      }
    }
  }
}

// Mapping entre les noms de sections dans le JSON et les types de sections dans l'application
const SECTION_TYPE_MAPPING: Record<string, string> = {
  // Informations générales
  "Informations_générales": "informations-generales.generale",
  
  // Embauche
  "Délai_de_prévenance": "embauche.delai-prevenance",
  "Période_d'essai": "embauche.periode-essai",
  
  // Temps de travail
  "Durées_du_travail": "temps-travail.duree-travail",
  "Aménagement_du_temps_de_travail": "temps-travail.amenagement-temps",
  "Heures_supplémentaires": "temps-travail.heures-sup",
  "Temps_partiel": "temps-travail.temps-partiel",
  "Forfait_jours": "temps-travail.forfait-jours",
  "Majoration_Nuit": "temps-travail.travail-nuit",
  "Astreintes": "temps-travail.astreintes",
  "Majoration_Férié": "temps-travail.jours-feries",
  "Repos_hebdomadaire": "temps-travail.repos-hebdomadaire",
  "Majoration_Dimanche": "temps-travail.travail-dimanche",
  
  // Congés
  "Congés_payés": "conges.conges-payes",
  "CET": "conges.cet",
  "Evènement_familial": "conges.evenement-familial",
  "Congés_d'ancienneté": "conges.anciennete",
  "Congés_exceptionnels": "conges.conges-exceptionnels",
  "Jours_supplémentaires": "conges.jours-supplementaires",
  "Fractionnement": "conges.fractionnement",
  "Congé_sans_solde": "conges.sans-solde",
  "Deuil": "conges.deces",
  "Enfant_malade": "conges.enfant-malade",
  
  // Départ
  "Préavis": "depart.preavis",
  "Indemnité_de_Licenciement": "depart.licenciement",
  "Indemnité_de_Mise_a_la_Retraite": "depart.mise-retraite",
  "Indemnité_de_Départ_a_la_Retraite": "depart.depart-retraite",
  "Indemnité_de_Rupture_conventionnelle": "depart.rupture-conventionnelle",
  "Indemnité_de_précarité": "depart.precarite",
  
  // Classification
  "Classification_Con_+_Détails": "classification.classification",
  "Grille_de_classification": "classification.grille",
  "Evolution_de_carrière": "classification.evolution",
  "Emplois_repères": "classification.emplois-reperes",
  "Coefficients": "classification.coefficients",
  
  // Rémunération
  "Grille_de_Rémunération": "remuneration.grille",
  "13ème_mois": "remuneration.13eme-mois",
  "Prime_d'ancienneté": "remuneration.anciennete",
  "Indemnité_transport": "remuneration.transport",
  "Indemnité_repas": "remuneration.repas",
  "Indemnité_astreinte": "remuneration.astreinte",
  "Primes,_Indemnités,_Avantages_et_Frais_Professionn": "remuneration.prime",
  "Apprenti": "remuneration.apprenti",
  "Contrat_de_professionalisation": "remuneration.contrat-pro",
  "Stagiaire": "remuneration.stagiaire",
  "Majoration_Dimanche_Rem": "remuneration.majoration-dimanche",
  "Majoration_Férié_Rem": "remuneration.majoration-ferie",
  "Majoration_Nuit_Rem": "remuneration.majoration-nuit",
  
  // Autres
  "Accident_de_travail": "protection-sociale.accident-travail",
  "Maladie": "protection-sociale.maladie",
  "Maternité_Paternité": "protection-sociale.maternite-paternite",
  "Cotisation_mutuelle": "protection-sociale.mutuelle",
  "Cotisation_prévoyance": "protection-sociale.prevoyance",
  "Cotisation_retraite": "protection-sociale.retraite",
  "Paritarisme_(Financement)": "divers.paritarisme",
  "Contributions_Conventionnelles_à_la_Formation_Prof": "formation.contributions"
};

// Cache des sections
let sectionsCache: Record<string, Record<string, SectionData>> = {};
let conventionsCache: { id: string, name: string }[] = [];
let initialized = false;

/**
 * Initialise le cache des sections depuis le fichier JSON
 */
export async function loadSectionsFromJSON(): Promise<void> {
  if (initialized) return;

  try {
    // Chemin du fichier JSON
    const filePath = path.join(process.cwd(), 'data.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Le fichier data.json n'existe pas à l'emplacement: ${filePath}`);
      sectionsCache = {};
      conventionsCache = [];
      initialized = true;
      return;
    }
    
    // Lire le fichier et parser son contenu
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Initialiser les caches
    sectionsCache = {};
    conventionsCache = [];
    
    // Parcourir toutes les conventions dans le fichier
    for (const [conventionName, conventionData] of Object.entries(data)) {
      const idcc = conventionData.idcc;
      
      // Ajouter la convention à la liste des conventions
      conventionsCache.push({
        id: idcc,
        name: conventionData.libelle
      });
      
      // Créer une entrée pour cette convention dans le cache des sections
      if (!sectionsCache[idcc]) {
        sectionsCache[idcc] = {};
      }
      
      // Parcourir toutes les sections de cette convention
      for (const [sectionName, sectionData] of Object.entries(conventionData.sections)) {
        // Déterminer le type de section dans notre application
        const appSectionType = SECTION_TYPE_MAPPING[sectionName] || `unknown.${sectionName}`;
        
        // Ajouter la section au cache
        sectionsCache[idcc][appSectionType] = {
          conventionId: idcc,
          sectionType: appSectionType,
          content: sectionData.contenu
        };
      }
    }
    
    const totalConventions = conventionsCache.length;
    const totalSections = Object.values(sectionsCache).reduce(
      (total, sections) => total + Object.keys(sections).length, 
      0
    );
    
    console.log(`Chargement des données terminé: ${totalConventions} conventions et ${totalSections} sections`);
    initialized = true;
  } catch (error) {
    console.error("Erreur lors du chargement des sections depuis le fichier JSON:", error);
    sectionsCache = {};
    conventionsCache = [];
    initialized = true;
  }
}

/**
 * Obtient une section par convention et type
 */
export function getSection(conventionId: string, sectionType: string): SectionData | null {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return null;
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
 * Obtient toutes les sections d'une convention
 */
export function getSectionsByConvention(conventionId: string): SectionData[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[conventionId]) {
    return [];
  }
  
  // Convertir l'objet en tableau
  return Object.values(sectionsCache[conventionId]);
}

/**
 * Obtient la liste des types de sections disponibles pour une convention
 */
export function getSectionTypesByConvention(conventionId: string): string[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[conventionId]) {
    return [];
  }
  
  // Récupérer les clés
  return Object.keys(sectionsCache[conventionId]);
}

/**
 * Obtient la liste des conventions disponibles
 */
export function getConventions(): { id: string, name: string }[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  return conventionsCache;
}

/**
 * Obtient la liste des conventions ayant des sections
 */
export function getConventionsWithSections(): string[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  return Object.keys(sectionsCache);
}