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
  'conges': {
    'cet': `Analyse la convention collective pour récupérer toutes les informations relatives au Compte Épargne Temps (CET).

1. Extraction des informations sur la mise en place :
   - Modalités d'ouverture du CET
   - Salariés bénéficiaires
   - Conditions d'ancienneté éventuelles
   - Formalités d'adhésion

2. Alimentation du CET :
   - Éléments pouvant être épargnés :
     • Congés payés
     • RTT
     • Repos compensateurs
     • Primes et éléments de salaire
     • Autres éléments
   - Plafonds d'épargne éventuels
   - Périodicité des versements

3. Utilisation du CET :
   - Conditions d'utilisation
   - Délais de prévenance
   - Modes d'utilisation possibles :
     • Congés
     • Monétisation
     • Formation
     • Autres

4. Gestion et garanties :
   - Modalités de tenue du compte
   - Valorisation des droits
   - Information du salarié
   - Garanties financières si mentionnées

5. Transfert et clôture :
   - Cas de transfert
   - Conditions de clôture
   - Modalités de liquidation

FORMAT DE PRÉSENTATION :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Conservation de la structure originale des dispositions
- Indication des éventuels renvois à des accords d'entreprise

Si la convention collective ne contient aucune disposition sur le CET : indiquer "RAS"`,
    'conges-payes': `Récupère toutes les dispositions concernant les congés payés dans la convention collective.

1. Extraction des règles générales sur les congés payés :
   - Durée des congés (légaux et supplémentaires)
   - Période de référence
   - Période de prise des congés
   - Ordre des départs

2. Modalités d'acquisition :
   - Règles spécifiques d'acquisition
   - Périodes assimilées à du travail effectif
   - Cas particuliers d'acquisition
   - Dispositions pour les temps partiels

3. Organisation des congés :
   - Règles de fractionnement
   - Délais de prévenance
   - Modification des dates
   - Fermeture de l'entreprise

4. Situations particulières :
   - Maladie pendant les congés
   - Congés et préavis
   - Report des congés
   - Cas des nouveaux embauchés

5. Indemnisation :
   - Mode de calcul de l'indemnité
   - Période de versement
   - Cas particuliers d'indemnisation

6. Dispositions spécifiques :
   - Congés supplémentaires (ancienneté, âge, etc.)
   - Congés non pris
   - Règles prioritaires

FORMAT DE PRÉSENTATION :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Organisation thématique sans modification du contenu
- Conservation des notes et commentaires d'origine

Si la convention collective ne contient aucune disposition sur les congés payés : indiquer "RAS"`,
    'evenement-familial': `Analyse la convention collective pour récupérer toutes les dispositions relatives aux congés pour événements familiaux.

1. Extraire exactement tous les congés prévus pour :
   - Mariage/PACS
   - Naissance/Adoption
   - Décès
   - Autres événements mentionnés

2. Pour chaque type de congé, reprendre EXACTEMENT :
   - Le texte complet tel qu'écrit dans la convention
   - La durée précise indiquée
   - La mention explicite : jours ouvrables/ouvrés/calendaires
   - Si aucune précision sur le type de jours : le signaler
   - Les conditions d'attribution
   - Les modalités de prise
   - Tout commentaire ou note même en apparence mineure

3. Présentation en tableau :
   - Événement | Durée exacte + type de jours | Conditions et modalités
   - Copier-coller intégral du texte conventionnel
   - Référence précise des articles
   - Conservation de toutes les notes et mentions

4. IMPORTANT :
   - Ne rien reformuler
   - Reprendre tous les détails, même ceux semblant mineurs
   - Si le type de jour n'est pas précisé : l'indiquer clairement
   - Reporter toute mention particulière sur le décompte des jours

Si la convention collective ne contient aucune disposition sur les congés pour événements familiaux : indiquer "RAS"`
  },
  'informations-generales': {
    'default': `Récupère et organise toutes les informations situées en haut des fichiers de la convention collective, en suivant la structure ci-dessous.

1. Informations d'identification :
   - Nom exact de la convention collective
   - Numéro IDCC
   - Numéro de brochure
   - Code NAF/APE (si mentionné)

2. Dates clés :
   - Date de signature
   - Date de publication au Journal Officiel
   - Dates des derniers avenants
   - Date d'extension (si applicable)

3. Organisations :
   A) Organisations syndicales signataires :
      - Liste complète avec noms exacts
   B) Organisations patronales signataires :
      - Liste complète avec noms exacts

4. Champ d'application :
   A) Géographique :
      - Territoire couvert
      - Exceptions éventuelles
   B) Professionnel :
      - Secteurs d'activité concernés
      - Entreprises visées
      - Exclusions spécifiques

5. Avenants et modifications :
   - Liste chronologique des derniers avenants
   - Objet de chaque avenant
   - Date de signature et d'effet

6. Extensions et élargissements :
   - Références des arrêtés d'extension
   - Dates de publication au JO
   - Modifications éventuelles du champ d'application

RÈGLES DE PRÉSENTATION :
1. Créer des sections distinctes pour chaque type d'information
2. Conserver la formulation exacte du texte original
3. Indiquer les références précises des articles
4. Préciser pour chaque information si elle provient :
   - Du texte de base
   - D'un avenant
   - D'un accord complémentaire

Si une information n'est pas mentionnée dans la convention, indiquer explicitement "Non précisé dans la convention".`,
    'generale': `Récupère et organise toutes les informations situées en haut des fichiers de la convention collective, en suivant la structure ci-dessous.

1. Informations d'identification :
   - Nom exact de la convention collective
   - Numéro IDCC
   - Numéro de brochure
   - Code NAF/APE (si mentionné)

2. Dates clés :
   - Date de signature
   - Date de publication au Journal Officiel
   - Dates des derniers avenants
   - Date d'extension (si applicable)

3. Organisations :
   A) Organisations syndicales signataires :
      - Liste complète avec noms exacts
   B) Organisations patronales signataires :
      - Liste complète avec noms exacts

4. Champ d'application :
   A) Géographique :
      - Territoire couvert
      - Exceptions éventuelles
   B) Professionnel :
      - Secteurs d'activité concernés
      - Entreprises visées
      - Exclusions spécifiques

5. Avenants et modifications :
   - Liste chronologique des derniers avenants
   - Objet de chaque avenant
   - Date de signature et d'effet

6. Extensions et élargissements :
   - Références des arrêtés d'extension
   - Dates de publication au JO
   - Modifications éventuelles du champ d'application

RÈGLES DE PRÉSENTATION :
1. Créer des sections distinctes pour chaque type d'information
2. Conserver la formulation exacte du texte original
3. Indiquer les références précises des articles
4. Préciser pour chaque information si elle provient :
   - Du texte de base
   - D'un avenant
   - D'un accord complémentaire

Si une information n'est pas mentionnée dans la convention, indiquer explicitement "Non précisé dans la convention".`
  },
  'embauche': {
    'delai-prevenance': `Récupère toutes les informations relatives au délai de prévenance en cas de rupture de la période d'essai dans la convention collective.

1. Extraire précisément :
   - Les délais de prévenance spécifiques pour l'employeur :
     • Par catégorie professionnelle si différencié
     • Selon la durée de présence dans l'entreprise
     • Selon la durée initiale de la période d'essai

   - Les délais de prévenance spécifiques pour le salarié :
     • Par catégorie professionnelle si différencié
     • Selon la durée de présence
     • Toute condition particulière mentionnée

2. Pour chaque délai mentionné, préciser :
   - La durée exacte du délai
   - Le point de départ du délai
   - Les modalités de notification
   - Les éventuelles exceptions ou cas particuliers

3. Identifier toute mention concernant :
   - Le non-respect du délai de prévenance
   - Les dispenses éventuelles
   - Le calcul de la fin du délai

Présentation requise :
- Format tableau à double entrée (Employeur/Salarié)
- Copier-coller du texte exact de la convention
- Référence précise des articles concernés
- Chronologie des délais si plusieurs existent

Si la convention collective ne contient aucune disposition sur les délais de prévenance : indiquer "RAS"`,
    'duree-travail': `Cherche toutes les informations relatives à la durée du temps de travail dans la convention collective.

1. Extraire les dispositions concernant :
   a) Durées du travail :
      - Durée hebdomadaire conventionnelle
      - Durée quotidienne maximale
      - Durée mensuelle de référence
      - Volume annuel si mentionné

   b) Organisation du temps de travail :
      - Répartition des horaires
      - Cycles de travail éventuels
      - Modulation/annualisation
      - Forfaits (heures/jours)

   c) Temps de pause et repos :
      - Pauses quotidiennes
      - Repos entre deux journées
      - Repos hebdomadaire
      - Durée minimale de travail par séquence

   d) Heures supplémentaires :
      - Contingent conventionnel
      - Modalités de décompte
      - Repos compensateur conventionnel

   e) Temps partiel si mentionné :
      - Durée minimale
      - Modalités d'organisation
      - Coupures et répartition

   f) Conditions d'application du forfait jours :
      - Catégories de salariés éligibles
      - Nombre de jours
      - Modalités de décompte
      - Suivi de la charge de travail

2. Pour chaque disposition :
   - Copier-coller le texte exact de la convention
   - Indiquer la référence précise des articles
   - Mentionner les éventuels avenants modificatifs

3. Format de présentation :
   - Organiser par thème (utiliser les catégories ci-dessus)
   - Créer des sous-sections claires
   - Séparer les dispositions générales des cas particuliers

Si la convention collective ne contient aucune disposition sur le temps de travail : indiquer "RAS"`,
    'periode-essai': `EXTRACTION DES INFORMATIONS SUR LA PÉRIODE D'ESSAI

Étape 1 : Récupère toutes les informations disponibles concernant la période d'essai dans la convention collective :

A. Durées initiales :
   - Par catégorie professionnelle/classification
   - Par type de contrat (CDI/CDD si précisé)
   - Pour les postes spécifiques si mentionnés

B. Conditions de renouvellement :
   - Durée du renouvellement possible
   - Modalités de mise en œuvre
   - Formalisme requis
   - Délai pour proposer le renouvellement

C. Cas particuliers mentionnés :
   - Absences pendant la période d'essai
   - Embauche après stage/CDD/intérim
   - Postes avec conditions spécifiques

FORMAT :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Structure en tableau par catégorie
- Conservation des notes et commentaires

Étape 2 : Vérification d'applicabilité
- Rechercher spécifiquement toute mention/commentaire/note indiquant :
  • La non-applicabilité des durées conventionnelles
  • Le renvoi aux dispositions légales
  • Des réserves ou conditions particulières d'application
  • Des exclusions de certaines catégories

SI AUCUNE MENTION DE NON-APPLICABILITÉ :
→ S'arrêter après l'étape 1 et présenter uniquement le tableau des dispositions conventionnelles

Étape 3 : En cas de mention de non-applicabilité
→ Copier exactement le message indiquant la non-applicabilité
→ Indiquer en gras : "⚠️ ATTENTION : Veuillez consulter les informations ci-dessous pour connaître les dispositions applicables"

PRÉSENTATION FINALE :
- Structure chronologique des étapes
- Mise en évidence des points d'alerte
- Conservation de la formulation exacte`,
    'cet': `Analyse la convention collective pour récupérer toutes les informations relatives au Compte Épargne Temps (CET).

1. Extraction des informations sur la mise en place :
   - Modalités d'ouverture du CET
   - Salariés bénéficiaires
   - Conditions d'ancienneté éventuelles
   - Formalités d'adhésion

2. Alimentation du CET :
   - Éléments pouvant être épargnés :
     • Congés payés
     • RTT
     • Repos compensateurs
     • Primes et éléments de salaire
     • Autres éléments
   - Plafonds d'épargne éventuels
   - Périodicité des versements

3. Utilisation du CET :
   - Conditions d'utilisation
   - Délais de prévenance
   - Modes d'utilisation possibles :
     • Congés
     • Monétisation
     • Formation
     • Autres

4. Gestion et garanties :
   - Modalités de tenue du compte
   - Valorisation des droits
   - Information du salarié
   - Garanties financières si mentionnées

5. Transfert et clôture :
   - Cas de transfert
   - Conditions de clôture
   - Modalités de liquidation

FORMAT DE PRÉSENTATION :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Conservation de la structure originale des dispositions
- Indication des éventuels renvois à des accords d'entreprise

Si la convention collective ne contient aucune disposition sur le CET : indiquer "RAS"`,
    'conges-payes': `Récupère toutes les dispositions concernant les congés payés dans la convention collective.

1. Extraction des règles générales sur les congés payés :
   - Durée des congés (légaux et supplémentaires)
   - Période de référence
   - Période de prise des congés
   - Ordre des départs

2. Modalités d'acquisition :
   - Règles spécifiques d'acquisition
   - Périodes assimilées à du travail effectif
   - Cas particuliers d'acquisition
   - Dispositions pour les temps partiels

3. Organisation des congés :
   - Règles de fractionnement
   - Délais de prévenance
   - Modification des dates
   - Fermeture de l'entreprise

4. Situations particulières :
   - Maladie pendant les congés
   - Congés et préavis
   - Report des congés
   - Cas des nouveaux embauchés

5. Indemnisation :
   - Mode de calcul de l'indemnité
   - Période de versement
   - Cas particuliers d'indemnisation

6. Dispositions spécifiques :
   - Congés supplémentaires (ancienneté, âge, etc.)
   - Congés non pris
   - Règles prioritaires

FORMAT DE PRÉSENTATION :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Organisation thématique sans modification du contenu
- Conservation des notes et commentaires d'origine

Si la convention collective ne contient aucune disposition sur les congés payés : indiquer "RAS"`,
    'evenement-familial': `Analyse la convention collective pour récupérer toutes les dispositions relatives aux congés pour événements familiaux.

1. Extraire exactement tous les congés prévus pour :
   - Mariage/PACS
   - Naissance/Adoption
   - Décès
   - Autres événements mentionnés

2. Pour chaque type de congé, reprendre EXACTEMENT :
   - Le texte complet tel qu'écrit dans la convention
   - La durée précise indiquée
   - La mention explicite : jours ouvrables/ouvrés/calendaires
   - Si aucune précision sur le type de jours : le signaler
   - Les conditions d'attribution
   - Les modalités de prise
   - Tout commentaire ou note même en apparence mineure

3. Présentation en tableau :
   - Événement | Durée exacte + type de jours | Conditions et modalités
   - Copier-coller intégral du texte conventionnel
   - Référence précise des articles
   - Conservation de toutes les notes et mentions

4. IMPORTANT :
   - Ne rien reformuler
   - Reprendre tous les détails, même ceux semblant mineurs
   - Si le type de jour n'est pas précisé : l'indiquer clairement
   - Reporter toute mention particulière sur le décompte des jours

Si la convention collective ne contient aucune disposition sur les congés pour événements familiaux : indiquer "RAS"`
  },
  'classification': {
    'classification-details': `Récupère toutes les informations concernant les classifications dans la convention collective.

1. Extraire EXACTEMENT :
   A) La structure générale de classification :
      - Tous les niveaux/échelons
      - Coefficients ou indices associés
      - Catégories professionnelles
      - Filières si existantes

   B) Pour chaque niveau/position :
      - Description exacte du poste
      - Critères de classification
      - Compétences requises
      - Niveaux de responsabilité
      - TOUT commentaire associé

   C) Modalités de mise en œuvre :
      - Règles de positionnement
      - Évolution/progression
      - Périodes probatoires si mentionnées
      - Toute note explicative

2. Format de présentation :
   COPIER-COLLER STRICT :
   - Tableaux tels que présentés dans la CCN
   - Grilles de classification complètes
   - Définitions de postes
   - Notes et commentaires, même mineurs
   - TOUTE annexe liée aux classifications

3. Références à inclure :
   - Numéros d'articles exacts
   - Renvois aux annexes
   - Numéros de page si mentionnés
   - Dates des avenants modificatifs

Ne rien reformuler, ne rien réorganiser : présenter les informations telles qu'elles apparaissent dans le texte.

Si la convention collective ne contient aucune disposition sur les classifications : indiquer "RAS"`
  },
  'cotisations': {
    'prevoyance': `Récupère toutes les informations relatives aux cotisations pour la prévoyance dans la convention collective.

1. Extraire EXACTEMENT :
   A) Organismes de prévoyance :
      - Nom des organismes désignés
      - Date de désignation
      - Clause de migration/réexamen si existante
      - Organisme gestionnaire si différent

   B) Cotisations (COPIER-COLLER EXACT) :
      - Taux global
      - Répartition employeur/salarié
      - Base ou assiette de cotisation
      - Tranches de salaire concernées
      - Taux par garantie si détaillé

   C) Population couverte :
      - Catégories de personnel concernées
      - Conditions d'affiliation
      - Cas de dispenses si mentionnés
      - Cas particuliers (temps partiel, suspension contrat...)

   D) Garanties mentionnées avec les taux :
      - Détail des garanties associées aux cotisations
      - Niveaux de prestations si précisés
      - Conditions particulières

2. Informations complémentaires :
   - Date d'effet du régime
   - Modalités de révision des taux
   - Périodicité des cotisations
   - Portabilité si mentionnée

3. Format de présentation :
   - Copier-coller exact des tableaux de cotisations
   - Conservation des notes et renvois
   - Référence précise des articles et avenants
   - Reprendre toute mention même mineure sur les cotisations

Si la convention collective ne contient aucune disposition sur la prévoyance : indiquer "RAS"`,
    'retraite': `Cherche toutes les informations relatives aux cotisations pour la retraite dans la convention collective.

1. Extraire EXACTEMENT :
   A) Retraite complémentaire :
      - Organismes désignés (AGIRC-ARRCO ou autres)
      - Taux contractuels par tranche
      - Répartition employeur/salarié
      - Base ou assiette de calcul

   B) Spécificités par catégorie :
      - Taux par catégorie professionnelle
      - Tranches de salaire concernées
      - Particularités cadres/non cadres
      - Taux supplémentaires si prévus

   C) Informations techniques :
      - Dates d'application
      - Modalités de versement
      - Conditions particulières
      - Cas spécifiques mentionnés

2. Présentation :
   - Copier-coller exact des tableaux de taux
   - Reprendre intégralement les répartitions
   - Conserver toutes les notes techniques
   - Reporter les références d'articles exactes

Si la convention collective ne contient aucune disposition sur la retraite : indiquer "RAS"`,
    'mutuelle': `Récupère toutes les informations concernant les cotisations pour la mutuelle dans la convention collective.

1. Extraire EXACTEMENT :
   A) Organismes :
      - Noms des organismes recommandés/désignés
      - Date de désignation/recommandation
      - Gestionnaire des prestations si différent
      - Durée de la désignation si précisée

   B) Cotisations (COPIER-COLLER EXACT) :
      - Taux global de cotisation
      - Répartition employeur/salarié
      - Base de calcul des cotisations
      - Montants forfaitaires si prévus
      - Tarifs par composition familiale

   C) Régime frais de santé :
      - Structure des cotisations (isolé/famille)
      - Options si prévues
      - Régimes facultatifs si existants
      - Surcoûtés éventuels

   D) Conditions d'application :
      - Personnel concerné
      - Dispenses possibles
      - Cas particuliers (temps partiel...)
      - Date d'effet du régime

2. Format de présentation :
   - Copier-coller des tableaux de cotisations
   - Référence précise des articles et avenants
   - Conservation de toutes les notes
   - Reprise de tous les commentaires

Si la convention collective ne contient aucune disposition sur la mutuelle : indiquer "RAS"`,
  },
  'maintien-salaire': {
    'accident-travail': `Récupère toutes les informations concernant le maintien du salaire en cas d'accident du travail dans la convention collective.

1. Extraire EXACTEMENT tout ce qui concerne :
   A) Carence :
      - Existence ou non d'un délai de carence
      - Durée exacte si prévue
      - Conditions d'application de la carence
      - Cas de suppression de la carence
      - Application en cas de rechute

   B) Salaire de référence :
      - Définition exacte du salaire de référence
      - Éléments inclus dans le calcul
      - Éléments exclus du calcul
      - Période de référence
      - Cas particuliers (variables, primes, etc.)

   C) Indemnisation :
      - Montant ou pourcentage par période
      - Durée totale d'indemnisation
      - Fractionnement éventuel
      - Modalités de versement

   D) IJSS :
      - Mode de prise en compte
      - Système de déduction
      - Règles de coordination
      - Subrogation si prévue

2. Présentation :
   - Copier-coller INTÉGRAL de chaque disposition
   - Conservation de toute mention sur le calcul
   - Maintien des exemples si fournis
   - Report des formules de calcul exactes
   - Référence précise des articles
   - Reprise de TOUS les cas particuliers
   - Conservation des renvois et notes de bas de page

Si la convention collective ne contient aucune disposition sur le maintien de salaire en cas d'accident du travail : indiquer "RAS"`,
    'maladie': `Récupère toutes les informations concernant le maintien du salaire en cas d'arrêt maladie dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'ouverture des droits :
      - Ancienneté requise
      - Justificatifs demandés
      - Délais pour fournir les justificatifs
      - Contre-visite si prévue

   B) Carence :
      - Nombre exact de jours de carence
      - Application selon ancienneté
      - Suppression éventuelle de carence
      - Cas particuliers de carence
      - Application en cas d'arrêts successifs

   C) Salaire de référence :
      - Définition exacte de l'assiette
      - Éléments de salaire inclus
      - Éléments exclus
      - Période de référence pour le calcul
      - Cas des salaires variables

   D) Indemnisation :
      - Durée totale 
      - Pourcentage par période
      - Fractionnement de l'indemnisation
      - Reconstitution des droits
      - Plusieurs arrêts dans l'année

   E) IJSS :
      - Mode de prise en compte
      - Système de déduction
      - Subrogation si prévue
      - Règles en cas de non perception

2. Présentation :
   - Copier-coller exact du texte conventionnel
   - Maintien des tableaux d'origine
   - Conservation de tous les exemples
   - Report des formules de calcul
   - Référence précise des articles
   - Reprise intégrale des notes et renvois

Si la convention collective ne contient aucune disposition sur le maintien de salaire en cas de maladie : indiquer "RAS"`,
    'maternite-paternite': `Récupère toutes les informations concernant le maintien du salaire en cas de maternité ou paternité dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'ouverture des droits :
      - Ancienneté requise si prévue
      - Justificatifs à fournir
      - Délais de prévenance
      - Conditions spécifiques maternité/paternité

   B) Maternité :
      - Durée du maintien de salaire
      - Taux de maintien
      - Période prénatale
      - Période postnatale
      - Pathologies/Grossesse difficile
      - Cas d'adoption

   C) Paternité :
      - Durée du maintien
      - Taux de maintien
      - Conditions spécifiques
      - Délais de prise

   D) Salaire de référence :
      - Définition exacte de l'assiette
      - Éléments inclus/exclus
      - Période de référence
      - Cas des variables/primes

   E) IJSS :
      - Modalités de prise en compte
      - Système de déduction
      - Subrogation si prévue
      - Cas particuliers

2. Présentation :
   - Copier-coller intégral du texte
   - Conservation des tableaux
   - Maintien de toutes les notes
   - Référence précise des articles
   - Report de tous les cas particuliers

Si la convention collective ne contient aucune disposition sur le maintien de salaire en cas de maternité/paternité : indiquer "RAS"`,
  },
  'remuneration': {
    'apprenti': `Analyse la convention collective pour récupérer toutes les dispositions concernant la rémunération des alternants et stagiaires.

1. APPRENTISSAGE :
   A) Rémunération :
      - Taux/montants par âge
      - Taux/montants par année d'exécution
      - Majoration éventuelle vs légal
      - Base de calcul utilisée

   B) Avantages spécifiques :
      - Primes particulières
      - Treizième mois si prévu
      - Autres avantages monétaires
      - Avantages en nature

2. CONTRATS DE PROFESSIONNALISATION :
   A) Rémunération :
      - Taux/montants par âge
      - Taux/montants par niveau de formation
      - Majorations conventionnelles
      - Base de calcul

   B) Dispositions particulières :
      - Primes spécifiques
      - Avantages complémentaires
      - Conditions particulières

3. STAGIAIRES :
   A) Gratification :
      - Montants prévus
      - Base de calcul
      - Conditions d'attribution
      - Durée d'application

   B) Avantages annexes :
      - Frais de transport
      - Tickets restaurant
      - Autres avantages

4. PRÉCISIONS À EXTRAIRE :
   - Variations géographiques
   - Évolution selon ancienneté
   - Dispositions spécifiques par métier
   - Modalités de versement

Format :
- Copier-coller exact du texte conventionnel
- Référence précise des articles
- Conservation de toutes les notes et commentaires
- Maintien des tableaux d'origine

Si aucune disposition n'existe pour une ou plusieurs catégories : indiquer "RAS" pour chacune`,
    'prime': `Récupère toutes les informations relatives aux primes dans la convention collective.

1. Pour CHAQUE prime mentionnée, extraire EXACTEMENT :
   A) Identification de la prime :
      - Nom exact de la prime
      - Nature/Type
      - Base légale (article précis)
      - Date de mise en place ou avenant

   B) Calcul et montant :
      - Base de calcul précise
      - Taux ou montant exact
      - Périodicité de versement
      - Modalités de calcul détaillées

   C) Conditions d'attribution :
      - Ancienneté requise
      - Catégories concernées
      - Proratisation temps partiel
      - Conditions particulières

   D) Spécificités :
      - Période de référence
      - Modalités de versement
      - Cas de suspension
      - Régime social si précisé

2. Types de primes à rechercher (liste non limitative) :
   - Prime d'ancienneté
   - Prime de 13ème mois
   - Prime de vacances
   - Prime de rendement
   - Primes exceptionnelles
   - Gratifications
   - Toute autre prime mentionnée

3. Format de présentation :
   - Copier-coller exact du texte
   - Conservation des formules de calcul
   - Maintien des tableaux et barèmes
   - Report de toutes les notes et exceptions
   - Référence précise des articles

Si la convention collective ne contient aucune disposition sur les primes : indiquer "RAS"`,
    'grille': `Extrais la grille complète des rémunérations de la convention collective.

1. STRUCTURE GÉNÉRALE À EXTRAIRE EXACTEMENT :
  A) Pour chaque grille :
     - Titre exact de la grille
     - Date d'application/avenant
     - Référence précise des articles
     - Champ d'application territorial

  B) Pour chaque classification :
     - Niveau/Échelon exact
     - Coefficient si existant  
     - Position précise
     - Valeur du point si applicable
     - Montant exact du salaire

2. ÉLÉMENTS TECHNIQUES :

  - TOUS les commentaires :
     • En bas de tableau
     • En marge
     • Entre parenthèses
     • En note de bas de page

  - TOUTES les particularités :
     • Mentions "voir article X"
     • Calculs spécifiques
     • Exceptions mentionnées
     • Cas particuliers

3. FORMAT ET PRÉSENTATION :
  - Copier-coller STRICT des tableaux
  - Conservation de la mise en forme d'origine
  - Maintien de TOUS les sauts de ligne
  - Report de TOUS les espacements
  - Reproduction exacte de la structure visuelle

4. VARIATIONS À INCLURE :
  - Par zone géographique
  - Par département
  - Par région
  - Par secteur d'activité

5. ÉLÉMENTS COMPLÉMENTAIRES :
  - Valeur du point si existante
  - Formules de calcul
  - Modalités d'application
  - Garanties diverses
  - TOUT autre élément lié aux salaires

RÈGLES ABSOLUES :
- Ne rien omettre
- Ne rien reformuler
- Conserver la structure exacte
- Reporter TOUS les détails
- Maintenir TOUTE la mise en forme

Si la convention collective ne contient aucune grille de rémunération : indiquer "RAS"`,
    'majoration-dimanche': `Récupère toutes les informations sur la majoration du dimanche dans la convention collective.

1. Extraire EXACTEMENT :
   A) Taux de majoration :
      - Pourcentage exact
      - Montant forfaitaire si prévu
      - Base de calcul de la majoration
      - Assiette de calcul

   B) Conditions d'application :
      - Horaires concernés 
      - Durée minimum d'intervention
      - Personnel concerné
      - Exceptions éventuelles

   C) Modalités spécifiques :
      - Cumul possible avec d'autres majorations
      - Repos compensateur éventuel
      - Mode de récupération
      - Délais de prévenance

   D) Spécificités :
      - Jours fériés tombant un dimanche
      - Particularités selon services
      - Cas exceptionnels
      - Règles de rotation si prévues

2. Présentation :
   - Copier-coller exact du texte conventionnel
   - Référence précise des articles
   - Conservation de toutes les notes
   - Maintien des exceptions et cas particuliers

Si la convention collective ne contient aucune disposition sur la majoration du dimanche : indiquer "RAS"`,
    'majoration-ferie': `Cherche toutes les informations sur la majoration des jours fériés dans la convention collective.

1. Extraire EXACTEMENT :
   A) Liste des jours fériés :
      - Jours fériés garantis
      - Jours fériés travaillés
      - Jours fériés chômés
      - 1er mai (dispositions spécifiques)

   B) Taux de majoration :
      - Pourcentage exact
      - Montant forfaitaire si prévu
      - Base de calcul de la majoration
      - Assiette de calcul

   C) Conditions d'application :
      - Ancienneté requise si prévue
      - Conditions particulières
      - Personnel concerné/exclu
      - Modalités de paiement

   D) Modalités spécifiques :
      - Repos compensateur si prévu
      - Cumul avec d'autres majorations
      - Règles de récupération
      - Délais de prévenance

   E) Spécificités :
      - Jour férié tombant un repos hebdo
      - Particularités selon services
      - Cas exceptionnels
      - Veille/lendemain de jour férié

2. Présentation :
   - Copier-coller exact du texte
   - Référence précise des articles
   - Conservation de toutes les notes
   - Maintien de tous les cas particuliers

Si la convention collective ne contient aucune disposition sur la majoration des jours fériés : indiquer "RAS"`,
    'majoration-nuit': `Analyse la convention collective pour récupérer toutes lesinformations concernant la majoration pour les heures de travail effectuées la nuit.

1. Extraire EXACTEMENT :
   A) Plages horaires :
      - Définition précise du travail de nuit
      - Horaires de début et de fin
      - Durée minimale de travail de nuit
      - Distinction éventuelle selon les services

   B) Taux de majoration :
      - Pourcentage exact
      - Montant forfaitaire si prévu
      - Base de calcul
      - Assiette de la majoration

   C) Conditions d'application :
      - Travailleurs de nuit réguliers
      - Travailleurs de nuit occasionnels
      - Personnel concerné/exclu
      - Conditions particulières

   D) Contreparties :
      - Repos compensateur si prévu
      - Majoration salariale
      - Cumul possible avec d'autres majorations
      - Avantages spécifiques

   E) Spécificités :
      - Travail de nuit exceptionnel
      - Cas particuliers
      - Règles de rotation si prévues
      - Changement de planning

2. Présentation :
   - Copier-coller exact du texte conventionnel
   - Référence précise des articles
   - Conservation de toutes les notes
   - Maintien de tous les cas particuliers

Si la convention collective ne contient aucune disposition sur la majoration du travail de nuit : indiquer "RAS"`,
  },
  'depart': {
    'indemnite-licenciement': `Récupère toutes les informations concernant l'indemnité de licenciement dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Cas d'exclusion
      - Base de calcul du salaire de référence

   B) Mode de calcul :
      - Formule exacte de calcul
      - Tranches d'ancienneté
      - Taux par tranche
      - Base de calcul précise

   C) Salaire de référence :
      - Définition exacte
      - Eléments inclus
      - Eléments exclus
      - Période de référence
      - Cas des variables/primes

   D) Cas particuliers :
      - Temps partiel
      - Suspension du contrat
      - Absences
      - Licenciement économique
      - Inaptitude

2. Format de présentation :
   - Copier-coller exact du texte
   - Maintien des formules et tableaux
   - Conservation de tous les exemples
   - Report des cas particuliers
   - Référence précise des articles
   - Conservation de toutes les notes
   - Maintien de tous les renvois

Si la convention collective ne contient aucune disposition sur l'indemnité de licenciement : indiquer "RAS"`,
    'indemnite-mise-retraite': `Récupère toutes les informations sur l'indemnité de mise à la retraite dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Cas d'exclusion
      - Conditions particulières

   B) Mode de calcul :
      - Formule exacte de calcul
      - Tranches d'ancienneté
      - Taux par tranche
      - Montants ou pourcentages précis

   C) Salaire de référence :
      - Définition exacte
      - Éléments inclus
      - Éléments exclus
      - Période de référence
      - Traitement des variables/primes

   D) Précisions techniques :
      - Date de calcul ancienneté
      - Décompte de l'ancienneté
      - Périodes assimilées
      - Périodes exclues

   E) Cas particuliers :
      - Temps partiel
      - Absences
      - Suspensions de contrat
      - Situations spécifiques

2. Format de présentation :
   - Copier-coller exact du texte
   - Maintien des formules/tableaux
   - Conservation des exemples
   - Report des notes et renvois
   - Référence précise des articles
   - Conservation de tous les commentaires

Si la convention collective ne contient aucune disposition sur l'indemnité de mise à la retraite : indiquer "RAS"`,
    'indemnite-depart-retraite': `Récupère toutesles informations sur l'indemnité de départ à la retraite (départ volontaire) dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Conditions particulières
      - Délai de prévenance si précisé

   B) Mode de calcul :
      - Formule exacte de calcul
      - Tranches d'ancienneté
      - Taux ou montants par tranche
      - Plafonds éventuels

   C) Salaire de référence :
      - Définition exacte
      - Éléments inclus
      - Éléments exclus
      - Période de référence
      - Cas des variables/primes

   D) Calcul de l'ancienneté :
      - Mode de décompte
      - Périodes prises en compte
      - Périodes exclues
      - Date de calcul

   E) Cas particuliers :
      - Temps partiel
      - Suspension du contrat
      - Absences
      - Situations spécifiques

2. Format de présentation :
   - Copier-coller exact du texte
   - Maintien des formules/tableaux
   - Conservation des exemples
   - Report des notes et renvois
   - Référence précise des articles
   - Conservation de tous les commentaires

Si la convention collective ne contient aucune disposition sur l'indemnité de départ volontaire à la retraite : indiquer "RAS"`,
    'indemnite-rupture': `Récupère toutes les informations sur l'indemnité de rupture conventionnelle dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté requise
      - Catégories concernées
      - Conditions spécifiques
      - Cas d'exclusion

   B) Mode de calcul :
      - Formule exacte
      - Base de calcul
      - Montants ou pourcentages
      - Tranches éventuelles

   C) Salaire de référence :
      - Définition exacte
      - Éléments inclus
      - Éléments exclus
      - Période de référence
      - Traitement des variables

   D) Calcul de l'ancienneté :
      - Mode de décompte
      - Périodes prises en compte
      - Périodes exclues
      - Date de calcul

   E) Procédure spécifique :
      - Formalités particulières
      - Délais conventionnels
      - Documents requis
      - Modalités de versement

2. Format de présentation :
   - Copier-coller exact du texte
   - Maintien des formules/tableaux
   - Conservation des exemples
   - Report des notes et renvois
   - Référence précise des articles
   - Conservation de tous les commentaires

Si la convention collective ne contient aucune disposition sur l'indemnité de rupture conventionnelle : indiquer "RAS"`,
    'preavis': `Récupère toutes les informations concernant le préavis dans la convention collective.

1. Extraire EXACTEMENT pour chaque type de rupture :
   A) Préavis de licenciement :
      - Durée selon catégories
      - Durée selon ancienneté
      - Conditions particulières
      - Cas de dispense

   B) Préavis de démission :
      - Durée selon catégories
      - Durée selon ancienneté
      - Conditions spécifiques
      - Cas particuliers

   C) Préavis de départ/mise à la retraite :
      - Durée selon catégories
      - Durée selon ancienneté
      - Modalités spécifiques
      - Exceptions

   D) Modalités d'exécution :
      - Heures pour recherche d'emploi
      - Montant/maintien du salaire
      - Possibilité de dispense
      - Congés pendant préavis

   E) Points spécifiques :
      - Point de départ du préavis
      - Cas de non-exécution
      - Calcul des délais
      - Impact des congés/absences

   F) Cas particuliers :
      - Période d'essai
      - CDD
      - Faute grave/lourde
      - Inaptitude

2. Format de présentation :
   - Copier-coller exact du texte
   - Conservation des tableaux
   - Maintien des durées précises
   - Référence des articles
   - Report de toutes les notes
   - Conservation des exceptions
   - Reprise de tous les commentaires

Si la convention collective ne contient aucune disposition sur le préavis : indiquer "RAS"`
  }
};