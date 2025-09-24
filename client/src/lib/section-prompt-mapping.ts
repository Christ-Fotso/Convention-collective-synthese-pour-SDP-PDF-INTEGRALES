/**
 * Mapping entre les types de sections et les prompts utilisateur correspondants
 */

// Mapping des types de section vers les noms de section dans les prompts
export const SECTION_PROMPT_MAPPING: Record<string, string> = {
  // Informations générales
  "informations-generales.generale": "Informations générales",
  
  // Embauche
  "embauche.delai-prevenance": "Délai de prévenance",
  "embauche.periode-essai": "Période d'essai",
  
  // Temps de travail
  "temps-travail.duree-travail": "Durées du travail",
  "temps-travail.amenagement": "Aménagement du temps de travail",
  "temps-travail.heures-sup": "Heures supplémentaires",
  "temps-travail.temps-partiel": "Temps partiel",
  "temps-travail.forfait-jours": "Forfait jours",
  "temps-travail.cet": "CET",
  
  // Congés
  "conges.conges-payes": "Congés payés",
  "conges.evenement-familial": "Evènement familial",
  
  // Classification
  "classification.generale": "Classification Con + Détails",
  
  // Protection sociale
  "protection-sociale.cotisation-prevoyance": "Cotisation prévoyance",
  "protection-sociale.cotisation-retraite": "Cotisation retraite",
  "protection-sociale.cotisation-mutuelle": "Cotisation mutuelle",
  "protection-sociale.accident-travail": "Accident de travail",
  "protection-sociale.maladie": "Maladie",
  "protection-sociale.maternite-paternite": "Maternité / Paternité",
  
  // Contrats particuliers
  "contrats-particuliers.apprenti": "Apprenti",
  "contrats-particuliers.professionalisation": "Contrat de professionalisation",
  "contrats-particuliers.stagiaire": "Stagiaire",
  
  // Primes et indemnités
  "primes-indemnites.generale": "**Primes, Indemnités, Avantages en Nature et Frais Professionnels**",
  
  // Rémunération
  "remuneration.grille": "Grille de Rémunération",
  "remuneration.majoration-dimanche": "Majoration Dimanche",
  "remuneration.majoration-ferie": "Majoration Férié",
  "remuneration.majoration-nuit": "Majoration Nuit",
  
  // Rupture
  "rupture.indemnite-licenciement": "Indemnité de Licenciement",
  "rupture.indemnite-mise-retraite": "Indemnité de Mise a la Retraite",
  "rupture.indemnite-depart-retraite": "Indemnité de Départ a la Retraite",
  "rupture.indemnite-rupture-conventionnelle": "Indemnité de Rupture conventionnelle",
  "rupture.preavis": "Préavis",
  "rupture.indemnite-precarite": "Indemnité de précarité",
  
  // Formation
  "formation.contributions": "Contributions Conventionnelles à la Formation Professionnelle",
  "formation.paritarisme": "Paritarisme (Financement)"
};

/**
 * Extrait le prompt utilisateur correspondant à un type de section
 */
export async function getSectionPrompt(sectionType: string): Promise<string> {
  const sectionName = SECTION_PROMPT_MAPPING[sectionType];
  
  if (!sectionName) {
    throw new Error(`Aucun prompt trouvé pour le type de section: ${sectionType}`);
  }

  try {
    // Charger le fichier des prompts utilisateur
    const response = await fetch('/attached_assets/user_prompt_1758732459513.md');
    if (!response.ok) {
      throw new Error('Erreur lors du chargement du fichier de prompts');
    }
    
    const content = await response.text();
    
    // Rechercher le prompt correspondant à cette section
    const sectionStart = content.indexOf(`<!-- SECTION: ${sectionName} -->`);
    if (sectionStart === -1) {
      throw new Error(`Section "${sectionName}" non trouvée dans le fichier de prompts`);
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
    throw error;
  }
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