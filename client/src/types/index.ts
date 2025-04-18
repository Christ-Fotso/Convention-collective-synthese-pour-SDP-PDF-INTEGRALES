import { z } from "zod";

export interface Convention {
  id: string; // IDCC
  name: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  references?: Array<{ pageNumber: number }>;
}

export interface ChatRequestBody {
  sourceId: string;
  messages: Message[];
  referenceSources?: boolean;
  stream?: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export const PREDEFINED_PROMPTS: Record<string, Record<string, string>> = {
  "conges": {
    "cet": "Analyse la convention collective pour récupérer toutes les informations relatives au Compte Épargne Temps (CET).\n\n1. Extraction des informations sur la mise en place :\n   - Modalités d'ouverture du CET\n   - Salariés bénéficiaires\n   - Conditions d'ancienneté éventuelles\n   - Formalités d'adhésion\n\n2. Alimentation du CET :\n   - Éléments pouvant être épargnés :\n     • Congés payés\n     • RTT\n     • Repos compensateurs\n     • Primes et éléments de salaire\n     • Autres éléments\n   - Plafonds d'épargne éventuels\n   - Périodicité des versements\n\n3. Utilisation du CET :\n   - Conditions d'utilisation\n   - Délais de prévenance\n   - Modes d'utilisation possibles :\n     • Congés\n     • Monétisation\n     • Formation\n     • Autres\n\n4. Gestion et garanties :\n   - Modalités de tenue du compte\n   - Valorisation des droits\n   - Information du salarié\n   - Garanties financières si mentionnées\n\n5. Transfert et clôture :\n   - Cas de transfert\n   - Conditions de clôture\n   - Modalités de liquidation\n\nFORMAT DE PRÉSENTATION :\n- Copier-coller exact du texte conventionnel\n- Référence précise des articles\n- Conservation de la structure originale des dispositions\n- Indication des éventuels renvois à des accords d'entreprise\n\nSi la convention collective ne contient aucune disposition sur le CET : indiquer \"RAS\"",
    "conges-payes": "Récupère toutes les dispositions concernant les congés payés dans la convention collective.\n\n1. Extraction des règles générales sur les congés payés :\n   - Durée des congés (légaux et supplémentaires)\n   - Période de référence\n   - Période de prise des congés\n   - Ordre des départs\n\n2. Modalités d'acquisition :\n   - Règles spécifiques d'acquisition\n   - Périodes assimilées à du travail effectif\n   - Cas particuliers d'acquisition\n   - Dispositions pour les temps partiels\n\n3. Organisation des congés :\n   - Règles de fractionnement\n   - Délais de prévenance\n   - Modification des dates\n   - Fermeture de l'entreprise\n\n4. Situations particulières :\n   - Maladie pendant les congés\n   - Congés et préavis\n   - Report des congés\n   - Cas des nouveaux embauchés\n\n5. Indemnisation :\n   - Mode de calcul de l'indemnité\n   - Période de versement\n   - Cas particuliers d'indemnisation\n\n6. Dispositions spécifiques :\n   - Congés supplémentaires (ancienneté, âge, etc.)\n   - Congés non pris\n   - Règles prioritaires\n\nFORMAT DE PRÉSENTATION :\n- Copier-coller exact du texte conventionnel\n- Référence précise des articles\n- Organisation thématique sans modification du contenu\n- Conservation des notes et commentaires d'origine\n\nSi la convention collective ne contient aucune disposition sur les congés payés : indiquer \"RAS\""
  },
  "informations-generales": {
    "generale": "Récupère et organise toutes les informations situées en haut des fichiers de la convention collective, en suivant la structure ci-dessous.\n\n1. Informations d'identification :\n   - Nom exact de la convention collective\n   - Numéro IDCC\n   - Numéro de brochure\n   - Code NAF/APE (si mentionné)\n\n2. Dates clés :\n   - Date de signature\n   - Date de publication au Journal Officiel\n   - Dates des derniers avenants\n   - Date d'extension (si applicable)\n\n3. Organisations :\n   A) Organisations syndicales signataires :\n      - Liste complète avec noms exacts\n   B) Organisations patronales signataires :\n      - Liste complète avec noms exacts\n\n4. Champ d'application :\n   A) Géographique :\n      - Territoire couvert\n      - Exceptions éventuelles\n   B) Professionnel :\n      - Secteurs d'activité concernés\n      - Entreprises visées\n      - Exclusions spécifiques\n\n5. Avenants et modifications :\n   - Liste chronologique des derniers avenants\n   - Objet de chaque avenant\n   - Date de signature et d'effet\n\n6. Extensions et élargissements :\n   - Références des arrêtés d'extension\n   - Dates de publication au JO\n   - Modifications éventuelles du champ d'application\n\nRÈGLES DE PRÉSENTATION :\n1. Créer des sections distinctes pour chaque type d'information\n2. Conserver la formulation exacte du texte original\n3. Indiquer les références précises des articles\n4. Préciser pour chaque information si elle provient :\n   - Du texte de base\n   - D'un avenant\n   - D'un accord complémentaire\n\nSi une information n'est pas mentionnée dans la convention, indiquer explicitement \"Non précisé dans la convention\"."
  }
};;