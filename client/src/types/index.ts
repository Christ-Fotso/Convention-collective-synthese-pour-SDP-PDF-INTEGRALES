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
  'informations-generales': {
    'default': 'Quelles sont les informations générales importantes de cette convention collective ? Donnez-moi un résumé complet incluant le champ d\'application, les dispositions générales et la date d\'effet.'
  },
  'embauche': {
    'delai-prevenance': 'Quels sont les délais de prévenance prévus dans la convention ? Détaillez tous les cas de figure.',
    'duree-travail': 'Quelle est la durée du temps de travail prévue par la convention ? Précisez la durée hebdomadaire, les modalités d\'aménagement et les spécificités.',
    'periode-essai': 'Quelles sont les durées de période d\'essai par catégorie de personnel ? Précisez les conditions de renouvellement.'
  },
  'conges': {
    'cet': 'Comment fonctionne le Compte Épargne Temps (CET) selon la convention ? Détaillez les modalités d\'alimentation et d\'utilisation.',
    'conges-payes': 'Quelles sont les dispositions concernant les congés payés ? Précisez la durée, l\'acquisition, la prise et les éventuelles majorations.',
    'evenement-familial': 'Quels sont les congés prévus pour événements familiaux ? Listez tous les événements et leurs durées respectives.'
  },
  'classification': {
    'classification-details': 'Détaillez le système de classification des emplois prévu par la convention. Précisez les différents niveaux, échelons et critères de classification.'
  },
  'cotisations': {
    'prevoyance': 'Quelles sont les dispositions concernant la prévoyance ? Détaillez les taux de cotisation et la répartition employeur/salarié.',
    'retraite': 'Quelles sont les dispositions concernant la retraite complémentaire ? Précisez les taux de cotisation et la répartition.',
    'mutuelle': 'Quelles sont les dispositions concernant la mutuelle ? Détaillez la couverture, les taux et la répartition des cotisations.'
  },
  'maintien-salaire': {
    'accident-travail': 'Quelles sont les conditions de maintien de salaire en cas d\'accident du travail ? Précisez la durée et le niveau d\'indemnisation.',
    'maladie': 'Quelles sont les conditions de maintien de salaire en cas de maladie ? Détaillez les conditions d\'ancienneté, la durée et le niveau d\'indemnisation.',
    'maternite-paternite': 'Quelles sont les dispositions pour le maintien de salaire en cas de maternité ou paternité ? Précisez la durée et le niveau d\'indemnisation.'
  },
  'remuneration': {
    'apprenti': 'Quelles sont les dispositions concernant la rémunération des apprentis, contrats pro et stagiaires ? Détaillez les barèmes et pourcentages.',
    'prime': 'Quelles sont les différentes primes prévues par la convention ? Listez toutes les primes et leurs conditions d\'attribution.',
    'grille': 'Quelle est la grille de rémunération prévue par la convention ? Détaillez les salaires minima par niveau et échelon.',
    'majoration-dimanche': 'Quelles sont les majorations prévues pour le travail du dimanche ? Précisez les taux et conditions.',
    'majoration-ferie': 'Quelles sont les majorations prévues pour le travail des jours fériés ? Précisez les taux et conditions.',
    'majoration-nuit': 'Quelles sont les majorations prévues pour le travail de nuit ? Précisez les taux, horaires et conditions.'
  },
  'depart': {
    'indemnite-licenciement': 'Comment est calculée l\'indemnité de licenciement ? Précisez les conditions d\'ancienneté et le mode de calcul.',
    'indemnite-mise-retraite': 'Comment est calculée l\'indemnité de mise à la retraite ? Précisez les conditions et le mode de calcul.',
    'indemnite-depart-retraite': 'Comment est calculée l\'indemnité de départ à la retraite ? Précisez les conditions et le mode de calcul.',
    'indemnite-rupture': 'Quelles sont les indemnités prévues en cas de rupture de contrat ? Détaillez les différents cas et montants.',
    'preavis': 'Quelles sont les durées de préavis selon les cas de rupture ? Détaillez par motif et catégorie.'
  }
};