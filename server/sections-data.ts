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
  "Rupture_du_contrat": "depart.rupture-contrat",
  "Indemnité_de_Licenciement": "depart.licenciement",
  "Indemnité_de_Mise_a_la_Retraite": "depart.mise-retraite",
  "Indemnité_de_Départ_a_la_Retraite": "depart.depart-retraite",
  "Indemnité_de_Rupture_conventionnelle": "depart.rupture-conventionnelle",
  "Indemnité_de_précarité": "depart.precarite",
  
  // Classification
  "Classification": "classification.classification",
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
  "Contributions_Conventionnelles_à_la_Formation_Prof": "formation.contributions",
  "Formation_professionnelle": "formation.formation-pro",
  "Santé_et_sécurité": "protection-sociale.sante-securite",
  "Représentation_du_personnel": "divers.representation-personnel"
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
    
    // Collecter des statistiques pour le débogage
    let unmappedSections: Record<string, number> = {};
    let totalSectionsInJson = 0;
    let mappedSections = 0;
    
    // Parcourir toutes les conventions dans le fichier
    for (const [conventionName, conventionData] of Object.entries(data)) {
      const idcc = conventionData.idcc || ""; // ID vide si pas d'IDCC
      
      // Ajouter la convention à la liste des conventions
      conventionsCache.push({
        id: idcc,
        name: conventionData.libelle
      });
      
      // Utiliser l'IDCC comme clé de cache si disponible, sinon utiliser le nom de la convention
      const cacheKey = idcc || conventionName;
      
      // Créer une entrée pour cette convention dans le cache des sections
      if (!sectionsCache[cacheKey]) {
        sectionsCache[cacheKey] = {};
      }
      
      // Parcourir toutes les sections de cette convention
      for (const [sectionName, sectionData] of Object.entries(conventionData.sections)) {
        totalSectionsInJson++;
        
        // Déterminer le type de section dans notre application
        const appSectionType = SECTION_TYPE_MAPPING[sectionName] || `unknown.${sectionName}`;
        
        // Debug: afficher quelques exemples de mapping
        if (totalSectionsInJson < 5) {
          console.log(`Mapping de section: "${sectionName}" -> "${appSectionType}"`);
        }
        
        // Collecter des statistiques sur les sections non mappées
        if (!SECTION_TYPE_MAPPING[sectionName]) {
          if (!unmappedSections[sectionName]) {
            unmappedSections[sectionName] = 0;
          }
          unmappedSections[sectionName]++;
        } else {
          mappedSections++;
        }
        
        // Générer une clé unique qui préserve le type de section origine
        // Format: "appSectionType|originalName" pour éviter les collisions
        // Cela permettra de stocker toutes les sections sans écraser celles qui ont le même type
        const uniqueKey = `${appSectionType}|${sectionName}`;
        
        // Ajouter la section au cache
        sectionsCache[cacheKey][uniqueKey] = {
          conventionId: idcc,
          sectionType: appSectionType,
          content: sectionData.contenu
        };
      }
    }
    
    // Afficher les statistiques de mapping
    console.log(`Total de sections dans le JSON: ${totalSectionsInJson}`);
    console.log(`Sections correctement mappées: ${mappedSections}`);
    console.log(`Sections avec mapping par défaut: ${totalSectionsInJson - mappedSections}`);
    if (Object.keys(unmappedSections).length > 0) {
      console.log("Sections non mappées:");
      for (const [name, count] of Object.entries(unmappedSections)) {
        console.log(`  ${name}: ${count} occurrences`);
      }
    }
    
    // Compter les occurrences des types de sections dans le cache
    let sectionTypeCounts: Record<string, number> = {};
    let conventionSectionCounts: Record<string, number> = {};
    
    for (const [conventionId, sections] of Object.entries(sectionsCache)) {
      conventionSectionCounts[conventionId] = Object.keys(sections).length;
      
      for (const sectionType of Object.keys(sections)) {
        if (!sectionTypeCounts[sectionType]) {
          sectionTypeCounts[sectionType] = 0;
        }
        sectionTypeCounts[sectionType]++;
      }
    }
    
    // Identifier les conventions avec le plus et le moins de sections
    let minSections = Number.MAX_SAFE_INTEGER;
    let maxSections = 0;
    let conventionWithMin = "";
    let conventionWithMax = "";
    
    for (const [conventionId, count] of Object.entries(conventionSectionCounts)) {
      if (count < minSections) {
        minSections = count;
        conventionWithMin = conventionId;
      }
      if (count > maxSections) {
        maxSections = count;
        conventionWithMax = conventionId;
      }
    }
    
    console.log(`Convention avec le moins de sections: ${conventionWithMin} (${minSections} sections)`);
    console.log(`Convention avec le plus de sections: ${conventionWithMax} (${maxSections} sections)`);
    
    // Calculer le nombre total de sections mappées
    const distinctSectionTypes = Object.keys(sectionTypeCounts).length;
    console.log(`Types de sections distincts: ${distinctSectionTypes}`);
    
    // Vérifier les types de sections les plus fréquents
    const sortedSectionTypes = Object.entries(sectionTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log("Types de sections les plus fréquents:");
    for (const [type, count] of sortedSectionTypes) {
      console.log(`  ${type}: ${count} occurrences`);
    }
    
    const totalConventions = conventionsCache.length;
    // Le nombre total de sections est en fait le même que totalSectionsInJson
    // car nous avons pris soin de toutes les charger sans en écraser aucune
    
    console.log(`Chargement des données terminé: ${totalConventions} conventions et ${totalSectionsInJson} sections`);
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
 * @param conventionId Peut être un IDCC ou un nom de convention encodé
 * @param sectionType Type de section à récupérer
 */
export function getSection(conventionId: string, sectionType: string): SectionData | null {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return null;
  }
  
  let cacheKey = conventionId;
  
  // Vérifier si le conventionId est vide (convention sans IDCC) ou si on a fourni un nom plutôt qu'un ID
  if (conventionId === '' || conventionId.includes('%')) {
    try {
      // Décoder le nom de la convention
      const decodedName = decodeURIComponent(conventionId);
      console.log(`[sections-data] Recherche de section ${sectionType} pour la convention par nom ou ID vide: "${decodedName}"`);
      
      // Rechercher la convention correspondante
      const conventions = getConventions();
      const convention = conventions.find(c => 
        (conventionId === '' && c.id === '') || // Si l'ID est vide, trouver par ID vide
        c.name === decodedName                  // Sinon trouver par nom
      );
      
      if (convention) {
        // Si la convention est trouvée et a un ID non vide, utiliser cet ID comme clé
        if (convention.id) {
          cacheKey = convention.id;
          console.log(`[sections-data] Convention trouvée avec ID, utilisation de l'ID: "${cacheKey}"`);
        } else {
          // Si la convention n'a pas d'ID (id vide), utiliser le nom de la convention comme clé
          // Nous savons que le cacheKey a été créé avec le nom de la convention dans loadSectionsFromJSON
          cacheKey = decodedName;
          console.log(`[sections-data] Convention trouvée sans ID, utilisation du nom comme clé: "${cacheKey}"`);
        }
      } else {
        console.log(`[sections-data] Convention non trouvée: "${decodedName}" (ID vide ou nom)`);
        return null;
      }
    } catch (decodeError) {
      console.error("[sections-data] Erreur de décodage du nom de convention:", decodeError);
      return null;
    }
  }
  
  // Vérifier si la clé existe directement dans le cache
  if (!sectionsCache[cacheKey]) {
    console.log(`[sections-data] Pas de données pour la clé ${cacheKey}, recherche d'alternatives`);
    
    // Tenter de trouver une clé qui corresponde au nom décodé (pour les CCN sans IDCC)
    if (cacheKey.includes('%')) {
      try {
        const decodedKey = decodeURIComponent(cacheKey);
        // Rechercher une convention dont le nom contient le nom décodé
        for (const key of Object.keys(sectionsCache)) {
          if (key === decodedKey || key.includes(decodedKey) || decodedKey.includes(key)) {
            cacheKey = key;
            console.log(`[sections-data] Clé alternative trouvée: "${cacheKey}"`);
            break;
          }
        }
      } catch (e) {
        console.error('[sections-data] Erreur lors de la recherche de clé alternative:', e);
      }
    }
    
    // Vérifier à nouveau avec la nouvelle clé potentielle
    if (!sectionsCache[cacheKey]) {
      console.log(`[sections-data] Aucune convention trouvée avec la clé: ${cacheKey}`);
      return null;
    }
  }
  
  // Parcourir toutes les sections et trouver celle qui correspond au type demandé
  // Comme notre clé est maintenant "appSectionType|originalName", nous devons chercher une correspondance partielle
  for (const [key, section] of Object.entries(sectionsCache[cacheKey])) {
    if (section.sectionType === sectionType) {
      console.log(`[sections-data] Section ${sectionType} trouvée pour la convention ${cacheKey}`);
      return section;
    }
  }
  
  console.log(`[sections-data] La section ${sectionType} n'existe pas pour la convention ${cacheKey}`);
  return null;
}

/**
 * Obtient toutes les sections d'une convention
 * @param conventionId Peut être un IDCC ou un nom de convention encodé
 */
export function getSectionsByConvention(conventionId: string): SectionData[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  let actualId = conventionId;
  
  // Vérifier si le conventionId est vide (convention sans IDCC) ou si on a fourni un nom plutôt qu'un ID
  if (conventionId === '' || conventionId.includes('%')) {
    try {
      // Décoder le nom de la convention
      const decodedName = decodeURIComponent(conventionId);
      console.log(`[sections-data] Recherche de convention par nom ou ID vide: "${decodedName}"`);
      
      // Rechercher la convention correspondante
      const conventions = getConventions();
      const convention = conventions.find(c => 
        (conventionId === '' && c.id === '') || // Si l'ID est vide, trouver par ID vide
        c.name === decodedName                  // Sinon trouver par nom
      );
      
      if (convention) {
        if (convention.id) {
          // Si la convention a un ID, utiliser cet ID
          actualId = convention.id;
          console.log(`[sections-data] Convention trouvée avec ID, utilisation de l'ID: "${actualId}"`);
        } else {
          // Si la convention n'a pas d'ID, utiliser le nom original
          console.log(`[sections-data] Convention trouvée sans ID, utiliser le nom directement`);
          
          // Premièrement, essayer de trouver la clé exacte dans le cache des sections
          for (const key of Object.keys(sectionsCache)) {
            // Chercher une correspondance avec le nom dans les clés du cache
            if (key === decodedName || key.includes(decodedName) || decodedName.includes(key)) {
              actualId = key;
              console.log(`[sections-data] Clé de cache trouvée pour le nom: "${actualId}"`);
              break;
            }
          }
          
          // Si on ne trouve toujours pas, utiliser le nom décodé tel quel
          if (actualId !== decodedName && !sectionsCache[actualId]) {
            actualId = decodedName;
            console.log(`[sections-data] Utilisation du nom comme clé: "${actualId}"`);
          }
        }
      } else {
        console.log(`[sections-data] Convention non trouvée: "${decodedName}" (ID vide ou nom)`);
        return [];
      }
    } catch (decodeError) {
      console.error("[sections-data] Erreur de décodage du nom de convention:", decodeError);
      return [];
    }
  }
  
  // Vérifier si la convention existe dans le cache des sections
  if (!sectionsCache[actualId]) {
    console.log(`[sections-data] Pas de données pour la clé ${actualId}, recherche d'alternatives`);

    // Cas spécial pour les conventions sans IDCC - recherche par nom complet dans les clés du cache
    // Parcourir toutes les clés du cache et chercher une correspondance approximative
    const keys = Object.keys(sectionsCache);
    console.log(`[sections-data] Recherche parmi ${keys.length} clés de cache`);

    for (const key of keys) {
      if (key === actualId) continue; // Éviter de vérifier la même clé
      
      // Pour les conventions sans IDCC, vérifier si le nom est inclus dans la clé ou vice versa
      if (key.includes(actualId) || actualId.includes(key)) {
        console.log(`[sections-data] Correspondance trouvée: clé="${key}", recherche="${actualId}"`);
        actualId = key;
        break;
      }
      
      // Si le conventionId est encodé, essayer de le décoder et chercher une correspondance
      if (conventionId.includes('%')) {
        try {
          const decodedKey = decodeURIComponent(conventionId);
          if (key === decodedKey || key.includes(decodedKey) || decodedKey.includes(key)) {
            actualId = key;
            console.log(`[sections-data] Correspondance avec décodage: clé="${key}", décodé="${decodedKey}"`);
            break;
          }
        } catch (e) {
          // Ignorer les erreurs de décodage
        }
      }
    }
    
    // Vérifier à nouveau avec la nouvelle clé trouvée
    if (!sectionsCache[actualId]) {
      console.log(`[sections-data] Aucune section trouvée pour la convention: ${actualId}`);
      return [];
    } else {
      console.log(`[sections-data] Sections trouvées avec la clé alternative: ${actualId}`);
    }
  }
  
  // Convertir l'objet en tableau
  const sections = Object.values(sectionsCache[actualId]);
  console.log(`[sections-data] ${sections.length} sections trouvées pour la convention ${actualId}`);
  return sections;
}

/**
 * Obtient la liste des types de sections disponibles pour une convention
 * @param conventionId Peut être un IDCC ou un nom de convention encodé
 */
export function getSectionTypesByConvention(conventionId: string): string[] {
  if (!initialized) {
    console.warn("Le cache des sections n'est pas initialisé. Appelez loadSectionsFromJSON() d'abord.");
    return [];
  }
  
  let actualId = conventionId;
  
  // Vérifier si le conventionId est vide (convention sans IDCC) ou si on a fourni un nom plutôt qu'un ID
  if (conventionId === '' || conventionId.includes('%')) {
    try {
      // Décoder le nom de la convention
      const decodedName = decodeURIComponent(conventionId);
      console.log(`[sections-data] Recherche des types de section pour la convention par nom ou ID vide: "${decodedName}"`);
      
      // Rechercher la convention correspondante
      const conventions = getConventions();
      const convention = conventions.find(c => 
        (conventionId === '' && c.id === '') || // Si l'ID est vide, trouver par ID vide
        c.name === decodedName                  // Sinon trouver par nom
      );
      
      if (convention) {
        // Si la convention est trouvée
        actualId = convention.id;
        console.log(`[sections-data] Convention trouvée, utilisation de l'ID: "${actualId}" (vide ou non) pour les types de sections`);
      } else {
        console.log(`[sections-data] Convention non trouvée: "${decodedName}" (ID vide ou nom)`);
        return [];
      }
    } catch (decodeError) {
      console.error("[sections-data] Erreur de décodage du nom de convention:", decodeError);
      return [];
    }
  }
  
  // Vérifier si la convention existe
  if (!sectionsCache[actualId]) {
    console.log(`[sections-data] Aucun type de section trouvé pour la convention: ${actualId}`);
    return [];
  }
  
  // Récupérer les types de sections uniques
  const uniqueTypes = new Set<string>();
  for (const section of Object.values(sectionsCache[actualId])) {
    uniqueTypes.add(section.sectionType);
  }
  
  const sectionTypes = Array.from(uniqueTypes);
  console.log(`[sections-data] ${sectionTypes.length} types de sections trouvés pour la convention ${actualId}`);
  return sectionTypes;
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