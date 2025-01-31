import { memo } from 'react';
import { type Category, type Subcategory } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LegalComparisonProps {
  category: Category;
  subcategory: Subcategory;
}

export const LegalComparison = memo(function LegalComparison({ category, subcategory }: LegalComparisonProps) {
  console.log('LegalComparison - category:', category.id, 'subcategory:', subcategory.id);

  const comparison = LEGAL_COMPARISONS[category.id]?.[subcategory.id];

  // Message spécial pour la grille et la classification si non disponibles
  if ((category.id === 'classification' && subcategory.id === 'classification-details') ||
      (category.id === 'remuneration' && subcategory.id === 'grille')) {
    console.log('Affichage du message spécial');
    return (
      <div className="bg-yellow-50 rounded-lg p-4 mt-8">
        <div className="flex gap-2 items-center">
          <span className="text-amber-400">⚠️</span>
          <p className="text-amber-700">
            Cette information n'est pas disponible pour le moment. Notre équipe travaille à l'intégration de ces données pour vous fournir une analyse complète prochainement.
          </p>
        </div>
      </div>
    );
  }

  // Pas de comparaison trouvée
  if (!comparison) {
    console.log('Pas de comparaison trouvée');
    return null;
  }

  // Afficher la comparaison légale normale
  return (
    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm dark:bg-green-900/10 dark:border-green-900/20">
      <ReactMarkdown 
        className="prose prose-sm dark:prose-invert max-w-none [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300"
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border" {...props} />
            </div>
          ),
          thead: props => <thead className="bg-muted" {...props} />,
          th: props => <th className="border border-border p-2 text-left" {...props} />,
          td: props => <td className="border border-border p-2" {...props} />
        }}
      >
        {comparison}
      </ReactMarkdown>
    </div>
  );
});

export const LEGAL_COMPARISONS: Record<string, Record<string, string>> = {
  'cotisations': {
    'prevoyance': `### Comparaison avec le cadre légal
61:

62:**Important :** L'obligation légale de cotisation prévoyance ne concerne que les cadres.
63:

64:#### Dispositions légales pour les cadres
65:- Cotisation minimale obligatoire : 1,50% de la tranche A (jusqu'au plafond de la sécurité sociale)
66:- Cette cotisation est à la charge exclusive de l'employeur
67:- Obligation issue de la Convention Collective Nationale de 1947
68:

69:#### Pour les non-cadres
70:- Aucune obligation légale de cotisation prévoyance
71:- La mise en place d'une prévoyance ne peut résulter que de :
72:  * La convention collective applicable
73:  * Un accord d'entreprise
74:  * Une décision unilatérale de l'employeur
75:

76:**Note :** La convention collective peut prévoir :
77:- Des taux de cotisation supérieurs
78:- Une répartition spécifique entre employeur et salarié
79:- Une extension aux non-cadres
80:- Des garanties particulières`,

    'retraite': `### Comparaison avec le cadre légal
83:

84:#### Retraite complémentaire AGIRC-ARRCO
85:**Taux de cotisation légaux :**
86:- Tranche 1 (jusqu'à 1 PSS) : 7,87%
87:- Tranche 2 (1 à 8 PSS) : 21,59%

89:**Répartition employeur/salarié :**
90:- Part employeur : 60%
91:- Part salarié : 40%

93:#### Contribution d'Équilibre Général (CEG)
94:**Taux de cotisation :**
95:- Tranche 1 : 2,15%
96:- Tranche 2 : 2,70%

98:**Répartition :**
99:- Part employeur : 60%
100:- Part salarié : 40%

102:#### Contribution d'Équilibre Technique (CET)
103:- S'applique aux salaires > 1 PSS
104:- Taux : 0,35%
105:- Répartition : 60% employeur, 40% salarié

107:#### Points importants
108:- Les taux sont obligatoires et s'appliquent à tous les salariés
109:- Le PSS (Plafond de la Sécurité Sociale) est réévalué chaque année
110:- La convention collective peut prévoir :
111:  * Des taux supérieurs
112:  * Une répartition différente (plus favorable au salarié)
113:  * Des assiettes de calcul spécifiques

115:**Note :** La convention collective ne peut pas prévoir de taux inférieurs aux taux légaux.`,

    'mutuelle': `### Comparaison avec le cadre légal
118:

119:#### Obligation de mise en place
120:- Toutes les entreprises doivent proposer une mutuelle collective à leurs salariés
121:- Cette obligation s'applique à tous les salariés (CDD, CDI, temps partiel)
122:- La mise en place doit se faire par :
123:  * Une convention collective
124:  * Un accord d'entreprise
125:  * Une décision unilatérale de l'employeur (DUE)

127:#### Participation employeur
128:- L'employeur doit prendre en charge au minimum 50% de la cotisation
129:- Cette participation minimale s'applique sur la couverture obligatoire minimale

131:#### Cas de dispense
132:Les salariés peuvent refuser d'adhérer dans certains cas :
133:- CDD ou contrat de mission < 12 mois
134:- CDD ou contrat de mission ≥ 12 mois avec une couverture individuelle
135:- Temps partiel avec cotisation ≥ 10% du salaire brut
136:- Bénéficiaires de la CSS ou de l'ACS
137:- Couverture obligatoire par ailleurs (y compris en tant qu'ayant droit)
138:- Multi-employeurs déjà couverts

140:#### Panier de soins minimal
141:La couverture doit inclure au minimum :
142:- Intégralité du ticket modérateur
143:- Forfait journalier hospitalier sans limitation de durée
144:- Soins dentaires (125% BR) et orthodontie (125% BR)
145:- Optique : forfait tous les 2 ans (100€ minimum pour des verres simples)

147:**Note :** La convention collective peut prévoir :
148:- Une répartition plus favorable de la cotisation
149:- Des garanties supérieures au minimum légal
150:- Des conditions d'ancienneté (maximum 6 mois)`,
  },
  'conges': {
    'cet': `### Comparaison avec le cadre légal
154:

155:**Important :** La loi ne prévoit pas de dispositions spécifiques concernant le Compte Épargne Temps (CET). Sa mise en place est uniquement possible par :
156:- Une convention collective
157:- Un accord d'entreprise
158:- Un accord de branche
159:

160:Le CET n'est donc pas un droit légal et dépend entièrement des dispositions conventionnelles. Sans accord collectif le prévoyant, il n'est pas possible de mettre en place un CET dans l'entreprise.

162:Les modalités de fonctionnement (alimentation, utilisation, liquidation) sont définies exclusivement par l'accord collectif qui le met en place.`,

    'conges-payes': `### Comparaison avec le cadre légal
165:

166:#### Période d'acquisition et durée
167:- Période légale d'acquisition : du 1er juin au 31 mai
168:- Durée légale : 5 semaines (30 jours ouvrables ou 25 jours ouvrés)
169:- Le décompte en jours ouvrés n'est possible que si prévu par la convention collective

171:#### Acquisition pendant les absences
172:- En cas d'arrêt maladie : acquisition de 2,5 jours par mois (ou 2,08 jours ouvrés)
173:- La convention collective peut prévoir des dispositions plus favorables
174:- Certains arrêts sont assimilés à du temps de travail effectif pour l'acquisition des congés

176:#### Points importants
177:- Les congés d'ancienneté ne sont pas prévus par la loi
178:- Seule la convention collective peut prévoir des congés supplémentaires liés à l'ancienneté
179:- Le fractionnement des congés peut donner droit à des jours supplémentaires selon les règles légales

181:#### Prise des congés
182:- L'employeur fixe les dates de congés
183:- Consultation des représentants du personnel obligatoire
184:- Délai de prévenance raisonnable
185:- Ordre des départs tenant compte de la situation familiale

187:**Note :** La convention collective peut prévoir des dispositions plus favorables sur tous ces points.`,
    'evenement-familial': `### Comparaison avec le cadre légal
189:

190:**Important :** Il convient d'appliquer la disposition la plus favorable au salarié entre la loi et la convention collective.

192:#### Durées légales des congés pour événements familiaux

194:| Événement familial | Durée du congé | Type de jours |
195:|-------------------|----------------|---------------|
196:| Mariage du salarié | 4 jours | Ouvrables |
197:| Conclusion d'un PACS | 4 jours | Ouvrables |
198:| Mariage d'un enfant | 1 jour | Ouvrables |
199:| Naissance d'un enfant | 3 jours | Ouvrables |
200:| Adoption d'un enfant | 3 jours | Ouvrables |
201:| Décès du conjoint, partenaire de PACS ou concubin | 3 jours | Ouvrables |
202:| Décès d'un enfant (cas général) | 12 jours | Ouvrables |
203:| Décès d'un enfant âgé de moins de 25 ans, ou d'un enfant, quel que soit son âge, s'il était lui-même parent, ou d'une personne de moins de 25 ans à charge effective et permanente | 14 jours | Ouvrables |
204:| Décès du père, de la mère, du beau-père ou de la belle-mère | 3 jours | Ouvrables |
205:| Décès d'un frère ou d'une sœur | 3 jours | Ouvrables |
206:| Annonce de la survenue d'un handicap, d'une pathologie chronique nécessitant un apprentissage thérapeutique ou d'un cancer chez un enfant | 5 jours | Ouvrables |

208:**Note :** 
209:- Ces durées sont les minimums légaux
210:- La convention collective peut prévoir des durées plus longues
211:- Dans ce cas, ce sont les durées conventionnelles plus favorables qui s'appliquent
212:- Le salarié doit fournir un justificatif de l'événement`,
  },
  'embauche': {
    'periode-essai': `### Comparaison avec le cadre légal
216:#### Durées maximales de la période d'essai par catégorie :

218:**Pour les CDI :**
219:- Ouvriers et employés : 2 mois maximum de durée initiale
220:- Agents de maîtrise et techniciens : 3 mois maximum de durée initiale
221:- Cadres : 4 mois maximum de durée initiale

223:**Important :** Le renouvellement de la période d'essai n'est possible que s'il est expressément prévu par un accord de branche étendu ou la convention collective applicable. Si la convention collective ne prévoit pas de renouvellement, il n'est pas possible de renouveler la période d'essai.

225:Dans le cas où le renouvellement est prévu par la convention collective, les durées maximales avec renouvellement sont :
226:- Ouvriers et employés : jusqu'à 4 mois
227:- Agents de maîtrise et techniciens : jusqu'à 6 mois
228:- Cadres : jusqu'à 8 mois

230:**Pour les CDD :**
231:La durée de la période d'essai ne peut excéder une durée calculée à raison de :
232:- 1 jour par semaine, dans la limite de 2 semaines pour les contrats ≤ 6 mois
233:- 1 mois maximum pour les contrats > 6 mois

235:Ces durées peuvent être réduites par la convention collective applicable ou par accord entre les parties.`,

    'delai-prevenance': `### Comparaison avec le cadre légal
238:#### Règle générale
239:Il convient d'appliquer le délai de prévenance le plus favorable au salarié entre celui prévu par la loi et celui prévu par la convention collective.

241:#### Délais légaux minimums
242:En cas de rupture par l'employeur :
243:- Moins de 8 jours de présence : 24 heures
244:- Entre 8 jours et 1 mois de présence : 48 heures
245:- Entre 1 et 3 mois de présence : 2 semaines
246:- Plus de 3 mois de présence : 1 mois

248:En cas de rupture par le salarié :
249:- Moins de 8 jours de présence : 24 heures
250:- Plus de 8 jours de présence : 48 heures

252:**Important :** Si la convention collective prévoit des délais plus longs, ce sont ces délais plus favorables qui s'appliquent au salarié.`,

    'duree-travail': `### Comparaison avec le cadre légal
255:

256:#### Durée légale du travail
257:- Durée légale hebdomadaire : 35 heures
258:- Durée quotidienne maximale : 10 heures
259:- Durée hebdomadaire maximale : 48 heures (ou 44 heures sur 12 semaines consécutives)

261:#### Heures supplémentaires
262:**Majoration légale :**
263:- De la 36e à la 43e heure : 25%
264:- À partir de la 44e heure : 50%

266:**Important :** La convention collective peut prévoir des taux de majoration différents (10%, 20%, 50%), mais ils ne peuvent pas être inférieurs à 10%.

268:#### Temps partiel
269:**Durée minimale :**
270:- 24 heures hebdomadaires, sauf dérogation prévue par la convention collective ou demande écrite et motivée du salarié

272:**Heures complémentaires :**
273:- Limite légale : 10% du temps de travail contractuel
274:- Possibilité d'augmentation jusqu'à 1/3 si prévu par accord collectif
275:- Majoration minimale de 10% dans la limite du 1/10e
276:- Majoration minimale de 25% au-delà, si autorisé par accord

278:#### Forfait jours
279:**Conditions :**
280:- Maximum légal : 218 jours par an
281:- Ne peut être mis en place que si prévu par la convention collective
282:- Nécessite un accord écrit du salarié
283:- Réservé aux cadres autonomes et salariés dont la durée de travail ne peut être prédéterminée

285:**Important :** En l'absence de disposition dans la convention collective autorisant le forfait jours, ce dispositif ne peut pas être mis en place.`,
  },
  'maintien-salaire': {
    'maladie': `### Comparaison avec le cadre légal
289:#### Conditions d'indemnisation

291:Le salarié doit avoir au moins 1 an d'ancienneté dans l'entreprise pour bénéficier du maintien de salaire.

293:#### Calcul de l'indemnisation légale
294:Le salarié perçoit un pourcentage de sa rémunération brute qu'il aurait perçue s'il avait continué à travailler :

296:**Montant de l'indemnisation :**
297:- Premiers 30 jours : 90% de la rémunération brute
298:- 30 jours suivants : 66,66% de la rémunération brute

300:**Important :** Ces montants incluent les indemnités journalières versées par la Sécurité sociale.

302:#### Augmentation des durées selon l'ancienneté
303:Les durées d'indemnisation augmentent de 10 jours par période de 5 ans d'ancienneté au-delà de 1 an, sans dépasser 90 jours par période.

305:**Durées d'indemnisation selon l'ancienneté :**
306:- 1 à 5 ans : 30 jours à 90% + 30 jours à 66,66%
307:- 6 à 10 ans : 40 jours à 90% + 40 jours à 66,66%
308:- 11 à 15 ans : 50 jours à 90% + 50 jours à 66,66%
309:- 16 à 20 ans : 60 jours à 90% + 60 jours à 66,66%
310:- 21 à 25 ans : 70 jours à 90% + 70 jours à 66,66%
311:- 26 à 30 ans : 80 jours à 90% + 80 jours à 66,66%
312:- 31 ans et plus : 90 jours à 90% + 90 jours à 66,66%

314:**Note :** En cas de dispositions plus favorables dans la convention collective, celles-ci s'appliquent en priorité.`,

    'accident-travail': `### Comparaison avec le cadre légal
317:#### Conditions d'indemnisation
318:- Ancienneté minimale : 1 an
319:- Pas de délai de carence
320:- Justificatifs nécessaires :
321:  * Certificat médical
322:  * Respect des obligations de déclaration

324:#### Calcul de l'indemnisation légale
325:Le salarié perçoit un pourcentage de sa rémunération brute qu'il aurait perçue s'il avait continué à travailler :

327:**Montant de l'indemnisation :**
328:- Premiers 30 jours : 90% de la rémunération brute
329:- 30 jours suivants : 66,66% de la rémunération brute

331:**Important :** Ces montants incluent les indemnités journalières versées par la Sécurité sociale.

333:#### Augmentation des durées selon l'ancienneté
334:Les durées d'indemnisation augmentent de 10 jours par période de 5 ans d'ancienneté au-delà de 1 an, sans dépasser 90 jours par période.

336:**Durées d'indemnisation selon l'ancienneté :**
337:- 1 à 5 ans : 30 jours à 90% + 30 jours à 66,66%
338:- 6 à 10 ans : 40 jours à 90% + 40 jours à 66,66%
339:- 11 à 15 ans : 50 jours à 90% + 50 jours à 66,66%
340:- 16 à 20 ans : 60 jours à 90% + 60 jours à 66,66%
341:- 21 à 25 ans : 70 jours à 90% + 70 jours à 66,66%
342:- 26 à 30 ans : 80 jours à 90% + 80 jours à 66,66%
343:- 31 ans et plus : 90 jours à 90% + 90 jours à 66,66%

345:**Note :** En cas de dispositions plus favorables dans la convention collective, celles-ci s'appliquent en priorité.`,

    'maternite-paternite': `### Comparaison avec le cadre légal

349:**Important :** La loi ne prévoit aucun maintien de salaire obligatoire pendant les congés de maternité et de paternité. Seules les indemnités journalières de la Sécurité sociale sont prévues par la loi.

351:Un maintien de salaire pendant ces périodes ne peut être prévu que par :
352:- La convention collective applicable
353:- Un accord d'entreprise
354:- Le contrat de travail
355:- Un usage d'entreprise

357:Il est donc essentiel de consulter la convention collective pour connaître les éventuelles dispositions plus favorables concernant le maintien de salaire pendant les congés de maternité et de paternité.`,
  },
  'depart': {
    'indemnite-licenciement': `### Comparaison avec le cadre légal

362:#### 1. Conditions d'éligibilité
363:- Ancienneté minimale : 8 mois ininterrompus
364:- CDI uniquement
365:- Hors licenciement pour faute grave ou lourde
366:- Calcul de l'ancienneté : temps de présence continu dans l'entreprise

368:#### 2. Calcul de l'indemnité légale
369:**Formule de calcul :**
370:- Jusqu'à 10 ans d'ancienneté : 1/4 de mois de salaire par année d'ancienneté
371:- Au-delà de 10 ans : 1/3 de mois de salaire par année d'ancienneté supplémentaire

373:**Exemple :**
374:Pour 12 ans d'ancienneté :
375:- Premiers 10 ans : (10 × 1/4) = 2,5 mois
376:- 2 années suivantes : (2 × 1/3) = 0,67 mois
377:- Total = 3,17 mois de salaire

379:#### 3. Salaire de référence
380:Le plus favorable entre :
381:- La moyenne des 12 derniers mois
382:- La moyenne des 3 derniers mois (primes incluses)
383:- Base : salaire brut (incluant les primes et avantages réguliers)

385:#### Points importants
386:- La convention collective peut prévoir :
387:  * Une ancienneté minimale plus courte
388:  * Des taux de calcul plus avantageux
389:  * Une base de calcul plus favorable
390:  * Des majorations selon l'âge ou le statut

392:**Règle fondamentale :** Appliquer le plus favorable entre :
393:- L'indemnité légale
394:- L'indemnité conventionnelle
395:- L'indemnité prévue au contrat de travail`,

    'indemnite-mise-retraite': `### Comparaison avec le cadre légal

399:#### 1. Conditions d'éligibilité
400:- Initiative de l'employeur
401:- Salarié en âge de bénéficier d'une retraite à taux plein
402:- Pas de condition d'ancienneté minimale légale

404:#### 2. Calcul de l'indemnité légale
405:**Même calcul que l'indemnité de licenciement :**
406:- 1/4 de mois par année jusqu'à 10 ans
407:- 1/3 de mois par année au-delà de 10 ans

409:#### 3. Salaire de référence
410:Identique à l'indemnité de licenciement :
411:- Le plus favorable entre moyenne des 12 ou 3 derniers mois
412:- Inclusion de tous les éléments de rémunération fixes

414:#### Points importants
415:- La mise à la retraite avant l'âge légal est interdite
416:- La convention collective peut prévoir :
417:  * Des conditions plus favorables de calcul
418:  * Des majorations spécifiques
419:  * Une base de calcul plus avantageuse

421:**Règle fondamentale :** Appliquer le plus favorable entre :
422:- L'indemnité légale
423:- L'indemnité conventionnelle`,

    'indemnite-depart-retraite': `### Comparaison avec le cadre légal

427:#### 1. Conditions d'éligibilité
428:- Initiative du salarié
429:- Départ volontaire à la retraite
430:- Ancienneté minimale : pas de minimum légal

432:#### 2. Calcul de l'indemnité légale
433:**Barème légal :**
434:- 1/2 mois de salaire après 10 ans d'ancienneté
435:- 1 mois de salaire après 15 ans d'ancienneté
436:- 1,5 mois de salaire après 20 ans d'ancienneté
437:- 2 mois de salaire après 30 ans d'ancienneté

439:#### 3. Salaire de référence
440:Identique aux autres indemnités :
441:- Le plus favorable entre moyenne des 12 ou 3 derniers mois
442:- Inclusion des primes et avantages réguliers

444:#### Points importants
445:- Montants inférieurs à l'indemnité de mise à la retraite
446:- La convention collective peut prévoir :
447:  * Des montants plus favorables
448:  * Des paliers d'ancienneté différents
449:  * Des majorations spécifiques

451:**Règle fondamentale :** Appliquer le plus favorable entre :
452:- L'indemnité légale
453:- L'indemnité conventionnelle`,

    'indemnite-rupture': `### Comparaison avec le cadre légal

457:#### 1. Conditions d'éligibilité
458:- Accord entre l'employeur et le salarié
459:- CDI uniquement
460:- Ancienneté minimale : pas de minimum légal

462:#### 2. Montant minimal légal
463:**Au minimum égal à l'indemnité légale de licenciement :**
464:- 1/4 de mois par année jusqu'à 10 ans
465:- 1/3 de mois par année au-delà de 10 ans

467:#### 3. Salaire de référence
468:Identique à l'indemnité de licenciement :
469:- Le plus favorable entre moyenne des 12 ou 3 derniers mois
470:- Inclusion de tous les éléments de rémunération

472:#### Points importants
473:- Le montant est négociable mais ne peut être inférieur à l'indemnité légale de licenciement
474:- La convention collective peut prévoir :
475:  * Des modalités de calcul spécifiques
476:  * Des montants minimaux plus élevés
477:  * Des majorations particulières

479:**Règle fondamentale :** Appliquer le plus favorable entre :
480:- L'indemnité légale de licenciement
481:- L'indemnité conventionnelle
482:- Le montant négocié dans la convention de rupture

484:**Note :** Le montant négocié dans la convention de rupture peut être supérieur aux minimums légaux et conventionnels.`,

    'indemnite-precarite': `### Comparaison avec le cadre légal

487:#### 1. Conditions d'éligibilité
488:- Applicable aux contrats CDD et intérim
489:- Versée à la fin du contrat
490:- Due même en cas de rupture anticipée (sauf faute grave ou force majeure)

492:#### 2. Montant légal
493:**Taux légal de base :**
494:- 10% de la rémunération totale brute versée pendant le contrat
495:- Base de calcul : totalité des salaires perçus, y compris :
496:  * Heures supplémentaires
497:  * Primes
498:  * Indemnités (sauf indemnité de congés payés)

500:**Possibilité de réduction du taux :**
501:- Peut être réduit à 6% sous conditions cumulatives :
502:  * Doit être prévu par une convention ou un accord collectif
503:  * Doit prévoir des contreparties réelles en termes de formation professionnelle
504:  * L'employeur doit effectivement proposer ces formations aux salariés concernés
505:- Important : le taux de 10% reste dû si les contreparties ne sont pas effectivement proposées

507:#### 3. Cas d'exclusion
508:L'indemnité n'est pas due dans les cas suivants :
509:- CDI proposé à l'issue du CDD
510:- Refus d'un CDI pour un poste similaire (même classification, même rémunération)
511:- Rupture anticipée à l'initiative du salarié
512:- Faute grave ou force majeure
513:- Contrats saisonniers
514:- Contrats d'usage dans certains secteurs
515:- Contrats conclus avec des jeunes pendant leurs vacances scolaires/universitaires

517:#### 4. Points importants
518:- La convention collective peut prévoir :
519:  * Un taux supérieur à 10%
520:  * Des cas supplémentaires de versement
521:  * Des modalités de calcul plus favorables
522:  * Une réduction à 6% avec contreparties de formation
523:  * Des conditions particulières selon les types de contrats

525:**Règle fondamentale :** Appliquer le plus favorable entre :
526:- Le taux légal de 10%
527:- Le taux prévu par la convention collective (si supérieur)
528:- Le taux réduit de 6% ne s'applique que si toutes les conditions sont réunies

530:**Note :** La prime de précarité est un droit d'ordre public :
531:- Le taux ne peut être inférieur à 6% même avec contreparties
532:- Les cas d'exclusion ne peuvent être étendus
533:- Les conditions plus restrictives sont interdites`,
  },
  'remuneration': {
    'majoration-ferie': `### Comparaison avec le cadre légal

538:#### 1. Jours fériés légaux
539:**Jours fériés nationaux :**
540:- 1er janvier
541:- Lundi de Pâques
542:- 1er mai
543:- 8 mai
544:- Ascension
545:- Lundi de Pentecôte
546:- 14 juillet
547:- Assomption (15 août)
548:- Toussaint (1er novembre)
549:- 11 novembre
550:- 25 décembre

552:**Spécificité Alsace-Moselle :**
553:Deux jours fériés supplémentaires :
554:- 26 décembre
555:- Vendredi Saint

557:#### 2. Statut particulier du 1er mai
558:- Seul jour férié obligatoirement chômé et payé
559:-Si travaillé : majoration obligatoire de 100% (doublement du salaire)
560:- Non récupérable
561:- Applicable à tous les salariés, sans condition d'ancienneté

563:#### 3. Autres jours fériés
564:**Principe général :**
565:- Aucune majoration légale obligatoire (sauf 1er mai)
566:- Le chômage des jours fériés ne peut entraîner de perte de salaire pour les salariés :
567:  * Ayant au moins 3 mois d'ancienneté
568:  * Ayant travaillé le dernier jour précédant et le premier jour suivant le férié

570:**Si travaillé :**
571:- Aucune majoration légale obligatoire
572:- La majoration dépend :
573:  * De la convention collective
574:  * Des accords d'entreprise
575:  * Des usages

577:#### 4. Points importants
578:- La convention collective peut prévoir :
579:  * Des jours fériés supplémentaires
580:  * Des majorations salariales pour le travail les jours fériés
581:  * Des conditions plus favorables pour le maintien de salaire
582:  * Des règles spécifiques pour certains jours fériés

584:**Règle fondamentale :** En présence de dispositions conventionnelles plus favorables :
585:- Elles s'appliquent en priorité
586:- Le salarié bénéficie toujours de la disposition la plus avantageuse entre :
587:  * La convention collective
588:  * La loi
589:  * L'accord d'entreprise
* Le contrat de travail
606:

607:592:**Note :** L'employeur doit vérifier systématiquement les dispositions de la conventioncollective qui peuvent prévoir des majorations ou des compensations plus avantageuses que le minimum légal.`,
    'majoration-nuit': `### Comparaison avec le cadre légal

595:#### 1. Définition légale du travail de nuit
596:- Période de travail : 21h - 6h (sauf accord collectif différent)
597:- Travailleur de nuit si :
598:  * Minimum 3h dans la période de nuit au moins 2 fois par semaine
599:  * Ou 270h de travail de nuit sur 12 mois consécutifs

601:#### 2. Majoration salariale
602:**Important :** La loi n'impose PAS de majoration salariale spécifique pour le travail de nuit.

604:#### 3. Contreparties obligatoires
605:La loi impose uniquement :
606:- Un repos compensateur obligatoire
607:- Des contreparties (sans en fixer le montant) qui doivent être fixées par :
608:  * La convention collective
609:  * Un accord d'entreprise ou d'établissement
610:  * Un accord de branche étendu

612:#### 4. Types de contreparties possibles
613:- Compensation financière
614:- Repos compensateur
615:- Réduction du temps de travail
616:- Combinaison de ces différentes formes

618:#### 5. Durées maximales de travail
619:- Durée quotidienne : 8h maximum
620:- Durée hebdomadaire : 40h en moyenne sur 12 semaines consécutives

622:#### Points importants
623:- La convention collective DOIT prévoir des contreparties
624:- En présence de dispositions conventionnelles :
625:  * Elles s'appliquent en priorité
626:  * Elles peuvent être plus favorables en termes de :
627:    - Taux de majoration
628:    - Durée du repos compensateur
629:    - Conditions d'attribution
630:- Si la convention collective ne prévoit rien :
631:  * L'employeur doit négocier des contreparties
632:  * Un accord d'entreprise ou une décision unilatérale doit les fixer

634:**Note :** Même en l'absence de disposition conventionnelle sur la majoration, l'employeur doit obligatoirement prévoir des contreparties au travail de nuit, qu'elles soient financières ou sous forme de repos.`,
    'apprenti': `### Comparaison avec le cadre légal

637:#### 1. CONTRAT D'APPRENTISSAGE
638:**Rémunération minimale légale (en % du SMIC) :**

640:| Âge | 1ère année | 2ème année | 3ème année |
641:|-----|------------|------------|------------|
642:| 16-17 ans | 27% | 39% | 55% |
643:| 18-20 ans | 43% | 51% | 67% |
644:| 21-25 ans | 53% | 61% | 78% |
645:| 26 ans et + | 100% | 100% | 100% |

647:**Points importants :**
648:- Ces pourcentages sont des minimums légaux
649:- La convention collective peut prévoir des taux plus favorables
650:- Majoration de 15 points si :
651:  * Contrat préparant à un diplôme de même niveau
652:  * Expérience d'un an en apprentissage

654:#### 2. CONTRAT DE PROFESSIONNALISATION
655:**Rémunération minimale légale (en % du SMIC) :**

657:| Âge | < Bac Pro | ≥ Bac Pro |
658:|-----|-----------|-----------|
659:| < 21 ans | 55% | 65% |
660:| 21-25 ans | 70% | 80% |
661:| 26 ans et + | 100% ou 85% du minimum conventionnel |

663:**Points importants :**
664:- Base de calcul : SMIC ou minimum conventionnel si plus favorable
665:- La convention collective peut prévoir une rémunération plus élevée
666:- Le niveau de formation est celui acquis avant le contrat
667:- Possibilité de dispositions plus favorables par accord de branche

669:#### 3. STAGE
670:**Gratification minimale légale :**
671:- Obligatoire si durée > 2 mois (consécutifs ou non)
672:- Montant horaire : 15% du plafond horaire de la sécurité sociale
673:- Base de calcul : nombre d'heures de présence effective

675:**Conditions de versement :**
676:- Due à compter du 1er jour du 1er mois de stage
677:- Versée mensuellement
678:- Proratisée en cas de temps partiel

680:**Points importants :**
681:- Exonération de charges sociales dans la limite du minimum légal
682:- La convention collective peut prévoir une gratification plus élevée
683:- Les avantages en nature doivent être précisés dans la convention de stage
684:- Droits similaires aux salariés pour :
685:  * Accès au restaurant d'entreprise
686:  * Prise en charge des frais de transport
687:  * Accès aux activités sociales et culturelles

689:**Note :** La convention collective peut prévoir des dispositions plus favorables pour tous ces types de contrats, mais ne peut jamais prévoir de rémunération inférieure aux minimums légaux.`,
  },
  'classification': {
    'classification-details': '### Comparaison avec le cadre légal\n\n[Contenu de la classification]'
  }
};