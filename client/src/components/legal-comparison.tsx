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
- Ouvriers et employés : 2 mois maximum de durée initiale
- Agents de maîtrise et techniciens : 3 mois maximum de durée initiale
- Cadres : 4 mois maximum de durée initiale

**Important :** Le renouvellement de la période d'essai n'est possible que s'il est expressément prévu par un accord de branche étendu ou la convention collective applicable. Si la convention collective ne prévoit pas de renouvellement, il n'est pas possible de renouveler la période d'essai.

Dans le cas où le renouvellement est prévu par la convention collective, les durées maximales avec renouvellement sont :
- Ouvriers et employés : jusqu'à 4 mois
- Agents de maîtrise et techniciens : jusqu'à 6 mois
- Cadres : jusqu'à 8 mois

**Pour les CDD :**
La durée de la période d'essai ne peut excéder une durée calculée à raison de :
- 1 jour par semaine, dans la limite de 2 semaines pour les contrats ≤ 6 mois
- 1 mois maximum pour les contrats > 6 mois

Ces durées peuvent être réduites par la convention collective applicable ou par accord entre les parties.`,
    'delai-prevenance': `### Comparaison avec le cadre légal
#### Règle générale
Il convient d'appliquer le délai de prévenance le plus favorable au salarié entre celui prévu par la loi et celui prévu par la convention collective.

#### Délais légaux minimums
En cas de rupture par l'employeur :
- Moins de 8 jours de présence : 24 heures
- Entre 8 jours et 1 mois de présence : 48 heures
- Entre 1 et 3 mois de présence : 2 semaines
- Plus de 3 mois de présence : 1 mois

En cas de rupture par le salarié :
- Moins de 8 jours de présence : 24 heures
- Plus de 8 jours de présence : 48 heures

**Important :** Si la convention collective prévoit des délais plus longs, ce sont ces délais plus favorables qui s'appliquent au salarié.`
  },
  'maintien-salaire': {
    'maladie': `### Comparaison avec le cadre légal
#### Conditions d'indemnisation

Le salarié doit avoir au moins 1 an d'ancienneté dans l'entreprise pour bénéficier du maintien de salaire.

#### Calcul de l'indemnisation légale
Le salarié perçoit un pourcentage de sa rémunération brute qu'il aurait perçue s'il avait continué à travailler :

**Montant de l'indemnisation :**
- Premiers 30 jours : 90% de la rémunération brute
- 30 jours suivants : 66,66% de la rémunération brute

**Important :** Ces montants incluent les indemnités journalières versées par la Sécurité sociale.

#### Augmentation des durées selon l'ancienneté
Les durées d'indemnisation augmentent de 10 jours par période de 5 ans d'ancienneté au-delà de 1 an, sans dépasser 90 jours par période.

**Durées d'indemnisation selon l'ancienneté :**
- 1 à 5 ans : 30 jours à 90% + 30 jours à 66,66%
- 6 à 10 ans : 40 jours à 90% + 40 jours à 66,66%
- 11 à 15 ans : 50 jours à 90% + 50 jours à 66,66%
- 16 à 20 ans : 60 jours à 90% + 60 jours à 66,66%
- 21 à 25 ans : 70 jours à 90% + 70 jours à 66,66%
- 26 à 30 ans : 80 jours à 90% + 80 jours à 66,66%
- 31 ans et plus : 90 jours à 90% + 90 jours à 66,66%

**Note :** En cas de dispositions plus favorables dans la convention collective, celles-ci s'appliquent en priorité.`,
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
    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm dark:bg-green-900/10 dark:border-green-900/20">
      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
        {comparison}
      </ReactMarkdown>
    </div>
  );
}