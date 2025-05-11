/**
 * Données statiques des sections de conventions collectives
 * 
 * Ce fichier contient les sections préextraites au format JSON
 * directement intégrées dans le code pour éviter les problèmes
 * de base de données et d'importation
 */

export interface SectionData {
  conventionId: string;
  sectionType: string;
  content: string;
}

/**
 * Tableau contenant toutes les sections disponibles
 * Ce tableau sera rempli avec les données que l'utilisateur fournira
 */
export const sectionsData: SectionData[] = [
  // Les données des sections seront ajoutées ici
  // Format:
  // {
  //   conventionId: "1486",
  //   sectionType: "temps-travail.duree-travail",
  //   content: "Contenu markdown de la section..."
  // },

  // Exemple pour la période d'essai dans la boulangerie
  {
    conventionId: "843",
    sectionType: "embauche.periode-essai",
    content: `Période d'essai

Tableau : Période d'essai – Dispositions conventionnelles

| Catégorie                           | Durée Initiale         | Renouvellement | Durée Renouvellement |
|--------------------------------------|------------------------|----------------|----------------------|
| Ouvriers/Employés                   | 30 jours               | Non            | RAS                  |
| Cadres                              | Non mentionné          | Non mentionné  | Non mentionné        |
| Personnel d'encadrement (Cadre 1)   | 4 mois maximum         | Oui            | 4 mois maximum       |
| Personnel d'encadrement (Cadre 2)   | Non mentionné          | Non mentionné  | Non mentionné        |`
  },
  
  // Exemple pour la durée du travail dans la boulangerie
  {
    conventionId: "843",
    sectionType: "temps-travail.duree-travail",
    content: `**Durées du travail :**

* **Durée hebdomadaire de référence:** La durée du travail est fixée par l'employeur dans le cadre des lois et décrets en vigueur (Article 21).

* **Durée maximale hebdomadaire:**
    * Travailleurs de nuit : 40 heures sur une période quelconque de 12 semaines, 44 heures en cas de modulation (Article 23).
    * Temps partiel (entreprises de moins de 10 salariés) : La convention ne prévoit pas de durée maximale hebdomadaire, mais mentionne des durées minimales (6 heures pour le personnel de vente et de service). (Article 21)
    * Temps partiel (entreprises de 10 à 20 salariés) : 16 heures pour le personnel de vente et de service. (Article 21)

* **Durée maximale quotidienne:**
    * Travailleurs de nuit : 8 heures, pouvant exceptionnellement atteindre 10 heures  (Article 23).
    * Temps partiel : 10 heures (Article 21).


* **Repos quotidien minimum:** 11 heures entre la fin d'une journée de travail et le commencement d'une autre (Article - Annexe "Statut du personnel d'encadrement", Article 2).

* **Repos hebdomadaire minimum:**
    * Jeunes travailleurs de 16 ans et plus : deux jours consécutifs (Article 26).
    * Apprentis de 16 ans et plus : deux jours consécutifs (Article 38).
    * Général : La convention ne précise pas de durée minimale en dehors des jeunes travailleurs et apprentis.  L'article 1 mentionne une concertation pour l'amélioration de la situation sociale incluant potentiellement ce sujet.

* **Temps de pause minimum:** 20 minutes pour les travailleurs de nuit dont la période de travail effectif atteint 6 heures. Si le salarié n'est pas à disposition de l'employeur pendant cette pause, elle n'est pas considérée comme du travail effectif et n'est pas rémunérée (Article 23).

* **Dispositions spécifiques par catégorie:**
    * Cadres au forfait (Cadre 1) : 218 jours par an, incluant la journée de solidarité (Article - Annexe "Statut du personnel d'encadrement", Article 2).
    * Cadres dirigeants (Cadre 2) : Non soumis aux dispositions légales relatives à la durée du travail (Article - Annexe "Statut du personnel d'encadrement", Article 2).
    * Temps partiel :  Voir "Durée maximale hebdomadaire" et "Durée maximale quotidienne" ci-dessus. Des durées minimales et des dispositions sur les coupures sont prévues. (Article 21)
    * Jeunes travailleurs de 16 ans et plus : Peuvent travailler les jours fériés et bénéficient d'un repos hebdomadaire de deux jours consécutifs (Article 26).

* **Dérogations prévues:**
    * Durée minimale de travail à temps partiel (inférieure à 24h) : Possible selon plusieurs conditions, incluant une demande écrite et motivée du salarié, le statut d'étudiant, l'accord des associations intermédiaires ou des entreprises de travail temporaire d'insertion, ou une convention ou un accord de branche étendu (Article 21).
    * Temps partiel inférieur à 24h (entreprises de moins de 10 salariés et de 10 à 20 salariés): Durées minimales spécifiques, conditions sur la modification de la répartition de la durée du travail et délai de prévenance. (Article 21)

* **Mention de l'articulation avec des accords d'entreprise:** La convention ne mentionne pas l'articulation des durées du travail avec des accords d'entreprise, mais l'article 8.1 prévoit la transmission des accords d'entreprise à la CPPNI sur des sujets comme la durée et l'aménagement du temps de travail.`
  },
  
  // Exemple pour les heures supplémentaires dans la convention des bureaux d'études
  {
    conventionId: "1486", 
    sectionType: "temps-travail.heures-sup",
    content: `## Heures Supplémentaires

**Taux de Majoration:** La convention ne prévoit pas de taux de majoration spécifiques pour les heures supplémentaires, renvoyant implicitement à l'application des dispositions légales.

**Contingent Annuel:**

* **ETAM:** 130 heures supplémentaires par an. (Article 6.2, Accord de Branche du 22 juin 1999 relatif à la durée du travail, modifié par avenant du 1er avril 2014, étendu).
* **Ingénieurs et Cadres:** Le contingent réglementaire s'applique. (Article 6.2, Accord de Branche du 22 juin 1999 relatif à la durée du travail, modifié par avenant du 1er avril 2014, étendu).

**Modalités spécifiques liées au contingent:** La convention ne précise pas de modalités spécifiques liées au dépassement du contingent, à l'information du CSE ou autres.

**Repos Compensateur de Remplacement (RCR):**  L'accord de branche du 22 juin 1999 (modifié par avenant du 1er avril 2014, étendu) prévoit la possibilité de remplacer tout ou partie du paiement des heures supplémentaires et des majorations y afférentes par un repos équivalent, sur le fondement d'un accord d'entreprise. En l'absence d'organisations syndicales, le comité d'entreprise ou, à défaut, les délégués du personnel seront consultés, et l'employeur devra solliciter l'accord des salariés concernés. (Article 4.1). Les heures supplémentaires dont le paiement aura été remplacé par un repos équivalent ne s'imputent pas sur le contingent annuel.

**Contrepartie Obligatoire en Repos (COR):** La convention ne prévoit rien à ce sujet.

**Procédures de mise en œuvre:** La convention ne prévoit rien concernant l'information préalable ou un délai de prévenance pour les heures supplémentaires. L'accord de branche du 22 juin 1999 (modifié le 1er avril 2014) précise que les heures supplémentaires sont celles effectuées à la demande de l'employeur ou avec son accord, même implicite, ou lorsqu'il est établi que leur réalisation est rendue nécessaire par les tâches confiées au salarié. (Article 6.2)

**Possibilités de refus par le salarié:** La convention ne prévoit rien à ce sujet.

**Périodes de référence spécifiques:**  Dans le cas d'un aménagement du temps de travail sur l'année, les heures supplémentaires sont les heures effectuées sur l'année, au-delà de la durée du travail annuelle, légale ou conventionnelle, applicable dans l'entreprise. (Article 6.2, Avenant n°2 du 27 octobre 2022, étendu)

**Dispositions spécifiques par catégorie de personnel:**  Voir Contingent Annuel.

**Dispositions spécifiques régionales/départementales:** La convention ne prévoit rien à ce sujet.`
  },
  
  // Exemple pour la grille de rémunération dans la convention des bureaux d'études
  {
    conventionId: "1486",
    sectionType: "remuneration.grille",
    content: `# Grille des salaires minima hiérarchiques

## Grille applicable à partir du 1er janvier 2023

### ETAM (Employés, Techniciens et Agents de Maîtrise)

| Position | Coefficient | Salaire minimum mensuel (€) |
|----------|-------------|------------------------------|
| 1.1 | 220 | 1 682,50 |
| 1.2 | 230 | 1 696,86 |
| 1.3 | 240 | 1 725,59 |
| 2.1 | 250 | 1 754,32 |
| 2.2 | 275 | 1 811,78 |
| 2.3 | 310 | 1 969,71 |
| 3.1 | 355 | 2 127,63 |
| 3.2 | 400 | 2 285,55 |
| 3.3 | 450 | 2 443,48 |

### Ingénieurs et Cadres

| Position | Coefficient | Salaire minimum annuel (€) |
|----------|-------------|----------------------------|
| 1.1 | 95 | 27 600 |
| 1.2 | 100 | 31 200 |
| 2.1 | 105 | 34 800 |
| 2.2 | 115 | 38 400 |
| 2.3 | 130 | 42 000 |
| 3.1 | 150 | 46 800 |
| 3.2 | 170 | 54 000 |
| 3.3 | 210 | 64 800 |

## Notes importantes

- Les salaires minimaux sont exprimés pour une durée mensuelle de travail de 151,67 heures.
- Pour les cadres, les salaires minimaux sont exprimés en brut annuel pour un temps plein.
- Ces minima s'appliquent aux salariés à temps plein. Pour les salariés à temps partiel, ils sont calculés au prorata de leur temps de travail.`
  }
];

/**
 * Obtient une section par convention et type
 */
export function getSection(conventionId: string, sectionType: string): SectionData | null {
  return sectionsData.find(section => 
    section.conventionId === conventionId && 
    section.sectionType === sectionType
  ) || null;
}

/**
 * Obtient toutes les sections d'une convention
 */
export function getSectionsByConvention(conventionId: string): SectionData[] {
  return sectionsData.filter(section => section.conventionId === conventionId);
}

/**
 * Obtient la liste des types de sections disponibles pour une convention
 */
export function getSectionTypesByConvention(conventionId: string): string[] {
  return getSectionsByConvention(conventionId).map(section => section.sectionType);
}

/**
 * Obtient la liste des conventions ayant des sections
 */
export function getConventionsWithSections(): string[] {
  const conventions = new Set<string>();
  sectionsData.forEach(section => conventions.add(section.conventionId));
  return Array.from(conventions);
}