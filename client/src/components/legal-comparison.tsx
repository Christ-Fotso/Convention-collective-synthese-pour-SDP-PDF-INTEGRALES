import { type Category, type Subcategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface LegalComparisonProps {
  category: Category;
  subcategory: Subcategory;
}

const LEGAL_COMPARISONS: Record<string, Record<string, string>> = {
  'embauche': {
    'delai-prevenance': `### Comparaison avec le cadre légal
Pour la rupture de la période d'essai :

#### Rupture par l'employeur :
- Présence < 8 jours : 24 heures
- Présence entre 8 jours et 1 mois : 48 heures
- Présence entre 1 et 3 mois : 2 semaines
- Présence > 3 mois : 1 mois

#### Rupture par le salarié :
- Présence < 8 jours : 24 heures
- Présence ≥ 8 jours : 48 heures`,
    'duree-travail': `### Comparaison avec le cadre légal
- La durée légale du travail est fixée à 35 heures hebdomadaires
- La durée quotidienne maximale est de 10 heures
- La durée hebdomadaire maximale est de 48 heures
- Des dérogations sont possibles dans certains cas`,
    'periode-essai': `### Comparaison avec le cadre légal
- CDI : 2 mois pour les ouvriers et employés
- 3 mois pour les techniciens et agents de maîtrise
- 4 mois pour les cadres
- CDD : 1 jour par semaine dans la limite de 2 semaines pour les contrats ≤ 6 mois
- 1 mois pour les contrats > 6 mois`
  },
  'conges': {
    'conges-payes': `### Comparaison avec le cadre légal
- 2,5 jours ouvrables par mois de travail effectif
- 30 jours ouvrables (5 semaines) pour une année complète
- Période de référence du 1er juin au 31 mai
- Période de prise des congés du 1er mai au 31 octobre`,
    'evenement-familial': `### Comparaison avec le cadre légal
- Mariage/PACS : 4 jours
- Naissance/Adoption : 3 jours
- Décès enfant : 7 jours + 8 jours
- Décès conjoint/parent : 3 jours
- Annonce handicap enfant : 2 jours`
  }
  // Les comparaisons légales ne seront affichées que pour les catégories non-RAS
};

export function LegalComparison({ category, subcategory }: LegalComparisonProps) {
  const comparison = LEGAL_COMPARISONS[category.id]?.[subcategory.id];

  if (!comparison) {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-primary/5 rounded-lg">
      <ReactMarkdown className="prose prose-sm dark:prose-invert">
        {comparison}
      </ReactMarkdown>
    </div>
  );
}