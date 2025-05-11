interface DispositifLegal {
  sectionType: string;
  content: string;
}

/**
 * Dispositifs légaux de référence
 * 
 * Ce fichier contient les textes légaux de référence pour différentes sections
 * des conventions collectives. Ces textes sont utilisés à titre de comparaison
 * avec les dispositions spécifiques des conventions.
 */
export const DISPOSITIFS_LEGAUX: Record<string, string> = {
  "embauche.delai-prevenance": `# Délai de Prévenance

| Ancienneté                | Initiateur | Délai    |
|---------------------------|------------|----------|
| Moins de 8 jours           | Employeur  | 24 heures|
| Entre 8 jours et 1 mois    | Employeur  | 48 heures|
| Entre 1 et 3 mois          | Employeur  | 2 semaines|
| Plus de 3 mois             | Employeur  | 1 mois   |
| Moins de 8 jours           | Salarié    | 24 heures|
| Plus de 8 jours            | Salarié    | 48 heures|`,

  "embauche.periode-essai": `# Période d'Essai

| Catégorie Professionnelle              | Durée Maximale Initiale | Durée Maximale de Renouvellement |
|----------------------------------------|-------------------------|-----------------------------------|
| Ouvriers et employés                   | 2 mois                  | 4 mois                            |
| Agents de maîtrise et techniciens      | 3 mois                  | 6 mois                            |
| Cadres                                  | 4 mois                  | 8 mois                            |

# Renouvellement de la Période d'Essai  

## 1. Conditions Légales  
- **Le renouvellement de la période d'essai n'est pas automatique.**  
- Il doit être prévu par :  
  - Le **contrat de travail** ou la **lettre d'engagement**.  
  - La **convention collective** ou un **accord de branche étendu**.  

## 2. Accord du Salarié  
- **Le salarié doit donner son accord exprès au renouvellement.**  
- Détails :  
  - **L'accord doit être écrit.**  
  - **La simple acceptation tacite est insuffisante.**  

## 3. Cas Particuliers  
- **Si aucune mention sur le renouvellement n'est prévue, seule la période initiale s'applique.**`,

  "temps-travail.duree-travail": `# Durée Légale Maximale de Travail  

## 1. Durée Maximale Hebdomadaire  
- Durée légale : 35 heures par semaine.  
- Durée maximale absolue :  
  - 48 heures sur une seule semaine.  
  - 44 heures en moyenne sur 12 semaines consécutives (ou 46 heures si un accord collectif le prévoit).  
- Des dérogations peuvent être accordées par l'administration sous certaines conditions, notamment pour des raisons exceptionnelles ou des secteurs spécifiques.  

## 2. Durée Maximale Journalière  
- Durée maximale par jour : 10 heures.  
- Dérogations possibles : jusqu'à 12 heures en cas d'accord collectif ou sur autorisation exceptionnelle.  
- Temps de pause :  
  - 20 minutes minimum après 6 heures de travail consécutives.  
  - Des adaptations peuvent exister selon les conventions collectives.  

## 3. Temps de Repos Obligatoires  
- Repos quotidien : 11 heures consécutives minimum entre deux journées de travail.  
- Repos hebdomadaire :  
  - 24 heures consécutives minimum, auxquelles s'ajoutent 11 heures de repos quotidien.  
  - Généralement fixé au dimanche, sauf exceptions prévues par convention collective ou accord spécifique.  

## 4. Cas Particuliers et Dérogations  
- Travail de nuit :  
  - Durée maximale de 8 heures consécutives, sauf accord spécifique.  
  - Majorations salariales et surveillance médicale obligatoire.  
- Travail en astreinte :  
  - Le temps d'intervention peut être comptabilisé comme temps de travail effectif selon les dispositions conventionnelles.  
- Travail des jeunes de moins de 18 ans :  
  - 8 heures maximum par jour et 35 heures par semaine.  
  - Interdiction du travail de nuit sauf dérogation spécifique.  

## 5. Adaptations Conventionnelles  
- Les conventions collectives peuvent prévoir des durées maximales différentes sous certaines conditions.  
- Certaines catégories professionnelles ou secteurs d'activité peuvent être soumis à des règles particulières adaptées à leurs contraintes.`,

  "temps-travail.heures-sup": `# Heures Supplémentaires  

## 1. Définition  
Les heures supplémentaires sont les heures effectuées au-delà de la durée légale du travail, fixée à **35 heures par semaine**. Elles ouvrent droit à une majoration de salaire ou à une compensation en repos.  

## 2. Seuil de déclenchement  
- **Heures normales** : Jusqu'à **35 heures par semaine**.  
- **Heures supplémentaires** : Toute heure travaillée au-delà de **35 heures** dans la semaine.  

## 3. Majoration des Heures Supplémentaires  
- **Taux de majoration légal** :  
  - **25 %** pour les **8 premières heures** (de la 36ᵉ à la 43ᵉ heure).  
  - **50 %** à partir de la **44ᵉ heure**.  
- Un **accord collectif** peut prévoir des taux différents, mais ceux-ci ne peuvent être inférieurs aux minimums légaux.  

## 4. Contrepartie en Repos  
- Les heures supplémentaires peuvent être compensées par un **repos équivalent**, en remplacement du paiement.  
- Le taux de repos compensateur est au minimum de :  
  - **25 %** pour les heures entre **36 et 43 heures**.  
  - **50 %** au-delà de **44 heures**.  
- Certains accords prévoient un **repos obligatoire au-delà d'un certain seuil** d'heures effectuées.  

## 5. Contingent Annuel  
- **Limite légale** : Un salarié ne peut pas effectuer plus de **220 heures supplémentaires par an** sans accord collectif spécifique.  
- En cas de dépassement, une **contrepartie obligatoire en repos** peut être imposée.`,

  "temps-travail.temps-partiel": `# Temps Partiel  

## 1. Définition  
Le travail à temps partiel concerne les salariés dont la durée du travail est inférieure à **35 heures par semaine**.  

## 2. Durée Minimale  
- **24 heures par semaine** minimum.  
- Des exceptions existent pour :  
  - Les étudiants de moins de 26 ans.  
  - Certains contrats spécifiques (CDD de courte durée, intérim, accords collectifs).  
  - Une demande écrite du salarié.  

## 3. Heures Complémentaires  
- Limitées à **10 % du temps contractuel** (possible jusqu'à **33 %** par accord collectif).  
- Majoration :  
  - **10 % dès la première heure complémentaire**.  
  - **25 % au-delà de la limite autorisée**.  

## 4. Organisation du Travail  
- Horaires définis dans le **contrat de travail**.  
- Modification possible avec un **préavis de 7 jours** (réduit à 3 jours par accord collectif).  
- Répartition des heures stable pour éviter les coupures excessives.`,

  "temps-travail.forfait-jours": `# Forfait Jours  

## 1. Définition  
Le forfait jours permet de fixer la durée du travail en **nombre de jours travaillés par an**, sans référence à un horaire hebdomadaire. Il est réservé aux **cadres autonomes** et à certaines catégories spécifiques prévues par la convention collective ou un accord collectif.  

## 2. Conditions d'Application  
- Doit être prévu par un **accord collectif** (convention collective, accord de branche ou d'entreprise).  
- **Salariés éligibles** :  
  - Cadres dont la nature des fonctions ne permet pas un décompte en heures.  
  - Certains salariés disposant d'une **autonomie dans l'organisation de leur emploi du temps**.  

## 3. Nombre de Jours Travaillés  
- **Forfait standard** : **218 jours par an**.  
- Possibilité de travailler **jusqu'à 235 jours** en renonçant à des jours de repos, avec une majoration de salaire.`,

  "conges.cet": `# Compte Épargne Temps (CET)  

## 1. Définition  
Le Compte Épargne Temps (CET) permet aux salariés d'accumuler des droits à congé rémunéré ou une rémunération différée en contrepartie de périodes travaillées non prises sous forme de repos.  

## 2. Mise en Place  
- Nécessite un **accord collectif** (convention collective, accord de branche ou d'entreprise).  
- Salariés **bénéficiaires** définis par l'accord (peut concerner tous les salariés ou certaines catégories).  

## 3. Alimentation du CET  
Le CET peut être alimenté par :  
- Des **jours de congé non pris** (dans la limite fixée par l'accord collectif).  
- Des **heures supplémentaires** converties en repos ou en monétisation.  
- Des **primes ou éléments de rémunération** (si l'accord le prévoit).  
- Des **jours de repos RTT**.  

## 4. Utilisation du CET  
Les droits accumulés peuvent être utilisés pour :  
- **Prendre un congé rémunéré** (congé sans solde, congé parental, fin de carrière…).  
- **Compléter sa rémunération** en transformant les jours en salaire.  
- **Alimenter un plan d'épargne retraite** (si l'accord le prévoit).`,

  "conges.conges-payes": `# Congés Payés  

## 1. Acquisition des Congés  
- Tout salarié acquiert **2,5 jours ouvrables par mois travaillé**, soit **30 jours ouvrables** (5 semaines) par an.  
- Certains accords collectifs prévoient une comptabilisation en **jours ouvrés**, soit **25 jours ouvrés** (5 semaines).  
- Les périodes d'absence assimilées à du temps de travail effectif pour l'acquisition des congés comprennent notamment :  
  - Les congés payés.  
  - Les absences pour maladie professionnelle ou accident du travail.  
  - Les congés maternité, paternité et adoption.  

## 2. Jours Ouvrables vs Jours Ouvrés  
- **Jours ouvrables** : Tous les jours de la semaine, sauf **dimanche et jours fériés chômés**.  
- **Jours ouvrés** : Correspondent aux **jours réellement travaillés** dans l'entreprise (généralement du lundi au vendredi).  
- Le mode de calcul des congés (ouvrables ou ouvrés) dépend de **la convention collective applicable**.  

## 3. Période de Référence  
- La période d'acquisition des congés est généralement **du 1ᵉʳ juin de l'année N-1 au 31 mai de l'année N**, sauf dispositions conventionnelles différentes.  

## 4. Prise des Congés  
- Les congés sont pris **sur demande du salarié**, validée par l'employeur en fonction des nécessités de service.  
- L'ordre et les dates des congés peuvent être fixés par **accord collectif ou par l'employeur**.  
- Un congé principal de **12 jours ouvrables consécutifs minimum** doit être pris entre **mai et octobre**, sauf dérogation.  

## 5. Indemnisation des Congés Payés  
- L'indemnité de congés payés est calculée selon **la règle du maintien de salaire ou la règle du dixième** :  
  - **Maintien de salaire** : le salarié perçoit sa rémunération habituelle pendant ses congés.  
  - **Règle du dixième** : l'indemnité correspond à **1/10ᵉ des rémunérations perçues au cours de la période de référence**.  
- L'employeur applique la méthode la plus avantageuse pour le salarié.  

## 6. Fractionnement et Report  
- Si le salarié ne prend pas **tous ses congés avant la fin de la période légale**, un **report** peut être prévu par convention collective ou accord d'entreprise.  
- Si le congé principal est pris en dehors de la période légale (mai-octobre), le salarié peut bénéficier de **jours de congés supplémentaires**.  

## 7. Cas Particuliers  
- **Congés supplémentaires** : Certaines conventions prévoient des jours supplémentaires en fonction de l'ancienneté, de la situation familiale ou de la pénibilité du poste.  
- **Congés payés et arrêt maladie** : Si le salarié tombe malade avant ou pendant ses congés, il peut demander un **report de ses jours non pris**.  
- **Congés en cas de rupture du contrat** : En cas de départ de l'entreprise, le salarié perçoit une **indemnité compensatrice** pour ses congés non pris.`,

  "conges.evenement-familial": `# Congés pour Événements Familiaux

| Événement                                                                 | Durée Minimale   | Rémunération | Justificatif                                        |
|---------------------------------------------------------------------------|------------------|--------------|-----------------------------------------------------|
| Mariage du salarié ou conclusion d'un PACS                                | 4 jours ouvrables| Maintenue     | Certificat de mariage ou attestation de PACS        |
| Mariage d'un enfant                                                        | 1 jour ouvrable  | Maintenue     | Certificat de mariage de l'enfant                   |
| Naissance ou adoption d'un enfant                                          | 3 jours ouvrables| Maintenue     | Acte de naissance ou document d'adoption            |
| Décès d'un enfant                                                          | 7 jours ouvrables (ou 12 jours si enfant < 25 ans)| Maintenue    | Certificat de décès                                 |
| Décès d'un enfant de moins de 25 ans ou d'une personne de moins de 25 ans à charge effective et permanente | 14 jours ouvrables| Maintenue | Certificat de décès et preuve de la charge effective |
| Décès du conjoint, partenaire PACS ou concubin                            | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès du père ou de la mère                                               | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès d'un frère ou d'une sœur                                            | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès du beau-père ou de la belle-mère                                    | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Annonce de la survenue d'un handicap chez un enfant                        | 2 jours ouvrables| Maintenue     | Attestation médicale                                |
| Décès d'un enfant de moins de 25 ans ou d'une personne de moins de 25 ans à charge effective et permanente (congé de deuil) | 8 jours | Maintenue | Certificat de décès et preuve de la charge effective |

## 1. Caractéristiques des Congés pour Événements Familiaux

- Ces congés sont **indépendants des congés payés** et ne peuvent être déduits de ceux-ci.
- Ils sont accordés **au moment de l'événement**.
- Le salarié doit justifier de l'événement en fournissant le document approprié.
- La rémunération est intégralement maintenue pendant ces absences.

## 2. Points Importants

- Ces durées sont des **minimums légaux** : les conventions collectives peuvent prévoir des dispositions plus favorables.
- Ces congés peuvent être pris **consécutivement ou non**, en accord avec l'employeur.
- Ces jours d'absence peuvent être pris avant ou après l'événement selon les situations.

## 3. Spécificités pour le Décès d'un Enfant

- En cas de décès d'un enfant de moins de 25 ans : **7 jours de congé** + **8 jours** de "congé de deuil"
- Le congé de deuil peut être fractionné dans les conditions fixées par décret, dans un délai d'un an à compter du décès de l'enfant.
- Une protection contre le licenciement est prévue pendant 13 semaines suivant le décès d'un enfant de moins de 25 ans.`,

  // Sections supplémentaires
  "protection-sociale.prevoyance": `# Cotisations Prévoyance pour Cadres

## Obligation Légale
Les employeurs doivent verser une cotisation de prévoyance pour leurs salariés cadres et assimilés. 

- **Taux** : 1,50 % de la tranche 1 du salaire (rémunération jusqu'au plafond de la Sécurité sociale).
- **Affectation prioritaire** : Au moins 0,76 % de cette cotisation doit être dédiée à la couverture du risque décès.

## Répartition de la Cotisation
- **Employeur** : 1,50 % à sa charge exclusive.

## Imposition
Les cotisations patronales finançant des garanties de prévoyance sont soumises à l'impôt sur le revenu du salarié.

## Mention sur le Bulletin de Paie
Les cotisations de prévoyance doivent figurer sur le bulletin de paie, généralement sous la rubrique **"Prévoyance cadre"**.`,

  "protection-sociale.retraite": `# AGIRC-ARRCO

## Description
Le régime AGIRC-ARRCO est un régime de retraite complémentaire obligatoire pour les salariés du secteur privé en France.

## Cotisations

### Tranches de Salaire

- **Tranche 1** (Part du salaire brut jusqu'au plafond mensuel de la Sécurité sociale - PMSS) :
  - **Plafond** : 1 PMSS
  - **Taux de cotisation** : 7.87 %
  - **Répartition** :
    - **Part salariale** : 3.15 %
    - **Part patronale** : 4.72 %

- **Tranche 2** (Part du salaire brut comprise entre 1 et 8 fois le PMSS) :
  - **Plafond** : 8 PMSS
  - **Taux de cotisation** : 21.59 %
  - **Répartition** :
    - **Part salariale** : 8.64 %
    - **Part patronale** : 12.95 %

## Acquisition de Points

Les cotisations versées sont converties en points de retraite.

- **Formule de calcul** :  
  Nombre de points = (Assiette des cotisations x Taux contractuel de cotisation) / Prix d'achat du point
- **Prix d'achat du point** : 19.9321`,

  "protection-sociale.mutuelle": `# Mutuelle d'Entreprise

## Obligation Générale

Depuis le 1ᵉʳ janvier 2016, tous les employeurs du secteur privé doivent proposer une couverture complémentaire santé collective à l'ensemble de leurs salariés, sans distinction de statut ou d'ancienneté.

- **Participation de l'employeur** : L'employeur doit financer au moins 50 % du montant de la cotisation, le reste étant à la charge du salarié.
- **Garanties minimales** : Le contrat doit respecter un socle de garanties minimales, incluant notamment :
  - La prise en charge intégrale du ticket modérateur pour les consultations, actes et prestations remboursables par l'assurance maladie.
  - Le forfait journalier hospitalier.

## Dispenses d'Adhésion

Certains salariés peuvent refuser l'adhésion à la mutuelle d'entreprise dans des situations spécifiques.

- **Couverture individuelle préexistante** : Le salarié bénéficie déjà d'une couverture individuelle jusqu'à son échéance.
- **Contrat à durée déterminée (CDD) ou contrat de mission** : La durée de couverture collective est inférieure à 3 mois et le salarié justifie d'une couverture individuelle responsable.
- **Salariés à temps partiel ou apprentis** : La cotisation représente au moins 10 % de leur rémunération brute.

## Choix de l'Organisme Assureur

L'entreprise a la liberté de choisir l'organisme assureur pour la mutuelle d'entreprise, même si un organisme est recommandé par la branche professionnelle.

- **Condition** : Le contrat souscrit doit respecter les garanties minimales légales et les obligations de financement.`,

  "absences.accident-travail": `# Maintien de Salaire en Cas d'Accident du Travail

## Conditions d'Éligibilité

- **Ancienneté minimale** : 1 an
- **Justificatifs** :
  - Certificat médical
  - Respect des obligations de déclaration

## Délai de Carence

- Aucun, versement dès le premier jour d'arrêt

## Indemnisation

- **1 à 5 ans d'ancienneté** :
  - Maintien à 90 % : 30 jours
  - Maintien à 66,66 % : 30 jours
- **6 à 10 ans d'ancienneté** :
  - Maintien à 90 % : 40 jours
  - Maintien à 66,66 % : 40 jours
- **11 à 15 ans d'ancienneté** :
  - Maintien à 90 % : 50 jours
  - Maintien à 66,66 % : 50 jours
- **16 à 20 ans d'ancienneté** :
  - Maintien à 90 % : 60 jours
  - Maintien à 66,66 % : 60 jours
- **21 à 25 ans d'ancienneté** :
  - Maintien à 90 % : 70 jours
  - Maintien à 66,66 % : 70 jours
- **26 à 30 ans d'ancienneté** :
  - Maintien à 90 % : 80 jours
  - Maintien à 66,66 % : 80 jours
- **31 ans et plus d'ancienneté** :
  - Maintien à 90 % : 90 jours
  - Maintien à 66,66 % : 90 jours`,

  "absences.maladie": `# Maintien de Salaire en Cas de Maladie Non Professionnelle

## Conditions d'Éligibilité

- **Ancienneté minimale** : 1 an
- **Justificatifs** :
  - Certificat médical transmis à l'employeur dans les 48 heures
  - Prise en charge par la Sécurité sociale
  - Soins reçus en France ou dans un État membre de l'Espace économique européen

## Délai de Carence

- 7 jours calendaires, sauf dispositions conventionnelles plus favorables

## Indemnisation

- **1 à 5 ans d'ancienneté** :
  - Maintien à 90 % : 30 jours
  - Maintien à 66,66 % : 30 jours
- **6 à 10 ans d'ancienneté** :
  - Maintien à 90 % : 40 jours
  - Maintien à 66,66 % : 40 jours
- **11 à 15 ans d'ancienneté** :
  - Maintien à 90 % : 50 jours
  - Maintien à 66,66 % : 50 jours
- **16 à 20 ans d'ancienneté** :
  - Maintien à 90 % : 60 jours
  - Maintien à 66,66 % : 60 jours
- **21 à 25 ans d'ancienneté** :
  - Maintien à 90 % : 70 jours
  - Maintien à 66,66 % : 70 jours
- **26 à 30 ans d'ancienneté** :
  - Maintien à 90 % : 80 jours
  - Maintien à 66,66 % : 80 jours
- **31 ans et plus d'ancienneté** :
  - Maintien à 90 % : 90 jours
  - Maintien à 66,66 % : 90 jours

## Remarques

- L'indemnisation complémentaire est versée par l'employeur.
- Des dispositions plus favorables peuvent être prévues par la convention collective ou un accord d'entreprise.`,

  "contrats.apprentissage": `# Apprentissage

## Description
Contrat de travail permettant à un jeune de suivre une formation en alternance en vue d'acquérir un diplôme d'État ou un titre à finalité professionnelle.

## Rémunération
- **Année 1** :
  - Moins de 18 ans : 27% du SMIC
  - 18-20 ans : 43% du SMIC
  - 21-25 ans : 53% du SMIC
  - 26 ans et plus : 100% du SMIC
- **Année 2** :
  - Moins de 18 ans : 39% du SMIC
  - 18-20 ans : 51% du SMIC
  - 21-25 ans : 61% du SMIC
  - 26 ans et plus : 100% du SMIC
- **Année 3** :
  - Moins de 18 ans : 55% du SMIC
  - 18-20 ans : 67% du SMIC
  - 21-25 ans : 78% du SMIC
  - 26 ans et plus : 100% du SMIC

## Base
Pourcentage du SMIC ou du salaire minimum conventionnel (SMC) si plus favorable.`,

  "contrats.professionnalisation": `# Contrat de Professionnalisation

## Description
Contrat de travail associant des périodes de formation et d'activité professionnelle en entreprise, visant à acquérir une qualification professionnelle reconnue.

## Rémunération
- **Niveau inférieur au Bac** :
  - Moins de 21 ans : 55% du SMIC
  - 21-25 ans : 70% du SMIC
  - 26 ans et plus : 100% du SMIC
- **Niveau supérieur ou égal au Bac** :
  - Moins de 21 ans : 65% du SMIC
  - 21-25 ans : 80% du SMIC
  - 26 ans et plus : 100% du SMIC

## Base
Pourcentage du SMIC ou 85% du SMC si plus favorable pour les 26 ans et plus.`,

  "contrats.stage": `# Stage

## Description
Période de formation pratique en entreprise pour les étudiants, intégrée à un cursus pédagogique.

## Rémunération
- **Indemnité minimale** : 656,85 €
- **Base** : 15% du plafond horaire de la sécurité sociale (PSS) fixé à 29€ en 2024.

## Notes
L'indemnité est obligatoire pour les stages de plus de deux mois et est exonérée d'impôt sur le revenu.`,

  "temps-travail.travail-dimanche": `# Travail Dominical

## Principes Généraux
Le repos hebdomadaire est en principe accordé le dimanche. Toutefois, des dérogations permettent le travail ce jour-là, avec des compensations variables.

## Secteurs et Conditions

### Commerce de Détail Alimentaire
- **Surface supérieure à 400m²** :
  - **Majoration** : 30%
  - **Base** : Pourcentage du salaire horaire pour les heures travaillées le dimanche jusqu'à 13h.
- **Surface inférieure ou égale à 400m²** :
  - **Majoration** : Variable selon les conventions collectives
  - **Base** : Pourcentage du salaire horaire pour les heures travaillées le dimanche.

### Autres Commerces de Détail
- **Dérogation par le Maire** :
  - **Majoration** : 100%
  - **Base** : Pourcentage du salaire horaire pour les dimanches travaillés sur autorisation municipale (jusqu'à 12 dimanches par an).
- **Zones Touristiques Commerciales** :
  - **Majoration** : Définie par accord collectif.
  - **Base** : Pourcentage du salaire horaire pour les dimanches travaillés dans les zones définies.

### Autres Secteurs
- **Dérogations Permanentes** :
  - **Majoration** : Non obligatoire
  - **Base** : Selon les conventions collectives ou accords d'entreprise.

## Notes
- Les majorations indiquées sont exprimées en pourcentage du salaire horaire de base.
- Les dispositions conventionnelles ou contractuelles peuvent prévoir des majorations plus favorables pour le salarié.
- Il est recommandé de consulter la convention collective applicable ou le contrat de travail pour connaître les conditions spécifiques.`,

  "temps-travail.jours-feries": `# Majoration des Jours Fériés

## 1er Mai
- **Obligation de Chômage** : Oui, sauf pour les établissements et services qui, en raison de la nature de leur activité, ne peuvent interrompre le travail.
- **Rémunération** :
  - **Salariés travaillant** : Doublement du salaire journalier.
  - **Salariés ne travaillant pas** : Maintien intégral du salaire sans condition d'ancienneté.
- **Référence Légale** : Article L3133-6 du Code du travail.

## Autres Jours Fériés
- **Obligation de Chômage** : Non, sauf dispositions conventionnelles ou décision de l'employeur.
- **Rémunération** :
  - **Salariés travaillant** : Pas de majoration légale prévue.
  - **Salariés ne travaillant pas** :
    - **Condition** : Ancienneté d'au moins 3 mois dans l'entreprise ou l'établissement.
    - **Maintien du salaire** : Oui, sans réduction de rémunération.
- **Référence Légale** : Article L3133-3 du Code du travail.`,

  "temps-travail.travail-nuit": `# Travail de Nuit

## Définition
Le travail de nuit désigne toute période de travail effectuée entre 21 heures et 6 heures du matin.

## Rémunération
- **Majoration** : 
  - **Pourcentage** : Variable selon les conventions collectives.
  - **Description** : La loi ne prévoit pas de majoration salariale spécifique pour le travail de nuit. Les majorations sont déterminées par les conventions collectives ou les accords d'entreprise.
  
- **Repos Compensateur** : 
  - **Description** : En l'absence de majoration salariale, un repos compensateur doit être accordé aux travailleurs de nuit.
  - **Durée** : Variable selon les accords collectifs ou, à défaut, déterminée par l'employeur.

## Exceptions
- **Secteurs Spécifiques** : Certains secteurs, tels que l'hôtellerie, la santé ou le transport, peuvent appliquer des règles particulières concernant le travail de nuit.
- **Conventions Collectives** : Il est essentiel de consulter la convention collective applicable ou les accords d'entreprise pour connaître les conditions spécifiques.`,

  "rupture.licenciement": `# Indemnité Légale de Licenciement

## Conditions d'Attribution
- **Ancienneté minimale** : 8 mois d'ancienneté ininterrompus dans l'entreprise.
- **Type de contrat** : Contrat à durée indéterminée (CDI).
- **Motif du licenciement** : Autre qu'une faute grave ou lourde.

## Calcul de l'Indemnité
- **Salaire de Référence** :
  - **Méthode 1** : Moyenne mensuelle des 12 derniers mois précédant le licenciement.
  - **Méthode 2** : Moyenne mensuelle des 3 derniers mois précédant le licenciement.
  - **Choix** : La méthode la plus avantageuse pour le salarié est retenue.
  
- **Montant** :
  - **Ancienneté jusqu'à 10 ans** : 1/4 de mois de salaire par année d'ancienneté.
  - **Ancienneté supérieure à 10 ans** : 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans.

## Modalités de Paiement
- **Moment du versement** : À la fin du préavis, que celui-ci soit exécuté ou non.

## Cumul avec d'autres Indemnités
- **Indemnités cumulables** : Indemnité compensatrice de préavis, indemnité compensatrice de congés payés.
- **Indemnités non cumulables** : Indemnité conventionnelle de licenciement, indemnité de départ ou de mise à la retraite.

## Exonérations Fiscales et Sociales
- **Impôt sur le revenu** : Exonération totale ou partielle selon le montant et les circonstances.
- **Cotisations sociales** : Exonération totale ou partielle selon le montant et les circonstances.`,

  "rupture.mise-retraite": `# Indemnité de Mise à la Retraite

## Conditions d'Attribution
- **Initiative** : Employeur.
- **Âge du salarié** :
  - **Proposition possible** : À partir de 67 ans.
  - **Opposition possible** : Jusqu'à 70 ans.
  - **Imposition possible** : À partir de 70 ans.

## Montant de l'Indemnité
- **Calcul de l'Indemnité Légale** :
  - **Ancienneté jusqu'à 10 ans** : 1/4 de mois de salaire par année d'ancienneté.
  - **Ancienneté supérieure à 10 ans** : 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans.

- **Salaire de Référence** :
  - **Méthode 1** : Moyenne mensuelle des 12 derniers mois précédant la notification.
  - **Méthode 2** : Moyenne mensuelle des 3 derniers mois précédant la notification.
  - **Choix** : La méthode la plus favorable pour le salarié est retenue.

- **Dispositions Conventionnelles** : Certaines conventions collectives ou accords d'entreprise peuvent prévoir des indemnités plus favorables.

## Modalités de Versement
- **Moment du versement** : À la fin du préavis, que celui-ci soit exécuté ou non.

## Régime Fiscal et Social
- **Impôt sur le revenu** : Exonération dans la limite du montant légal ou conventionnel.
- **Cotisations sociales** : Exonération dans la limite de deux fois le plafond annuel de la Sécurité sociale (PASS). Au-delà, soumise à cotisations.

## Remarques
- Il est essentiel de consulter la convention collective applicable ou le contrat de travail pour connaître les conditions spécifiques relatives à l'indemnité de mise à la retraite.
- Pour des informations détaillées et actualisées, il est recommandé de consulter les sources officielles ou de contacter les services compétents.`,

  "rupture.retraite": `# Indemnité de Départ Volontaire à la Retraite

## Conditions d'Attribution
- **Ancienneté minimale** : 10 ans d'ancienneté ininterrompue dans l'entreprise.
- **Initiative** : Salarié.
- **Demande de liquidation** : Le salarié doit avoir demandé la liquidation de sa pension de vieillesse.

## Montant de l'Indemnité
- **Calcul de l'Indemnité Légale** :
  - **Ancienneté de 10 à 15 ans** : 1/2 mois de salaire.
  - **Ancienneté de 15 à 20 ans** : 1 mois de salaire.
  - **Ancienneté de 20 à 30 ans** : 1,5 mois de salaire.
  - **Ancienneté de plus de 30 ans** : 2 mois de salaire.

- **Salaire de Référence** :
  - **Méthode 1** : Moyenne mensuelle des 12 derniers mois précédant le départ.
  - **Méthode 2** : Moyenne mensuelle des 3 derniers mois précédant le départ.
  - **Choix** : La méthode la plus avantageuse pour le salarié est retenue.

- **Dispositions Conventionnelles** : Certaines conventions collectives ou accords d'entreprise peuvent prévoir des indemnités plus favorables.

## Modalités de Versement
- **Moment du versement** : À la fin du préavis, que celui-ci soit exécuté ou non.

## Régime Fiscal et Social
- **Impôt sur le revenu** : Soumise à l'impôt sur le revenu.
- **Cotisations sociales** : Soumise aux cotisations sociales, CSG et CRDS.

## Remarques
- Il est essentiel de consulter la convention collective applicable ou le contrat de travail pour connaître les conditions spécifiques relatives à l'indemnité de départ volontaire à la retraite.
- Pour des informations détaillées et actualisées, il est recommandé de consulter les sources officielles ou de contacter les services compétents.`,

  "rupture.rupture-conventionnelle": `# Indemnité de Rupture Conventionnelle

## Conditions d'Attribution
- **Ancienneté minimale** : Aucune ancienneté minimale requise.
- **Type de contrat** : Contrat à durée indéterminée (CDI).
- **Accord des parties** : Consentement mutuel entre l'employeur et le salarié.

## Montant de l'Indemnité
- **Calcul de l'Indemnité Légale** :
  - **Ancienneté jusqu'à 10 ans** : 1/4 de mois de salaire par année d'ancienneté.
  - **Ancienneté supérieure à 10 ans** : 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans.

- **Salaire de Référence** :
  - **Méthode 1** : Moyenne mensuelle des 12 derniers mois précédant la rupture.
  - **Méthode 2** : Moyenne mensuelle des 3 derniers mois précédant la rupture.
  - **Choix** : La méthode la plus avantageuse pour le salarié est retenue.

- **Dispositions Conventionnelles** : Certaines conventions collectives ou accords d'entreprise peuvent prévoir des indemnités plus favorables.

## Modalités de Versement
- **Moment du versement** : À la date de cessation effective du contrat de travail.

## Régime Fiscal et Social
- **Impôt sur le revenu** : Exonération totale ou partielle selon le montant et les circonstances.
- **Cotisations sociales** : Exonération totale ou partielle selon le montant et les circonstances.

## Remarques
- Il est essentiel de consulter la convention collective applicable ou le contrat de travail pour connaître les conditions spécifiques relatives à l'indemnité de rupture conventionnelle.
- Pour des informations détaillées et actualisées, il est recommandé de consulter les sources officielles ou de contacter les services compétents.`,

  "rupture.preavis": `# Préavis de Licenciement

## Description
Durée du préavis à respecter par l'employeur lors du licenciement d'un salarié en CDI.

## Durées
- **Moins de 6 mois d'ancienneté** : Fixée par la convention collective ou les usages en vigueur.
- **Entre 6 mois et 2 ans d'ancienneté** : 1 mois.
- **Plus de 2 ans d'ancienneté** : 2 mois.

## Remarques
- Les conventions collectives ou le contrat de travail peuvent prévoir des durées de préavis plus favorables pour le salarié.
- En cas de faute grave ou lourde du salarié, le licenciement peut être prononcé sans préavis.

---

# Préavis de Démission

## Description
Durée du préavis à respecter par le salarié lors de sa démission d'un CDI.

## Durées
- **Toutes anciennetés** : Fixée par la convention collective, le contrat de travail ou les usages en vigueur.

## Remarques
- En l'absence de dispositions spécifiques, le préavis est déterminé par les usages pratiqués dans la localité et la profession.
- Le salarié peut être dispensé de préavis avec l'accord de l'employeur.`,

  "rupture.indemnite-precarite": `# Indemnité de Précarité  

## 1. Taux Légal  
- **10 %** de la rémunération brute totale perçue pendant le contrat.  

## 2. Contrats Concernés  
- CDD arrivant à son terme.  
- CDD conclu pour accroissement temporaire d'activité.  
- CDD de remplacement d'un salarié absent.  

## 3. Exceptions (Indemnité Non Due)  
- Embauche en **CDI** à l'issue du CDD.  
- CDD saisonnier ou contrat d'usage.  
- Contrats conclus avec des **jeunes en formation** (apprentissage, contrat de professionnalisation).  
- Rupture anticipée du CDD à l'initiative du salarié.  
- Refus d'un CDI aux mêmes conditions que le CDD.`
};

export const hasDispositifLegal = (sectionType: string): boolean => {
  return DISPOSITIFS_LEGAUX[sectionType] !== undefined;
};

export const getDispositifLegal = (sectionType: string): string => {
  return DISPOSITIFS_LEGAUX[sectionType] || "";
};

// Mappings pour les sections alternatives (gère les variations de noms)
export const SECTION_TYPE_MAPPINGS: Record<string, string> = {
  // Embauche
  "embauche.delai-prevenance": "embauche.delai-prevenance",
  "embauche.periode-essai": "embauche.periode-essai",
  
  // Temps de travail
  "temps-travail.duree-travail": "temps-travail.duree-travail",
  "temps-travail.heures-sup": "temps-travail.heures-sup",
  "temps-travail.temps-partiel": "temps-travail.temps-partiel",
  "temps-travail.forfait-jours": "temps-travail.forfait-jours",
  "temps-travail.amenagement-temps": "temps-travail.amenagement-temps",
  "temps-travail.travail-nuit": "temps-travail.travail-nuit",
  "temps-travail.travail-dimanche": "temps-travail.travail-dimanche",
  "temps-travail.jours-feries": "temps-travail.jours-feries",
  
  // Congés
  "conges.cet": "conges.cet",
  "conges.conges-payes": "conges.conges-payes",
  "conges.evenement-familial": "conges.evenement-familial",
  
  // Absences et maladie
  "absences.maladie": "absences.maladie",
  "absences.accident-travail": "absences.accident-travail",
  "absences.maternite-paternite": "absences.maternite-paternite",
  
  // Rupture
  "rupture.licenciement": "rupture.licenciement",
  "rupture.retraite": "rupture.retraite",
  "rupture.mise-retraite": "rupture.mise-retraite",
  "rupture.rupture-conventionnelle": "rupture.rupture-conventionnelle",
  "rupture.preavis": "rupture.preavis",
  "rupture.indemnite-precarite": "rupture.indemnite-precarite",
  
  // Contrats spécifiques
  "contrats.apprentissage": "contrats.apprentissage",
  "contrats.professionnalisation": "contrats.professionnalisation",
  "contrats.stage": "contrats.stage"
};