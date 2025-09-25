/**
 * Mapping entre les types de sections et les prompts utilisateur correspondants
 */

// Mapping des types de section vers les noms de section dans les prompts
export const SECTION_PROMPT_MAPPING: Record<string, string> = {
  // Informations générales - Gestion des différentes variantes
  "informations-generales": "Informations générales",
  "informations-generales.generale": "Informations générales",
  
  // Embauche
  "embauche.delai-prevenance": "Délai de prévenance",
  "embauche.periode-essai": "Période d'essai",
  
  // Temps de travail
  "temps-travail.duree-travail": "Durées du travail",
  "temps-travail.amenagement": "Aménagement du temps de travail",
  "temps-travail.amenagement-temps": "Aménagement du temps de travail",
  "temps-travail.heures-sup": "Heures supplémentaires",
  "temps-travail.temps-partiel": "Temps partiel",
  "temps-travail.forfait-jours": "Forfait jours",
  "temps-travail.cet": "CET",
  
  // Congés
  "conges.conges-payes": "Congés payés",
  "conges.evenement-familial": "Evènement familial",
  
  // Classification
  "classification.generale": "Classification Con + Détails",
  "classification.classification": "Classification Con + Détails",
  
  // Protection sociale
  "protection-sociale.cotisation-prevoyance": "Cotisation prévoyance",
  "protection-sociale.prevoyance": "Cotisation prévoyance",
  "protection-sociale.cotisation-retraite": "Cotisation retraite",
  "protection-sociale.retraite": "Cotisation retraite", 
  "protection-sociale.cotisation-mutuelle": "Cotisation mutuelle",
  "protection-sociale.mutuelle": "Cotisation mutuelle",
  "protection-sociale.accident-travail": "Accident de travail",
  "protection-sociale.maladie": "Maladie",
  "protection-sociale.maternite-paternite": "Maternité / Paternité",
  
  // Contrats particuliers et rémunération  
  "contrats-particuliers.apprenti": "Apprenti",
  "remuneration.apprenti": "Apprenti",
  "contrats-particuliers.professionalisation": "Contrat de professionalisation",
  "remuneration.contrat-pro": "Contrat de professionalisation",
  "contrats-particuliers.stagiaire": "Stagiaire",
  "remuneration.stagiaire": "Stagiaire",
  
  // Primes et indemnités
  "primes-indemnites.generale": "**Primes, Indemnités, Avantages en Nature et Frais Professionnels**",
  
  // Rémunération
  "remuneration.grille": "Grille de Rémunération",
  "remuneration.prime": "**Primes, Indemnités, Avantages en Nature et Frais Professionnels**",
  "remuneration.majoration-dimanche": "Majoration Dimanche",
  "remuneration.majoration-ferie": "Majoration Férié",
  "remuneration.majoration-nuit": "Majoration Nuit",
  
  // Rupture et départ
  "rupture.indemnite-licenciement": "Indemnité de Licenciement",
  "depart.licenciement": "Indemnité de Licenciement", 
  "rupture.indemnite-mise-retraite": "Indemnité de Mise a la Retraite",
  "depart.mise-retraite": "Indemnité de Mise a la Retraite",
  "rupture.indemnite-depart-retraite": "Indemnité de Départ a la Retraite",
  "depart.depart-retraite": "Indemnité de Départ a la Retraite",
  "rupture.indemnite-rupture-conventionnelle": "Indemnité de Rupture conventionnelle",
  "depart.rupture-conventionnelle": "Indemnité de Rupture conventionnelle",
  "rupture.preavis": "Préavis",
  "depart.preavis": "Préavis",
  "rupture.indemnite-precarite": "Indemnité de précarité",
  "depart.precarite": "Indemnité de précarité",
  
  // Formation
  "formation.contributions": "Contributions Conventionnelles à la Formation Professionnelle",
  "formation.paritarisme": "Paritarisme (Financement)",
  
  // Congés supplémentaires
  "conges.cet": "CET",
  
  // Autres mappings manquants - avec prompt générique
  "default": "Informations générales"
};

/**
 * Extrait le prompt utilisateur correspondant à un type de section
 */
export async function getSectionPrompt(sectionType: string): Promise<string> {
  let sectionName = SECTION_PROMPT_MAPPING[sectionType];
  
  // Si aucun mapping trouvé, essayer avec une version simplifiée ou utiliser le prompt par défaut
  if (!sectionName) {
    console.warn(`Aucun prompt spécifique trouvé pour le type de section: ${sectionType}, utilisation du prompt générique`);
    sectionName = SECTION_PROMPT_MAPPING["default"] || "Informations générales";
  }

  try {
    // Charger le fichier des prompts utilisateur
    const response = await fetch('/attached_assets/user_prompt_1758732459513.md');
    if (!response.ok) {
      console.warn('Fichier des prompts utilisateur non trouvé, utilisation du prompt par défaut');
      return generateFallbackPrompt(sectionName);
    }
    
    const content = await response.text();
    
    // Rechercher le prompt correspondant à cette section
    const sectionStart = content.indexOf(`<!-- SECTION: ${sectionName} -->`);
    if (sectionStart === -1) {
      console.warn(`Section "${sectionName}" non trouvée dans le fichier de prompts, utilisation du prompt par défaut`);
      return generateFallbackPrompt(sectionName);
    }
    
    // Trouver la fin de cette section (début de la section suivante)
    const nextSectionStart = content.indexOf('<!-- SECTION:', sectionStart + 1);
    const sectionEnd = nextSectionStart === -1 ? content.length : nextSectionStart;
    
    // Extraire le prompt de cette section
    const sectionPrompt = content.substring(sectionStart, sectionEnd).trim();
    
    // Enlever le commentaire de début
    return sectionPrompt.replace(`<!-- SECTION: ${sectionName} -->`, '').trim();
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction du prompt:', error);
    console.warn('Utilisation du prompt par défaut suite à l\'erreur');
    return generateFallbackPrompt(sectionName);
  }
}

/**
 * Génère un prompt par défaut pour une section donnée
 */
function generateFallbackPrompt(sectionName: string): string {
  return `Vous êtes un expert en droit du travail français spécialisé dans l'analyse des conventions collectives.

Analysez le document PDF fourni et extrayez toutes les informations relatives à "${sectionName}".

## Instructions :
1. Lisez attentivement tout le document PDF
2. Identifiez toutes les dispositions relatives à "${sectionName}"
3. Structurez les informations de manière claire et organisée
4. Utilisez des tableaux markdown quand c'est pertinent
5. Citez les articles et références précises quand disponibles
6. Indiquez clairement si certaines informations ne sont pas disponibles

## Format de réponse attendu :
Présentez les informations sous forme de contenu markdown bien structuré avec des titres, tableaux et listes selon le besoin.

Si aucune information n'est trouvée pour "${sectionName}", indiquez-le clairement : "Contenu non disponible pour cette convention. Veuillez consulter la convention collective complète pour plus d'informations."`;
}

/**
 * Charge le prompt système depuis le fichier
 */
export async function getSystemPrompt(): Promise<string> {
  try {
    const response = await fetch('/attached_assets/prompt_system_1758732459512.md');
    if (!response.ok) {
      throw new Error('Erreur lors du chargement du prompt système');
    }
    
    return await response.text();
    
  } catch (error) {
    console.error('Erreur lors du chargement du prompt système:', error);
    throw error;
  }
}