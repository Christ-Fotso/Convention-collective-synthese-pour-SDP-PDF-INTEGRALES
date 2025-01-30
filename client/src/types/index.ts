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
66:
67:1. Extraire précisément :
68:   - Les délais de prévenance spécifiques pour l'employeur :
69:       • Par catégorie professionnelle si différencié
70:       • Selon la durée de présence dans l'entreprise
71:       • Selon la durée initiale de la période d'essai
72:
73:   - Les délais de prévenance spécifiques pour le salarié :
74:       • Par catégorie professionnelle si différencié
75:       • Selon la durée de présence
76:       • Toute condition particulière mentionnée`,
    'duree-travail': `Cherche toutes les informations relatives à la durée du temps de travail dans la convention collective.
78:
79:1. Extraire les dispositions concernant :
80:   a) Durées du travail :
81:      - Durée hebdomadaire conventionnelle
82:      - Durée quotidienne maximale
83:      - Durée mensuelle de référence
84:      - Volume annuel si mentionné`,
    'periode-essai': `EXTRACTION DES INFORMATIONS SUR LA PÉRIODE D'ESSAI
86:
87:A. Durées initiales :
88:   - Par catégorie professionnelle/classification
89:   - Par type de contrat (CDI/CDD si précisé)
90:   - Pour les postes spécifiques si mentionnés
91:
92:B. Conditions de renouvellement :
93:   - Durée du renouvellement possible
94:   - Modalités de mise en œuvre
95:   - Formalisme requis
96:   - Délai pour proposer le renouvellement`
  },
  'conges': {
    'cet': `Analyse la convention collective pour récupérer toutes les informations relatives au Compte Épargne Temps (CET).
100:
101:1. Extraction des informations sur la mise en place :
102:   - Modalités d'ouverture du CET
103:   - Salariés bénéficiaires
104:   - Conditions d'ancienneté éventuelles
105:   - Formalités d'adhésion`,
    'conges-payes': `Récupère toutes les dispositions concernant les congés payés dans la convention collective.
107:
108:1. Extraction des règles générales sur les congés payés :
109:   - Durée des congés (légaux et supplémentaires)
110:   - Période de référence
111:   - Période de prise des congés
112:   - Ordre des départs`,
    'evenement-familial': `Analyse la convention collective pour récupérer toutes les dispositions relatives aux congés pour événements familiaux.
114:
115:1. Extraire exactement tous les congés prévus pour :
116:   - Mariage/PACS
117:   - Naissance/Adoption
118:   - Décès
119:   - Autres événements mentionnés`
  },
  'classification': {
    'classification-details': `Récupère toutes les informations concernant les classifications dans la convention collective.
123:
124:1. Extraire EXACTEMENT :
125:   A) La structure générale de classification :
126:      - Tous les niveaux/échelons
127:      - Coefficients ou indices associés
128:      - Catégories professionnelles
129:      - Filières si existantes`
  },
  'cotisations': {
    'prevoyance': `Récupère toutes les informations relatives aux cotisations pour la prévoyance dans la convention collective.
133:
134:1. Extraire EXACTEMENT :
135:   A) Organismes de prévoyance :
136:      - Nom des organismes désignés
137:      - Date de désignation
138:      - Clause de migration/réexamen si existante
139:      - Organisme gestionnaire si différent`,
    'retraite': `Cherche toutes les informations relatives aux cotisations pour la retraite dans la convention collective.
141:
142:1. Extraire EXACTEMENT :
143:   A) Retraite complémentaire :
144:      - Organismes désignés (AGIRC-ARRCO ou autres)
145:      - Taux contractuels par tranche
146:      - Répartition employeur/salarié
147:      - Base ou assiette de calcul`,
    'mutuelle': `Récupère toutes les informations concernant les cotisations pour la mutuelle dans la convention collective.
149:
150:1. Extraire EXACTEMENT :
151:   A) Organismes :
152:      - Noms des organismes recommandés/désignés
153:      - Date de désignation/recommandation
154:      - Gestionnaire des prestations si différent
155:      - Durée de la désignation si précisée`
  },
  'maintien-salaire': {
    'accident-travail': `Récupère toutes les informations concernant le maintien du salaire en cas d'accident du travail dans la convention collective.
159:
160:1. Extraire EXACTEMENT tout ce qui concerne :
161:   A) Carence :
162:      - Existence ou non d'un délai de carence
163:      - Durée exacte si prévue
164:      - Conditions d'application de la carence
165:      - Cas de suppression de la carence
166:      - Application en cas de rechute`,
    'maladie': `Récupère toutes les informations concernant le maintien du salaire en cas d'arrêt maladie dans la convention collective.
168:
169:1. Extraire EXACTEMENT :
170:   A) Conditions d'ouverture des droits :
171:      - Ancienneté requise
172:      - Justificatifs demandés
173:      - Délais pour fournir les justificatifs
174:      - Contre-visite si prévue`,
    'maternite-paternite': `Récupère toutes les informations concernant le maintien du salaire en cas de maternité ou paternité dans la convention collective.
176:
177:1. Extraire EXACTEMENT :
178:   A) Conditions d'ouverture des droits :
179:      - Ancienneté requise si prévue
180:      - Justificatifs à fournir
181:      - Délais de prévenance
182:      - Conditions spécifiques maternité/paternité`
  },
  'remuneration': {
    'apprenti': `Analyse la convention collective pour récupérer toutes les dispositions concernant la rémunération des alternants et stagiaires.
186:
187:1. APPRENTISSAGE :
188:   A) Rémunération :
189:      - Taux/montants par âge
190:      - Taux/montants par année d'exécution
191:      - Majoration éventuelle vs légal
192:      - Base de calcul utilisée`,
    'prime': `Récupère toutes les informations relatives aux primes dans la convention collective.
194:
195:1. Pour CHAQUE prime mentionnée, extraire EXACTEMENT :
196:   A) Identification de la prime :
197:      - Nom exact de la prime
198:      - Nature/Type
199:      - Base légale (article précis)
200:      - Date de mise en place ou avenant`,
    'grille': `Extrais la grille complète des rémunérations de la convention collective.
202:
203:1. STRUCTURE GÉNÉRALE À EXTRAIRE EXACTEMENT :
204:  A) Pour chaque grille :
205:     - Titre exact de la grille
206:     - Date d'application/avenant
207:     - Référence précise des articles
208:     - Champ d'application territorial`,
    'majoration-dimanche': `Récupère toutes les informations sur la majoration du dimanche dans la convention collective.
210:
211:1. Extraire EXACTEMENT :
212:   A) Taux de majoration :
213:      - Pourcentage exact
214:      - Montant forfaitaire si prévu
215:      - Base de calcul de la majoration
216:      - Assiette de calcul`,
    'majoration-ferie': `Cherche toutes les informations sur la majoration des jours fériés dans la convention collective.
218:
219:1. Extraire EXACTEMENT :
220:   A) Liste des jours fériés :
221:      - Jours fériés garantis
222:      - Jours fériés travaillés
223:      - Jours fériés chômés
224:      - 1er mai (dispositions spécifiques)`,
    'majoration-nuit': `Analyse la convention collective pour récupérer toutes les informations concernant la majoration pour les heures de travail effectuées la nuit.
226:
227:1. Extraire EXACTEMENT :
228:   A) Plages horaires :
229:      - Définition précise du travail de nuit
230:      - Horaires de début et de fin
231:      - Durée minimale de travail de nuit
232:      - Distinction éventuelle selon les services`
  },
  'depart': {
    'indemnite-licenciement': `Récupère toutes les informations concernant l'indemnité de licenciement dans la convention collective.
236:
237:1. Extraire EXACTEMENT :
238:   A) Conditions d'attribution :
239:      - Ancienneté minimale requise
240:      - Catégories concernées
241:      - Cas d'exclusion
242:      - Base de calcul du salaire de référence`,
    'indemnite-mise-retraite': `Récupère toutes les informations sur l'indemnité de mise à la retraite dans la convention collective.
244:
245:1. Extraire EXACTEMENT :
246:   A) Conditions d'attribution :
247:      - Ancienneté minimale requise
248:      - Catégories concernées
249:      - Cas d'exclusion
250:      - Conditions particulières`,
    'indemnite-depart-retraite': `Récupère toutes les informations sur l'indemnité de départ à la retraite (départ volontaire) dans la convention collective.
252:
253:1. Extraire EXACTEMENT :
254:   A) Conditions d'attribution :
255:      - Ancienneté minimale requise
256:      - Catégories concernées
257:      - Conditions particulières
258:      - Délai de prévenance si précisé`,
    'indemnite-rupture': `Récupère toutes les informations sur l'indemnité de rupture conventionnelle dans la convention collective.
260:
261:1. Extraire EXACTEMENT :
262:   A) Conditions d'attribution :
263:      - Ancienneté requise
264:      - Catégories concernées
265:      - Conditions spécifiques
266:      - Cas d'exclusion`,
    'preavis': 'Quelles sont les durées de préavis selon les cas de rupture ? Détaillez par motif et catégorie.'
  }
};