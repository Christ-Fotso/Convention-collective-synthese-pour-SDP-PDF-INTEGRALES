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
      - Volume annuel si mentionné`,
    'periode-essai': `EXTRACTION DES INFORMATIONS SUR LA PÉRIODE D'ESSAI

A. Durées initiales :
   - Par catégorie professionnelle/classification
   - Par type de contrat (CDI/CDD si précisé)
   - Pour les postes spécifiques si mentionnés

B. Conditions de renouvellement :
   - Durée du renouvellement possible
   - Modalités de mise en œuvre
   - Formalisme requis
   - Délai pour proposer le renouvellement`
  },
  'conges': {
    'cet': `Analyse la convention collective pour récupérer toutes les informations relatives au Compte Épargne Temps (CET).

1. Extraction des informations sur la mise en place :
   - Modalités d'ouverture du CET
   - Salariés bénéficiaires
   - Conditions d'ancienneté éventuelles
   - Formalités d'adhésion`,
    'conges-payes': `Récupère toutes les dispositions concernant les congés payés dans la convention collective.

1. Extraction des règles générales sur les congés payés :
   - Durée des congés (légaux et supplémentaires)
   - Période de référence
   - Période de prise des congés
   - Ordre des départs`,
    'evenement-familial': `Analyse la convention collective pour récupérer toutes les dispositions relatives aux congés pour événements familiaux.

1. Extraire exactement tous les congés prévus pour :
   - Mariage/PACS
   - Naissance/Adoption
   - Décès
   - Autres événements mentionnés`
  },
  'classification': {
    'classification-details': `Récupère toutes les informations concernant les classifications dans la convention collective.

1. Extraire EXACTEMENT :
   A) La structure générale de classification :
      - Tous les niveaux/échelons
      - Coefficients ou indices associés
      - Catégories professionnelles
      - Filières si existantes`
  },
  'cotisations': {
    'prevoyance': `Récupère toutes les informations relatives aux cotisations pour la prévoyance dans la convention collective.

1. Extraire EXACTEMENT :
   A) Organismes de prévoyance :
      - Nom des organismes désignés
      - Date de désignation
      - Clause de migration/réexamen si existante
      - Organisme gestionnaire si différent`,
    'retraite': `Cherche toutes les informations relatives aux cotisations pour la retraite dans la convention collective.

1. Extraire EXACTEMENT :
   A) Retraite complémentaire :
      - Organismes désignés (AGIRC-ARRCO ou autres)
      - Taux contractuels par tranche
      - Répartition employeur/salarié
      - Base ou assiette de calcul`,
    'mutuelle': `Récupère toutes les informations concernant les cotisations pour la mutuelle dans la convention collective.

1. Extraire EXACTEMENT :
   A) Organismes :
      - Noms des organismes recommandés/désignés
      - Date de désignation/recommandation
      - Gestionnaire des prestations si différent
      - Durée de la désignation si précisée`
  },
  'maintien-salaire': {
    'accident-travail': `Récupère toutes les informations concernant le maintien du salaire en cas d'accident du travail dans la convention collective.

1. Extraire EXACTEMENT tout ce qui concerne :
   A) Carence :
      - Existence ou non d'un délai de carence
      - Durée exacte si prévue
      - Conditions d'application de la carence
      - Cas de suppression de la carence
      - Application en cas de rechute`,
    'maladie': `Récupère toutes les informations concernant le maintien du salaire en cas d'arrêt maladie dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'ouverture des droits :
      - Ancienneté requise
      - Justificatifs demandés
      - Délais pour fournir les justificatifs
      - Contre-visite si prévue`,
    'maternite-paternite': `Récupère toutes les informations concernant le maintien du salaire en cas de maternité ou paternité dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'ouverture des droits :
      - Ancienneté requise si prévue
      - Justificatifs à fournir
      - Délais de prévenance
      - Conditions spécifiques maternité/paternité`
  },
  'remuneration': {
    'apprenti': `Analyse la convention collective pour récupérer toutes les dispositions concernant la rémunération des alternants et stagiaires.

1. APPRENTISSAGE :
   A) Rémunération :
      - Taux/montants par âge
      - Taux/montants par année d'exécution
      - Majoration éventuelle vs légal
      - Base de calcul utilisée`,
    'prime': `Récupère toutes les informations relatives aux primes dans la convention collective.

1. Pour CHAQUE prime mentionnée, extraire EXACTEMENT :
   A) Identification de la prime :
      - Nom exact de la prime
      - Nature/Type
      - Base légale (article précis)
      - Date de mise en place ou avenant`,
    'grille': `Extrais la grille complète des rémunérations de la convention collective.

1. STRUCTURE GÉNÉRALE À EXTRAIRE EXACTEMENT :
  A) Pour chaque grille :
     - Titre exact de la grille
     - Date d'application/avenant
     - Référence précise des articles
     - Champ d'application territorial`,
    'majoration-dimanche': `Récupère toutes les informations sur la majoration du dimanche dans la convention collective.

1. Extraire EXACTEMENT :
   A) Taux de majoration :
      - Pourcentage exact
      - Montant forfaitaire si prévu
      - Base de calcul de la majoration
      - Assiette de calcul`,
    'majoration-ferie': `Cherche toutes les informations sur la majoration des jours fériés dans la convention collective.

1. Extraire EXACTEMENT :
   A) Liste des jours fériés :
      - Jours fériés garantis
      - Jours fériés travaillés
      - Jours fériés chômés
      - 1er mai (dispositions spécifiques)`,
    'majoration-nuit': `Analyse la convention collective pour récupérer toutes les informations concernant la majoration pour les heures de travail effectuées la nuit.

1. Extraire EXACTEMENT :
   A) Plages horaires :
      - Définition précise du travail de nuit
      - Horaires de début et de fin
      - Durée minimale de travail de nuit
      - Distinction éventuelle selon les services`
  },
  'depart': {
    'indemnite-licenciement': `Récupère toutes les informations concernant l'indemnité de licenciement dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Cas d'exclusion
      - Base de calcul du salaire de référence`,
    'indemnite-mise-retraite': `Récupère toutes les informations sur l'indemnité de mise à la retraite dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Cas d'exclusion
      - Conditions particulières`,
    'indemnite-depart-retraite': `Récupère toutes les informations sur l'indemnité de départ à la retraite (départ volontaire) dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté minimale requise
      - Catégories concernées
      - Conditions particulières
      - Délai de prévenance si précisé`,
    'indemnite-rupture': `Récupère toutes les informations sur l'indemnité de rupture conventionnelle dans la convention collective.

1. Extraire EXACTEMENT :
   A) Conditions d'attribution :
      - Ancienneté requise
      - Catégories concernées
      - Conditions spécifiques
      - Cas d'exclusion`,
    'preavis': 'Quelles sont les durées de préavis selon les cas de rupture ? Détaillez par motif et catégorie.'
  }
};