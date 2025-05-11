interface DispositifLegal {
  sectionType: string;
  content: string;
}

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
| Décès du conjoint, partenaire PACS ou concubin                            | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès du père ou de la mère                                               | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès d'un frère ou d'une sœur                                            | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Décès du beau-père ou de la belle-mère                                    | 3 jours ouvrables| Maintenue     | Certificat de décès                                 |
| Annonce de la survenue d'un handicap chez un enfant                        | 2 jours ouvrables| Maintenue     | Attestation médicale                                |

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
- Une protection contre le licenciement est prévue pendant 13 semaines suivant le décès d'un enfant de moins de 25 ans.`
};

export const hasDispositifLegal = (sectionType: string): boolean => {
  return DISPOSITIFS_LEGAUX[sectionType] !== undefined;
};

export const getDispositifLegal = (sectionType: string): string => {
  return DISPOSITIFS_LEGAUX[sectionType] || "";
};