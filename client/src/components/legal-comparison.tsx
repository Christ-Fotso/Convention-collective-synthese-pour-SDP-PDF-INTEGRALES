import { type Category, type Subcategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface LegalComparisonProps {
  category: Category;
  subcategory: Subcategory;
}

const LEGAL_COMPARISONS: Record<string, Record<string, string>> = {
  'cotisations': {
    'prevoyance': `### Comparaison avec le cadre légal

**Important :** L'obligation légale de cotisation prévoyance ne concerne que les cadres.

#### Dispositions légales pour les cadres
- Cotisation minimale obligatoire : 1,50% de la tranche A (jusqu'au plafond de la sécurité sociale)
- Cette cotisation est à la charge exclusive de l'employeur
- Obligation issue de la Convention Collective Nationale de 1947

#### Pour les non-cadres
- Aucune obligation légale de cotisation prévoyance
- La mise en place d'une prévoyance ne peut résulter que de :
  * La convention collective applicable
  * Un accord d'entreprise
  * Une décision unilatérale de l'employeur

**Note :** La convention collective peut prévoir :
- Des taux de cotisation supérieurs
- Une répartition spécifique entre employeur et salarié
- Une extension aux non-cadres
- Des garanties particulières`,

    'retraite': `### Comparaison avec le cadre légal

#### Retraite complémentaire AGIRC-ARRCO
**Taux de cotisation légaux :**
- Tranche 1 (jusqu'à 1 PSS) : 7,87%
- Tranche 2 (1 à 8 PSS) : 21,59%

**Répartition employeur/salarié :**
- Part employeur : 60%
- Part salarié : 40%

#### Contribution d'Équilibre Général (CEG)
**Taux de cotisation :**
- Tranche 1 : 2,15%
- Tranche 2 : 2,70%

**Répartition :**
- Part employeur : 60%
- Part salarié : 40%

#### Contribution d'Équilibre Technique (CET)
- S'applique aux salaires > 1 PSS
- Taux : 0,35%
- Répartition : 60% employeur, 40% salarié

#### Points importants
- Les taux sont obligatoires et s'appliquent à tous les salariés
- Le PSS (Plafond de la Sécurité Sociale) est réévalué chaque année
- La convention collective peut prévoir :
  * Des taux supérieurs
  * Une répartition différente (plus favorable au salarié)
  * Des assiettes de calcul spécifiques

**Note :** La convention collective ne peut pas prévoir de taux inférieurs aux taux légaux.`,

    'mutuelle': `### Comparaison avec le cadre légal

#### Obligation de mise en place
- Toutes les entreprises doivent proposer une mutuelle collective à leurs salariés
- Cette obligation s'applique à tous les salariés (CDD, CDI, temps partiel)
- La mise en place doit se faire par :
  * Une convention collective
  * Un accord d'entreprise
  * Une décision unilatérale de l'employeur (DUE)

#### Participation employeur
- L'employeur doit prendre en charge au minimum 50% de la cotisation
- Cette participation minimale s'applique sur la couverture obligatoire minimale

#### Cas de dispense
Les salariés peuvent refuser d'adhérer dans certains cas :
- CDD ou contrat de mission < 12 mois
- CDD ou contrat de mission ≥ 12 mois avec une couverture individuelle
- Temps partiel avec cotisation ≥ 10% du salaire brut
- Bénéficiaires de la CSS ou de l'ACS
- Couverture obligatoire par ailleurs (y compris en tant qu'ayant droit)
- Multi-employeurs déjà couverts

#### Panier de soins minimal
La couverture doit inclure au minimum :
- Intégralité du ticket modérateur
- Forfait journalier hospitalier sans limitation de durée
- Soins dentaires (125% BR) et orthodontie (125% BR)
- Optique : forfait tous les 2 ans (100€ minimum pour des verres simples)

**Note :** La convention collective peut prévoir :
- Une répartition plus favorable de la cotisation
- Des garanties supérieures au minimum légal
- Des conditions d'ancienneté (maximum 6 mois)`,
  },
  'conges': {
    'cet': `### Comparaison avec le cadre légal

**Important :** La loi ne prévoit pas de dispositions spécifiques concernant le Compte Épargne Temps (CET). Sa mise en place est uniquement possible par :
- Une convention collective
- Un accord d'entreprise
- Un accord de branche

Le CET n'est donc pas un droit légal et dépend entièrement des dispositions conventionnelles. Sans accord collectif le prévoyant, il n'est pas possible de mettre en place un CET dans l'entreprise.

Les modalités de fonctionnement (alimentation, utilisation, liquidation) sont définies exclusivement par l'accord collectif qui le met en place.`,

    'conges-payes': `### Comparaison avec le cadre légal

#### Période d'acquisition et durée
- Période légale d'acquisition : du 1er juin au 31 mai
- Durée légale : 5 semaines (30 jours ouvrables ou 25 jours ouvrés)
- Le décompte en jours ouvrés n'est possible que si prévu par la convention collective

#### Acquisition pendant les absences
- En cas d'arrêt maladie : acquisition de 2,5 jours par mois (ou 2,08 jours ouvrés)
- La convention collective peut prévoir des dispositions plus favorables
- Certains arrêts sont assimilés à du temps de travail effectif pour l'acquisition des congés

#### Points importants
- Les congés d'ancienneté ne sont pas prévus par la loi
- Seule la convention collective peut prévoir des congés supplémentaires liés à l'ancienneté
- Le fractionnement des congés peut donner droit à des jours supplémentaires selon les règles légales

#### Prise des congés
- L'employeur fixe les dates de congés
- Consultation des représentants du personnel obligatoire
- Délai de prévenance raisonnable
- Ordre des départs tenant compte de la situation familiale

**Note :** La convention collective peut prévoir des dispositions plus favorables sur tous ces points.`,
    'evenement-familial': `### Comparaison avec le cadre légal

**Important :** Il convient d'appliquer la disposition la plus favorable au salarié entre la loi et la convention collective.

#### Durées légales des congés pour événements familiaux

| Événement familial | Durée du congé | Type de jours |
|-------------------|----------------|---------------|
| Mariage du salarié | 4 jours | Ouvrables |
| Conclusion d'un PACS | 4 jours | Ouvrables |
| Mariage d'un enfant | 1 jour | Ouvrables |
| Naissance d'un enfant | 3 jours | Ouvrables |
| Adoption d'un enfant | 3 jours | Ouvrables |
| Décès du conjoint, partenaire de PACS ou concubin | 3 jours | Ouvrables |
| Décès d'un enfant (cas général) | 12 jours | Ouvrables |
| Décès d'un enfant âgé de moins de 25 ans, ou d'un enfant, quel que soit son âge, s'il était lui-même parent, ou d'une personne de moins de 25 ans à charge effective et permanente | 14 jours | Ouvrables |
| Décès du père, de la mère, du beau-père ou de la belle-mère | 3 jours | Ouvrables |
| Décès d'un frère ou d'une sœur | 3 jours | Ouvrables |
| Annonce de la survenue d'un handicap, d'une pathologie chronique nécessitant un apprentissage thérapeutique ou d'un cancer chez un enfant | 5 jours | Ouvrables |

**Note :** 
- Ces durées sont les minimums légaux
- La convention collective peut prévoir des durées plus longues
- Dans ce cas, ce sont les durées conventionnelles plus favorables qui s'appliquent
- Le salarié doit fournir un justificatif de l'événement`,
  },
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

**Important :** Si la convention collective prévoit des délais plus longs, ce sont ces délais plus favorables qui s'appliquent au salarié.`,

    'duree-travail': `### Comparaison avec le cadre légal

#### Durée légale du travail
- Durée légale hebdomadaire : 35 heures
- Durée quotidienne maximale : 10 heures
- Durée hebdomadaire maximale : 48 heures (ou 44 heures sur 12 semaines consécutives)

#### Heures supplémentaires
**Majoration légale :**
- De la 36e à la 43e heure : 25%
- À partir de la 44e heure : 50%

**Important :** La convention collective peut prévoir des taux de majoration différents (10%, 20%, 50%), mais ils ne peuvent pas être inférieurs à 10%.

#### Temps partiel
**Durée minimale :**
- 24 heures hebdomadaires, sauf dérogation prévue par la convention collective ou demande écrite et motivée du salarié

**Heures complémentaires :**
- Limite légale : 10% du temps de travail contractuel
- Possibilité d'augmentation jusqu'à 1/3 si prévu par accord collectif
- Majoration minimale de 10% dans la limite du 1/10e
- Majoration minimale de 25% au-delà, si autorisé par accord

#### Forfait jours
**Conditions :**
- Maximum légal : 218 jours par an
- Ne peut être mis en place que si prévu par la convention collective
- Nécessite un accord écrit du salarié
- Réservé aux cadres autonomes et salariés dont la durée de travail ne peut être prédéterminée

**Important :** En l'absence de disposition dans la convention collective autorisant le forfait jours, ce dispositif ne peut pas être mis en place.`,
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
#### Conditions d'indemnisation
- Ancienneté minimale : 1 an
- Pas de délai de carence
- Justificatifs nécessaires :
  * Certificat médical
  * Respect des obligations de déclaration

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

    'maternite-paternite': `### Comparaison avec le cadre légal

**Important :** La loi ne prévoit aucun maintien de salaire obligatoire pendant les congés de maternité et de paternité. Seules les indemnités journalières de la Sécurité sociale sont prévues par la loi.

Un maintien de salaire pendant ces périodes ne peut être prévu que par :
- La convention collective applicable
- Un accord d'entreprise
- Le contrat de travail
- Un usage d'entreprise

Il est donc essentiel de consulter la convention collective pour connaître les éventuelles dispositions plus favorables concernant le maintien de salaire pendant les congés de maternité et de paternité.`,
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
  },
  'remuneration': {
    'majoration-ferie': `### Comparaison avec le cadre légal

#### 1. Jours fériés légaux
**Jours fériés nationaux :**
- 1er janvier
- Lundi de Pâques
- 1er mai
- 8 mai
- Ascension
- Lundi de Pentecôte
- 14 juillet
- Assomption (15 août)
- Toussaint (1er novembre)
- 11 novembre
- 25 décembre

**Spécificité Alsace-Moselle :**
Deux jours fériés supplémentaires :
- 26 décembre
- Vendredi Saint

#### 2. Statut particulier du 1er mai
- Seul jour férié obligatoirement chômé et payé
- Si travaillé : majoration obligatoire de 100% (doublement du salaire)
- Non récupérable
- Applicable à tous les salariés, sans condition d'ancienneté

#### 3. Autres jours fériés
**Principe général :**
- Aucune majoration légale obligatoire (sauf 1er mai)
- Le chômage des jours fériés ne peut entraîner de perte de salaire pour les salariés :
  * Ayant au moins 3 mois d'ancienneté
  * Ayant travaillé le dernier jour précédant et le premier jour suivant le férié

**Si travaillé :**
- Aucune majoration légale obligatoire
- La majoration dépend :
  * De la convention collective
  * Des accords d'entreprise
  * Des usages

#### 4. Points importants
- La convention collective peut prévoir :
  * Des jours fériés supplémentaires
  * Des majorations salariales pour le travail les jours fériés
  * Des conditions plus favorables pour le maintien de salaire
  * Des règles spécifiques pour certains jours fériés

**Règle fondamentale :** En présence de dispositions conventionnelles plus favorables :
- Elles s'appliquent en priorité
- Le salarié bénéficie toujours de la disposition la plus avantageuse entre :
  * La convention collective
  * La loi
  * L'accord d'entreprise
  * Le contrat de travail

**Note :** L'employeur doit vérifier systématiquement les dispositions de la convention collective qui peuvent prévoir des majorations ou des compensations plus avantageuses que le minimum légal.`,
    'majoration-nuit': `### Comparaison avec le cadre légal

#### 1. Définition légale du travail de nuit
- Période de travail : 21h - 6h (sauf accord collectif différent)
- Travailleur de nuit si :
  * Minimum 3h dans la période de nuit au moins 2 fois par semaine
  * Ou 270h de travail de nuit sur 12 mois consécutifs

#### 2. Majoration salariale
**Important :** La loi n'impose PAS de majoration salariale spécifique pour le travail de nuit.

#### 3. Contreparties obligatoires
La loi impose uniquement :
- Un repos compensateur obligatoire
- Des contreparties (sans en fixer le montant) qui doivent être fixées par :
  * La convention collective
  * Un accord d'entreprise ou d'établissement
  * Un accord de branche étendu

#### 4. Types de contreparties possibles
- Compensation financière
- Repos compensateur
- Réduction du temps de travail
- Combinaison de ces différentes formes

#### 5. Durées maximales de travail
- Durée quotidienne : 8h maximum
- Durée hebdomadaire : 40h en moyenne sur 12 semaines consécutives

#### Points importants
- La convention collective DOIT prévoir des contreparties
- En présence de dispositions conventionnelles :
  * Elles s'appliquent en priorité
  * Elles peuvent être plus favorables en termes de :
    - Taux de majoration
    - Durée du repos compensateur
    - Conditions d'attribution
- Si la convention collective ne prévoit rien :
  * L'employeur doit négocier des contreparties
  * Un accord d'entreprise ou une décision unilatérale doit les fixer

**Note :** Même en l'absence de disposition conventionnelle sur la majoration, l'employeur doit obligatoirement prévoir des contreparties au travail de nuit, qu'elles soient financières ou sous forme de repos.`,
    'apprenti': `### Comparaison avec le cadre légal

#### 1. CONTRAT D'APPRENTISSAGE
**Rémunération minimale légale (en % du SMIC) :**

| Âge | 1ère année | 2ème année | 3ème année |
|-----|------------|------------|------------|
| 16-17 ans | 27% | 39% | 55% |
| 18-20 ans | 43% | 51% | 67% |
| 21-25 ans | 53% | 61% | 78% |
| 26 ans et + | 100% | 100% | 100% |

**Points importants :**
- Ces pourcentages sont des minimums légaux
- La convention collective peut prévoir des taux plus favorables
- Majoration de 15 points si :
  * Contrat préparant à un diplôme de même niveau
  * Expérience d'un an en apprentissage

#### 2. CONTRAT DE PROFESSIONNALISATION
**Rémunération minimale légale (en % du SMIC) :**

| Âge | < Bac Pro | ≥ Bac Pro |
|-----|-----------|-----------|
| < 21 ans | 55% | 65% |
| 21-25 ans | 70% | 80% |
| 26 ans et + | 100% ou 85% du minimum conventionnel |

**Points importants :**
- Base de calcul : SMIC ou minimum conventionnel si plus favorable
- La convention collective peut prévoir une rémunération plus élevée
- Le niveau de formation est celui acquis avant le contrat
- Possibilité de dispositions plus favorables par accord de branche

#### 3. STAGE
**Gratification minimale légale :**
- Obligatoire si durée > 2 mois (consécutifs ou non)
- Montant horaire : 15% du plafond horaire de la sécurité sociale
- Base de calcul : nombre d'heures de présence effective

**Conditions de versement :**
- Due à compter du 1er jour du 1er mois de stage
- Versée mensuellement
- Proratisée en cas de temps partiel

**Points importants :**
- Exonération de charges sociales dans la limite du minimum légal
- La convention collective peut prévoir une gratification plus élevée
- Les avantages en nature doivent être précisés dans la convention de stage
- Droits similaires aux salariés pour :
  * Accès au restaurant d'entreprise
  * Prise en charge des frais de transport
  * Accès aux activités sociales et culturelles

**Note :** La convention collective peut prévoir des dispositions plus favorables pour tous ces types de contrats, mais ne peut jamais prévoir de rémunération inférieure aux minimums légaux.`,
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