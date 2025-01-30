import { type Category, type Subcategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface LegalComparisonProps {
  category: Category;
  subcategory: Subcategory;
}

const LEGAL_COMPARISONS: Record<string, Record<string, string>> = {
  'embauche': {
    'periode-essai': `### Comparaison avec le cadre légal
#### Durées maximales de la période d'essai par catégorie :

**Pour les CDI :**
- Ouvriers et employés : 2 mois, renouvelable jusqu'à 4 mois
- Agents de maîtrise et techniciens : 3 mois, renouvelable jusqu'à 6 mois
- Cadres : 4 mois, renouvelable jusqu'à 8 mois`,
    'delai-prevenance': `### Comparaison avec le cadre légal
#### En cas de rupture par l'employeur :
- Moins de 8 jours de présence : 24 heures
- Entre 8 jours et 1 mois de présence : 48 heures
- Entre 1 et 3 mois de présence : 2 semaines
- Plus de 3 mois de présence : 1 mois

#### En cas de rupture par le salarié :
- Moins de 8 jours de présence : 24 heures
- Plus de 8 jours de présence : 48 heures`
  },
  'maintien-salaire': {
    'maladie': `### Comparaison avec le cadre légal
#### Conditions d'indemnisation :
- Ancienneté minimale : 1 an
- Délai de carence : 7 jours calendaires
- Justificatifs nécessaires : 
  * Certificat médical sous 48h
  * Prise en charge par la Sécurité sociale
  * Soins en France ou dans l'EEE`,
    'accident-travail': `### Comparaison avec le cadre légal
#### Conditions d'indemnisation :
- Ancienneté minimale : 1 an
- Pas de délai de carence
- Justificatifs nécessaires :
  * Certificat médical
  * Respect des obligations de déclaration`
  },
  'depart': {
    'indemnite-licenciement': `### Comparaison avec le cadre légal
#### Conditions d'attribution :
- Ancienneté minimale : 8 mois ininterrompus
- Type de contrat : CDI
- Motif : Hors faute grave ou lourde

#### Calcul de l'indemnité :
- Jusqu'à 10 ans d'ancienneté : 1/4 de mois de salaire par année
- Au-delà de 10 ans : 1/3 de mois de salaire par année supplémentaire`,
    'preavis': `### Comparaison avec le cadre légal
#### Préavis de licenciement :
- Moins de 6 mois d'ancienneté : Selon convention collective
- Entre 6 mois et 2 ans : 1 mois
- Plus de 2 ans : 2 mois

#### Préavis de démission :
- Durée fixée par la convention collective ou les usages`
  }
};

export function LegalComparison({ category, subcategory }: LegalComparisonProps) {
  const comparison = LEGAL_COMPARISONS[category.id]?.[subcategory.id];

  if (!comparison) {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-warning/10 border border-warning/20 rounded-lg">
      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
        {comparison}
      </ReactMarkdown>
    </div>
  );
}