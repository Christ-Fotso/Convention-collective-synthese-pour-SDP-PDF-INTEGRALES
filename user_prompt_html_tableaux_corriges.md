Analysez la convention collective suivante et extrayez toutes les informations selon les instructions fournies dans le prompt système. Veillez à être exhaustif et précis.

Convention collective à analyser :

{convention}

## Informations générales

OBJECTIF :
Analyser la convention collective pour extraire les informations générales essentielles permettant d'identifier la convention et ses principes d'application, en se limitant strictement aux informations présentes.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Identifiants : Intitulé exact, IDCC, Brochure JO, Codes NAF/APE principaux mentionnés.
- Champ d'application : Champ d'application professionnel, Champ d'application territorial, Entreprises ou activités explicitement exclues par la convention.
- Dates clés : Date de signature du texte de base, Date d'extension (si applicable), Date de publication au JO (si applicable), Date d'effet, Date de la dernière mise à jour mentionnée dans le document.
- Signataires : Organisations patronales et organisations syndicales de salariés signataires (mentionnées dans le texte).
- Structure : Existence d'annexes, d'accords régionaux ou départementaux *mentionnés* dans le texte de base ou ses avenants.
- Modalités d'application : Conditions d'adhésion, de dénonciation, de révision, Existence et rôle d'une commission d'interprétation ou de conciliation *prévues par la convention*.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations extraites de manière claire et structurée (liste, texte), regroupées logiquement (par identifiants, champ d'application, etc.).
- Utilisez un tableau HTML si plusieurs éléments avec caractéristiques distinctes (dates clés, signataires multiples) : <table><tr><th>Type</th><th>Information</th><th>Date/Référence</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td></tr></table>
- Si une information spécifique est absente de la convention, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient *aucune* information sur une catégorie entière listée ci-dessus, mentionnez "RAS" pour cette catégorie.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites dans la convention.
- N'ajoutez des notes que si elles proviennent directement de la convention.
- Indiquez la date de mise à jour si spécifiée dans la convention.
- Appliquez les règles générales : extraction uniquement des infos en vigueur, terminologie exacte, format chiffres/pourcentages correct, pas d'intro/conclusion, statut étendu/non étendu si pertinent.



---

## Délai de prévenance

OBJECTIF :
Identifier et présenter les délais de prévenance prévus explicitement par la convention collective dans différents cas de figure.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Délais de prévenance pour fin de période d'essai (initiative employeur ET salarié si distingués).


INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les délais sous forme de liste ou texte structuré par situation.
- Priorisez un tableau HTML si plusieurs délais avec conditions différentes : <table><tr><th>Situation</th><th>Délai</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td></tr></table>
- Pour chaque délai, indiquez la situation et les conditions particulières mentionnées.
- Si un délai pour une situation donnée n'est pas indiqué, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les délais de prévenance, mentionnez "RAS".
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites dans la convention.
- N'ajoutez des notes que si elles proviennent directement de la convention.
- Appliquez les règles générales : extraction uniquement des infos en vigueur, terminologie exacte, pas d'intro/conclusion.
Très important, ne pas confondre délai de prévenance avec préavis licenciement et démission, délai de prévenance c'est uniquement en cas de fin de période d'essai

---


## Période d'essai

**OBJECTIF**  
Récupérer et présenter les informations sur la période d'essai en distinguant clairement l'applicabilité des dispositions selon les règles précises d'articulation entre convention collective et loi.

**DIRECTIVES POUR LA CRÉATION DU TABLEAU HTML**  
- Priorisez un tableau HTML structuré : <table><tr><th>Catégorie</th><th>Durée CCN</th><th>Durée applicable</th><th>Justification</th><th>Renouvellement</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Pour chaque disposition, indiquez explicitement son applicabilité juridique  
- Présentez séparément les informations sur la durée initiale et sur le renouvellement  

**RÈGLES D'APPLICABILITÉ À ANALYSER ET INDIQUER CLAIREMENT**  

### **Durée initiale**  
L'application des dispositions conventionnelles ou légales dépend de la **date de signature ou de modification de la convention collective** sur ce point.

- Si la convention ou un **avenant postérieur au 27 juin 2008 modifie expressément les dispositions relatives à la période d'essai**, alors **les dispositions conventionnelles sont applicables**, à condition qu'elles soient **au moins aussi favorables que la loi**.
 - **Exemple 1** : Une convention modifiée le 12 juillet 2010 prévoit 1 mois d'essai pour les employés. Cette durée, **plus courte que la loi (2 mois)**, est **applicable** car l'avenant est postérieur à 2008.
 - **Exemple 2** : Une convention modifiée en 2012 fixe 3 mois pour les techniciens. Cette durée, **égale au maximum légal**, est **applicable**.
 - **Exemple 3** : Une convention modifiée en 2015 prévoit 5 mois pour les cadres. Cette durée **dépasse le maximum légal (4 mois)** : **elle est inapplicable**, même si elle a été signée après 2008.

- Si la convention a été signée **avant le 27 juin 2008** et **n'a pas été modifiée spécifiquement sur la période d'essai**, alors les **dispositions légales s'appliquent**.
 - **Exemple 4** : Une convention signée en 2005 prévoit 1 mois pour les employés. **Non modifiée après 2008**, cette clause est remplacée par la **durée légale de 2 mois**.
 - **Exemple 5** : Une convention de 2000 prévoit 6 mois d'essai pour les cadres. Depuis la loi **DDADUE du 21 décembre 2022**, pour les contrats signés **à partir du 10 septembre 2023**, cette clause est **inapplicable**. La durée est désormais **limitée à 4 mois maximum**, même si l'accord est antérieur à 2008.

- En cas de **texte ambigu ou silence** sur la date de modification, **analysez la source du paragraphe** :
 - **Exemple 6** : Le texte consolidé mentionne 2 mois pour les techniciens sans date. En consultant les avenants, on voit que cette clause date de 2004. **Elle est donc remplacée par la durée légale de 3 mois**, sauf preuve d'une modification ultérieure explicite.

### **À NOTER : Depuis le 10 septembre 2023**  
La loi **n° 2022-1598 du 21 décembre 2022 (dite "DDADUE")** interdit toute période d'essai plus longue que les durées légales, **même si la convention est antérieure à 2008**.  
Cette règle s'applique **à tous les contrats signés à compter du 10 septembre 2023**. Toutes les durées supérieures à :
- 2 mois (ouvriers/employés)
- 3 mois (techniciens/agents de maîtrise)
- 4 mois (cadres)  
sont **inopposables**, sauf accord plus favorable.

---

### **Renouvellement**  
Pour l'analyse du renouvellement dans la convention collective :
1. Vérifier si la convention collective prévoit expressément le renouvellement
2. Noter les conditions spécifiques mentionnées dans la convention 
3. Indiquer la durée maximale du renouvellement prévue

- **Exemple 7** : Une convention mentionne "La période d'essai des cadres peut être renouvelée une fois" → **Information à extraire**
- **Exemple 8** : Une convention précise "Le renouvellement est possible dans la limite de 2 mois supplémentaires" → **Information à extraire** 
- **Exemple 9** : La convention ne mentionne pas de renouvellement → **Indiquer "RAS" pour le renouvellement**

---

**INFORMATIONS À EXTRAIRE**  
- Durées initiales de la période d'essai par catégorie professionnelle  
- Possibilités et conditions de renouvellement  
- Durée maximale totale (incluant renouvellement)  
- Modalités de rupture pendant l'essai  
- Préavis en cas de rupture  
- Traitement des absences et prolongation  
- Date de signature de la convention collective  
- Date du dernier avenant modifiant les dispositions sur la période d'essai  

---

**FORMATAGE OBLIGATOIRE**  
- Priorisez un tableau HTML avec cette structure :
```html
<table>
<tr><th>Catégorie professionnelle</th><th>Durée CCN</th><th>Durée applicable</th><th>Justification</th><th>Renouvellement CCN</th><th>Renouvellement applicable</th><th>Durée maximale totale</th></tr>
<tr><td>Employés</td><td>X mois</td><td>Y mois</td><td>Convention post-2008/Loi s'applique</td><td>Oui/Non</td><td>Oui/Non + conditions</td><td>Z mois</td></tr>
</table>
```
- Pour chaque disposition, indiquez clairement : **"Applicable/Non applicable - Justification : Explication détaillée"**  
- Distinguez clairement les **dispositions légales** des **dispositions conventionnelles**  
- Présentez uniquement les **3 dernières versions** en cas d'évolution des dispositions  
- Indiquez **"RAS"** uniquement si la convention ne contient **aucune disposition** sur la période d'essai  

Faire suivre le tableau d'un commentaire explicatif sur l'applicabilité des dispositions, en détaillant les raisons juridiques des écarts entre dispositions conventionnelles et dispositions légales applicables.

---

## Durées du travail

OBJECTIF :
Analyser la convention collective pour identifier les durées de travail, les limites et repos spécifiquement prévus par ses dispositions.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Durée hebdomadaire de référence si spécifique.
- Durée maximale hebdomadaire (absolue et/ou moyenne).
- Durée maximale quotidienne.
- Repos quotidien minimum (durée).
- Repos hebdomadaire minimum (durée et modalités).
- Temps de pause minimum (durée et conditions).
- Dispositions spécifiques par catégorie (cadres au forfait, temps partiel, jeunes travailleurs).
- Dérogations prévues (secteurs, activités).
- Mention de l'articulation avec des accords d'entreprise si précisé.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations sous forme de liste structurée ou texte.
- Priorisez un tableau HTML si plusieurs durées/limites avec catégories différentes : <table><tr><th>Type de durée</th><th>Catégorie</th><th>Durée/Limite</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Incluez les particularités et dérogations mentionnées.
- Si une information (ex: durée max quotidienne) n'est pas définie, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur ce thème, mentionnez "RAS".
- N'ajoutez des notes que si elles proviennent directement de la convention.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : extraction uniquement des infos en vigueur, terminologie exacte, pas d'intro/conclusion.

---

## Aménagement du temps de travail

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à l'aménagement du temps de travail (annualisation, cycles, modulation, etc.), en se limitant à ce qui est écrit.

INFORMATIONS À EXTRAIRE (Pour chaque dispositif prévu par la convention) :
- Type d'aménagement et sa dénomination dans la convention.
- Période de référence applicable.
- Catégories de personnel concernées.
- Conditions de mise en place (accord, information/consultation, délai).
- Limites de variation des horaires (plancher/plafond) si spécifiées.
- Délai de prévenance pour changements de planning/horaires.
- Traitement des heures effectuées au-delà de la durée de référence (paiement, repos).
- Modalités de lissage de la rémunération si prévues.
- Méthodes de décompte du temps de travail si spécifiées.
- Traitement des absences, jours fériés (impact décompte/rémunération) si spécifié.
- Conditions de rémunération spécifiques liées à l'aménagement.
- Traitement des arrivées/départs en cours de période.
- Contreparties spécifiques si prévues.
- Particularités régionales/départementales si mentionnées.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations par type de dispositif, en utilisant des listes ou texte structuré. Utilisez la terminologie de la convention.
- Priorisez un tableau HTML si plusieurs dispositifs d'aménagement avec caractéristiques différentes : <table><tr><th>Type d'aménagement</th><th>Période de référence</th><th>Catégories concernées</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Pour chaque disposition importante, indiquez la référence (article, avenant, date, statut étendu/non étendu) si possible.
- Si un élément n'est pas mentionné pour un dispositif, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur l'aménagement du temps de travail, mentionnez "RAS".
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Heures supplémentaires

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives uniquement aux heures supplémentaires (décomptées au-delà de la durée de référence pour les temps plein), en excluant les heures complémentaires (temps partiel).

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Taux de majoration des heures supplémentaires si définis par la convention.
- Contingent annuel d'heures supplémentaires si fixé (volume, période).
- Modalités spécifiques liées au contingent (dépassement, info CSE, etc.).
- Repos compensateur de remplacement (RCR) : possibilité de remplacer paiement par repos ? Conditions ?
- Contrepartie obligatoire en repos (COR) au-delà du contingent : seuil, durée, modalités, si définis.
- Procédures de mise en œuvre (info préalable, délai prévenance HS) si prévues.
- Possibilités de refus par le salarié si encadrées.
- Périodes de référence spécifiques pour le décompte si prévues.
- Dispositions spécifiques par catégorie de personnel.
- Dispositions spécifiques régionales/départementales.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (taux, contingent, repos). Listes ou texte.
- Priorisez un tableau HTML pour les taux de majoration si plusieurs paliers ou catégories : <table><tr><th>Tranche d'heures</th><th>Taux de majoration</th><th>Catégorie</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les conditions particulières mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition spécifique sur les HS, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages.
- Présentez uniquement les taux/valeurs en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Temps partiel

OBJECTIF :
Analyser la convention collective pour extraire les dispositions spécifiques au travail à temps partiel.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Seuil minimum de durée du temps partiel si défini.
- Modalités de répartition du temps de travail (répartition horaire, jours de la semaine) si encadrées.
- Heures complémentaires : taux de majoration, contingent si définis par la convention.
- Procédures de modification des horaires (délai de prévenance, accord du salarié) si prévues.
- Priorité d'accès au temps plein si organisée.
- Dispositions spécifiques par catégorie de personnel.
- Conditions particulières (refus, acceptation, motifs) si précisées.
- Garanties de rémunération ou avantages spécifiques si prévus.
- Modalités de décompte et de paiement des heures complémentaires.
- Dispositions spécifiques régionales/départementales.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (durée minimum, heures complémentaires, procédures). Listes ou texte.
- Priorisez un tableau HTML si plusieurs seuils, taux ou catégories avec règles différentes : <table><tr><th>Catégorie/Seuil</th><th>Durée minimum</th><th>Taux heures complémentaires</th><th>Contingent</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les procédures et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition spécifique sur le temps partiel, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et durées.
- Présentez uniquement les dispositions en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Forfait jours

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au forfait jours, en distinguant les modalités applicables selon la taille de l'entreprise et les accords complémentaires.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Catégories de personnel éligibles au forfait jours (critères, fonctions, statuts).
- Nombre de jours forfaitaires annuels par catégorie si défini.
- Possibilités et conditions de dépassement du forfait.
- Modalités de suivi de la charge de travail et des horaires.
- Repos obligatoires (quotidien, hebdomadaire) et garanties.
- Jours de repos supplémentaires accordés si prévus.
- Procédures de mise en place du forfait (accord individuel, collectif).
- Modalités de décompte et de contrôle.
- Rémunération des jours supplémentaires si prévue.
- Articulation avec les accords d'entreprise.
- Dispositions spécifiques selon la taille d'entreprise.
- Garanties de déconnexion si mentionnées.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (catégories éligibles, nombre de jours, modalités). Listes ou texte.
- Priorisez un tableau HTML si plusieurs catégories de personnel avec forfaits différents : <table><tr><th>Catégorie de personnel</th><th>Nombre de jours forfaitaires</th><th>Conditions d'éligibilité</th><th>Modalités de suivi</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les conditions et procédures mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur le forfait jours, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## CET

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au Compte Épargne Temps (CET), en se limitant strictement aux modalités prévues par la convention.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Existence et mise en place du CET (conditions, procédures).
- Droits épargnables (congés payés, RTT, heures supplémentaires, jours forfait, primes).
- Plafonds d'alimentation et de détention du CET.
- Modalités d'utilisation (prise en temps, monétisation, formation, retraite).
- Valorisation des droits épargnés (maintien du salaire, forfait).
- Procédures de gestion et de suivi du CET.
- Transfert du CET en cas de mobilité (conditions).
- Sort du CET en cas de rupture du contrat.
- Articulation avec les accords d'entreprise.
- Dispositions spécifiques par catégorie de personnel.
- Modalités de mise en place au niveau de l'entreprise.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (mise en place, alimentation, utilisation). Listes ou texte.
- Priorisez un tableau HTML si plusieurs types de droits épargnables avec règles différentes : <table><tr><th>Type de droit épargnable</th><th>Plafond</th><th>Modalités d'utilisation</th><th>Valorisation</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les procédures et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur le CET, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Congés payés

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux congés payés, en distinguant les droits légaux des avantages conventionnels.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Durée des congés payés si supérieure au minimum légal.
- Congés supplémentaires liés à l'ancienneté (durée, conditions).
- Modalités de prise des congés (fractionnement, période, contraintes).
- Indemnité de congés payés (mode de calcul si spécifique).
- Congés pour événements particuliers (mariage, naissance, etc.) si prévus.
- Jours de fractionnement supplémentaires si accordés.
- Modalités de report des congés non pris.
- Dispositions spécifiques par catégorie de personnel.
- Congés pour anciens combattants ou situations particulières si prévus.
- Articulation avec la fermeture d'entreprise.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (durée de base, congés supplémentaires, modalités). Listes ou texte.
- Priorisez un tableau HTML si congés supplémentaires par ancienneté ou catégorie : <table><tr><th>Ancienneté/Catégorie</th><th>Congés supplémentaires</th><th>Conditions</th><th>Modalités</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les conditions et modalités mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient que les dispositions légales, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement les avantages conventionnels en sus du minimum légal.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Événements familiaux

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux congés pour événements familiaux, en se limitant aux dispositions spécifiquement prévues.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Congés pour mariage du salarié (durée, conditions).
- Congés pour PACS (durée, conditions) si prévus.
- Congés pour naissance ou adoption (durée, conditions).
- Congés pour mariage d'un enfant (durée, conditions).
- Congés pour décès (conjoint, enfant, parents, beaux-parents, etc.) avec durée selon le lien de parenté.
- Congés pour autres événements familiaux spécifiquement mentionnés.
- Modalités de prise (justificatifs, délai de prévenance).
- Rémunération de ces congés (maintien du salaire, indemnisation).
- Dispositions spécifiques par catégorie de personnel.
- Cumul ou fractionnement des congés si prévu.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée par type d'événement.
- Priorisez un tableau HTML pour présenter les différents événements et durées : <table><tr><th>Événement familial</th><th>Durée du congé</th><th>Conditions</th><th>Rémunération</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les conditions particulières mentionnées.
- Si un événement n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les événements familiaux, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement les dispositions en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Cotisations prévoyance

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux cotisations de prévoyance obligatoire et facultative, en se limitant aux modalités prévues par la convention.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Régimes de prévoyance obligatoires (garanties couvertes).
- Cotisations et taux applicables (part patronale, part salariale).
- Assiette de cotisation (salaire, plafond, etc.).
- Catégories de personnel concernées.
- Organismes assureurs désignés si mentionnés.
- Prestations couvertes (décès, incapacité, invalidité, etc.).
- Modalités d'adhésion et de prise d'effet.
- Régimes facultatifs supplémentaires si prévus.
- Exonérations ou conditions particulières.
- Évolutions prévues des taux ou garanties.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée par type de garantie et catégorie.
- Priorisez un tableau HTML pour les cotisations et taux : <table><tr><th>Type de garantie</th><th>Catégorie</th><th>Taux total</th><th>Part patronale</th><th>Part salariale</th><th>Assiette</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td><td>Valeur6</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la prévoyance, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages (25,5 %).
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Cotisations mutuelle

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux cotisations de complémentaire santé (mutuelle) obligatoire et facultative.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Régimes de complémentaire santé obligatoires.
- Cotisations et taux applicables (part patronale, part salariale).
- Assiette de cotisation si spécifiée.
- Catégories de personnel concernées.
- Organismes assureurs désignés si mentionnés.
- Garanties de base obligatoires.
- Options facultatives et surcomplémentaires si prévues.
- Couverture familiale (conjoint, enfants) et modalités.
- Modalités d'adhésion et de prise d'effet.
- Exonérations ou dispenses si prévues.
- Évolutions prévues des taux ou garanties.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée par type de couverture et catégorie.
- Priorisez un tableau HTML pour les cotisations et garanties : <table><tr><th>Type de couverture</th><th>Catégorie</th><th>Taux total</th><th>Part patronale</th><th>Part salariale</th><th>Garanties</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td><td>Valeur6</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la complémentaire santé, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages (25,5 %).
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Accident du travail

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au maintien de salaire en cas d'accident du travail et de maladie professionnelle.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Conditions de maintien du salaire (ancienneté, délai de carence).
- Durée du maintien de salaire (en jours, mois).
- Taux de maintien du salaire (pourcentage, dégressivité).
- Modalités de calcul (salaire de référence, éléments inclus/exclus).
- Articulation avec les prestations de la Sécurité sociale.
- Formalités à accomplir (certificat médical, déclaration).
- Dispositions spécifiques par catégorie de personnel.
- Rechutes et accidents successifs (traitement spécifique).
- Cas d'exclusion du maintien de salaire si prévus.
- Évolutions du maintien selon l'ancienneté.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (conditions, durée, taux). Listes ou texte.
- Priorisez un tableau HTML si maintien de salaire différent selon ancienneté ou catégorie : <table><tr><th>Ancienneté/Catégorie</th><th>Durée du maintien</th><th>Taux de maintien</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur l'AT/MP, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et durées.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Maladie

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au maintien de salaire en cas de maladie.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Conditions de maintien du salaire (ancienneté, délai de carence).
- Durée du maintien de salaire (en jours, mois).
- Taux de maintien du salaire (pourcentage, dégressivité).
- Modalités de calcul (salaire de référence, éléments inclus/exclus).
- Articulation avec les prestations de la Sécurité sociale.
- Formalités à accomplir (certificat médical, délais).
- Dispositions spécifiques par catégorie de personnel.
- Arrêts répétés ou rechutes (traitement spécifique).
- Cas d'exclusion du maintien de salaire si prévus.
- Évolutions du maintien selon l'ancienneté.
- Maladie de longue durée (dispositions particulières).

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (conditions, durée, taux). Listes ou texte.
- Priorisez un tableau HTML si maintien de salaire différent selon ancienneté ou catégorie : <table><tr><th>Ancienneté/Catégorie</th><th>Durée du maintien</th><th>Taux de maintien</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la maladie, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et durées.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Maternité/Paternité

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au maintien de salaire pendant les congés de maternité, paternité et d'accueil de l'enfant.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Maintien du salaire pendant le congé de maternité (conditions, durée, taux).
- Maintien du salaire pendant le congé de paternité et d'accueil de l'enfant (conditions, durée, taux).
- Modalités de calcul du maintien de salaire.
- Articulation avec les prestations de la Sécurité sociale.
- Conditions d'ancienneté requises.
- Dispositions spécifiques par catégorie de personnel.
- Congés supplémentaires pour adoption si prévus.
- Formalités à accomplir.
- Cas particuliers (grossesse pathologique, naissances multiples).
- Garanties d'évolution professionnelle.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée par type de congé (maternité, paternité). Listes ou texte.
- Priorisez un tableau HTML si maintien différent selon type de congé ou catégorie : <table><tr><th>Type de congé</th><th>Catégorie</th><th>Durée du maintien</th><th>Taux de maintien</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la maternité/paternité, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et durées.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Apprenti

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux apprentis, en se limitant aux modalités spécifiquement prévues.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Rémunération des apprentis (pourcentage du SMIC, grille spécifique).
- Évolution de la rémunération selon l'âge et l'année d'apprentissage.
- Avantages complémentaires accordés aux apprentis.
- Modalités de formation et d'accompagnement.
- Durée du temps de travail et aménagements.
- Congés spécifiques aux apprentis.
- Dispositions relatives à l'évaluation et à l'examen.
- Conditions de rupture du contrat d'apprentissage.
- Dispositions spécifiques par type de formation ou secteur.
- Articulation avec les accords de branche ou d'entreprise.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (rémunération, formation, conditions). Listes ou texte.
- Priorisez un tableau HTML pour la rémunération si plusieurs niveaux selon âge/année : <table><tr><th>Âge/Année d'apprentissage</th><th>Pourcentage SMIC</th><th>Montant</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les apprentis, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et montants.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Contrat de professionnalisation

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux contrats de professionnalisation.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Rémunération des titulaires de contrats de professionnalisation (pourcentage du SMIC, grille spécifique).
- Évolution de la rémunération selon l'âge et le niveau de qualification.
- Modalités de formation et de tutorat.
- Durée du contrat et possibilités de renouvellement.
- Temps de formation (pourcentage, modalités).
- Avantages complémentaires accordés.
- Conditions d'évaluation et de validation des acquis.
- Perspectives d'embauche à l'issue du contrat.
- Dispositions spécifiques par type de qualification visée.
- Articulation avec les dispositifs de formation.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (rémunération, formation, durée). Listes ou texte.
- Priorisez un tableau HTML pour la rémunération si plusieurs niveaux selon âge/qualification : <table><tr><th>Âge/Niveau</th><th>Pourcentage SMIC</th><th>Montant</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les contrats de professionnalisation, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et montants.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Stagiaire

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux stagiaires.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Gratification des stagiaires (montant, conditions).
- Durée maximale des stages.
- Modalités d'encadrement et de tutorat.
- Avantages accordés aux stagiaires (restauration, transport, etc.).
- Conditions d'accueil et d'intégration.
- Évaluation des stages et validation.
- Perspectives d'embauche à l'issue du stage.
- Dispositions spécifiques par type de stage ou formation.
- Obligations de l'entreprise envers les stagiaires.
- Articulation avec les établissements de formation.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (gratification, durée, modalités). Listes ou texte.
- Priorisez un tableau HTML si gratification différente selon durée ou type de stage : <table><tr><th>Type/Durée de stage</th><th>Gratification</th><th>Avantages</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les stagiaires, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les montants et pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Majoration dimanche

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux majorations pour le travail du dimanche.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Taux de majoration pour le travail du dimanche.
- Conditions d'application (secteurs, activités, dérogations).
- Modalités de compensation (repos compensateur, paiement).
- Dispositions spécifiques par catégorie de personnel.
- Heures concernées par la majoration.
- Cumul avec d'autres majorations (heures supplémentaires, nuit).
- Conditions de mise en œuvre du travail dominical.
- Garanties accordées aux salariés (volontariat, refus).
- Repos compensateur spécifique au travail dominical.
- Articulation avec la réglementation légale.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (taux, conditions, modalités). Listes ou texte.
- Priorisez un tableau HTML si majorations différentes selon catégorie ou conditions : <table><tr><th>Catégorie/Conditions</th><th>Taux de majoration</th><th>Modalités de compensation</th><th>Conditions d'application</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur le travail du dimanche, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Majoration jours fériés

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux compensations pour le travail les jours fériés.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Taux de majoration pour le travail les jours fériés.
- Jours fériés concernés par les majorations.
- Conditions d'application (secteurs, activités).
- Modalités de compensation (repos compensateur, paiement).
- Dispositions spécifiques par catégorie de personnel.
- Cumul avec d'autres majorations.
- Traitement des jours fériés tombant un dimanche.
- Jours fériés locaux ou régionaux si mentionnés.
- Garanties accordées aux salariés (volontariat, refus).
- Articulation avec la réglementation applicable.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (jours concernés, taux, modalités). Listes ou texte.
- Priorisez un tableau HTML si majorations différentes selon jour férié ou catégorie : <table><tr><th>Jour férié</th><th>Catégorie</th><th>Taux de majoration</th><th>Modalités de compensation</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les jours fériés, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Majoration travail de nuit

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux compensations pour le travail de nuit.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Définition des heures de nuit si spécifiée par la convention.
- Taux de majoration pour le travail de nuit.
- Conditions d'application (durée minimale, secteurs).
- Modalités de compensation (repos compensateur, paiement).
- Dispositions spécifiques par catégorie de personnel.
- Cumul avec d'autres majorations.
- Garanties spécifiques aux travailleurs de nuit.
- Suivi médical particulier si prévu.
- Conditions de mise en œuvre du travail de nuit.
- Articulation avec la réglementation légale.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (définition, taux, conditions). Listes ou texte.
- Priorisez un tableau HTML si majorations différentes selon plage horaire ou catégorie : <table><tr><th>Plage horaire</th><th>Catégorie</th><th>Taux de majoration</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur le travail de nuit, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages et heures.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Classification

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à la classification professionnelle des salariés.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Structure de la classification (niveaux, échelons, coefficients).
- Critères de classement (formation, expérience, responsabilité, autonomie).
- Définition des catégories professionnelles.
- Correspondance entre classifications et fonctions/métiers.
- Modalités d'évolution dans la classification.
- Procédures de révision de classification.
- Garanties en cas de changement de classification.
- Classifications spécifiques par secteur d'activité.
- Articulation avec les accords d'entreprise.
- Dispositions transitoires si prévues.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (structure, critères, évolution).
- Priorisez un tableau HTML pour présenter la structure de classification : <table><tr><th>Niveau</th><th>Échelon</th><th>Coefficient</th><th>Définition/Critères</th><th>Exemples de postes</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les critères et modalités mentionnés.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la classification, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement la classification en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Grille de rémunération

OBJECTIF :
Analyser la convention collective pour extraire les grilles de rémunération minimale conventionnelle.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Salaires minima par coefficient/niveau/échelon.
- Date d'effet des grilles de salaires.
- Modalités de revalorisation (périodicité, méthode).
- Différenciations géographiques si prévues.
- Dispositions spécifiques par catégorie de personnel.
- Éléments de rémunération inclus dans la grille (base, primes, avantages).
- Garanties d'évolution salariale.
- Articulation avec les augmentations individuelles.
- Mécanismes d'indexation si prévus.
- Dispositions transitoires pour application de nouvelles grilles.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée.
- Priorisez un tableau HTML pour présenter les grilles de salaires : <table><tr><th>Niveau/Coefficient</th><th>Échelon</th><th>Salaire minimum mensuel</th><th>Salaire minimum horaire</th><th>Date d'effet</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les modalités de revalorisation mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune grille de rémunération, mentionnez "RAS".
- Pour chaque grille, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les montants (1 234,56 €).
- Présentez uniquement les grilles en vigueur (5 dernières valeurs si évolutives).
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Préavis

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives aux durées de préavis en cas de licenciement ou de démission.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Durées de préavis par catégorie professionnelle et ancienneté.
- Préavis spécifiques selon le motif de rupture.
- Modalités de calcul du préavis (jours ouvrables, calendaires).
- Dispense de préavis (conditions, initiative).
- Exécution du préavis (travail effectif, dispense).
- Indemnité compensatrice de préavis.
- Préavis réduits ou supprimés dans certains cas.
- Dispositions spécifiques par secteur d'activité.
- Articulation avec les accords d'entreprise.
- Cas particuliers (faute, inaptitude, etc.).

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (durées, modalités, cas particuliers).
- Priorisez un tableau HTML pour présenter les durées de préavis : <table><tr><th>Catégorie professionnelle</th><th>Ancienneté</th><th>Préavis licenciement</th><th>Préavis démission</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur les préavis, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Présentez uniquement les dispositions en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Indemnité de licenciement

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives au calcul de l'indemnité de licenciement.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Formule de calcul de l'indemnité (taux par année d'ancienneté).
- Ancienneté minimale pour bénéficier de l'indemnité.
- Tranches d'ancienneté et taux différenciés.
- Salaire de référence pour le calcul (modalités de détermination).
- Plafonds ou planchers d'indemnisation si prévus.
- Dispositions spécifiques par catégorie de personnel.
- Cas d'exclusion ou de réduction de l'indemnité.
- Modalités de calcul de l'ancienneté.
- Indemnités particulières selon les motifs de licenciement.
- Articulation avec l'indemnité légale.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (formule, conditions, modalités).
- Priorisez un tableau HTML pour présenter les taux d'indemnisation : <table><tr><th>Ancienneté</th><th>Catégorie</th><th>Taux d'indemnisation</th><th>Base de calcul</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td><td>Valeur5</td></tr></table>
- Détaillez les modalités de calcul mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur l'indemnité de licenciement, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les fractions et pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Indemnité de mise à la retraite

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à l'indemnité de mise à la retraite par l'employeur.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Formule de calcul de l'indemnité de mise à la retraite.
- Ancienneté minimale pour bénéficier de l'indemnité.
- Conditions d'âge pour la mise à la retraite.
- Salaire de référence pour le calcul.
- Dispositions spécifiques par catégorie de personnel.
- Modalités de mise en œuvre de la mise à la retraite.
- Préavis spécifique à la mise à la retraite.
- Cumul avec d'autres indemnités.
- Procédures à respecter par l'employeur.
- Articulation avec la réglementation légale.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (formule, conditions, modalités).
- Priorisez un tableau HTML si indemnités différentes selon ancienneté ou catégorie : <table><tr><th>Ancienneté</th><th>Catégorie</th><th>Indemnité de mise à la retraite</th><th>Conditions d'âge</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la mise à la retraite, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les montants et pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Indemnité de départ à la retraite

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à l'indemnité de départ volontaire à la retraite.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Formule de calcul de l'indemnité de départ à la retraite.
- Ancienneté minimale pour bénéficier de l'indemnité.
- Conditions d'âge pour le départ volontaire.
- Salaire de référence pour le calcul.
- Dispositions spécifiques par catégorie de personnel.
- Modalités de demande de départ à la retraite.
- Préavis en cas de départ volontaire.
- Cumul avec d'autres indemnités.
- Procédures à respecter par le salarié.
- Articulation avec les régimes de retraite.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (formule, conditions, modalités).
- Priorisez un tableau HTML si indemnités différentes selon ancienneté ou catégorie : <table><tr><th>Ancienneté</th><th>Catégorie</th><th>Indemnité de départ retraite</th><th>Conditions d'âge</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur le départ à la retraite, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les montants et pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Indemnité de rupture conventionnelle

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à l'indemnité de rupture conventionnelle.

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Formule de calcul de l'indemnité de rupture conventionnelle.
- Montant minimum garanti si prévu.
- Conditions spécifiques à la rupture conventionnelle.
- Dispositions spécifiques par catégorie de personnel.
- Modalités de négociation de l'indemnité.
- Cumul avec d'autres indemnités.
- Procédures particulières prévues par la convention.
- Délais et formalités spécifiques.
- Garanties supplémentaires accordées.
- Articulation avec la procédure légale.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (formule, conditions, modalités).
- Priorisez un tableau HTML si indemnités différentes selon ancienneté ou catégorie : <table><tr><th>Ancienneté</th><th>Catégorie</th><th>Indemnité minimum</th><th>Modalités de calcul</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les modalités et conditions mentionnées.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur la rupture conventionnelle, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les montants et pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.

---

## Indemnité de précarité

OBJECTIF :
Analyser la convention collective pour extraire les dispositions relatives à l'indemnité de fin de contrat à durée déterminée (indemnité de précarité).

INFORMATIONS À EXTRAIRE (Strictement issues de la convention) :
- Taux de l'indemnité de précarité si différent du taux légal.
- Conditions d'attribution de l'indemnité.
- Cas d'exonération ou de suppression de l'indemnité.
- Modalités de calcul de l'indemnité.
- Dispositions spécifiques par type de CDD.
- Articulation avec le renouvellement de contrat.
- Dispositions spécifiques par catégorie de personnel.
- Modalités de versement de l'indemnité.
- Cumul avec d'autres indemnités.
- Dispositions particulières pour certains secteurs.

INSTRUCTIONS IMPORTANTES POUR VOTRE RÉPONSE :
- Présentez les informations de manière structurée (taux, conditions, modalités).
- Priorisez un tableau HTML si taux différents selon type de CDD ou catégorie : <table><tr><th>Type de CDD</th><th>Catégorie</th><th>Taux d'indemnité</th><th>Conditions</th></tr><tr><td>Valeur1</td><td>Valeur2</td><td>Valeur3</td><td>Valeur4</td></tr></table>
- Détaillez les conditions et cas d'exonération mentionnés.
- Si un élément n'est pas mentionné, indiquez "La convention ne prévoit rien à ce sujet".
- Si la convention ne contient aucune disposition sur l'indemnité de précarité, mentionnez "RAS".
- Pour chaque disposition clé, indiquez la référence (article, avenant, date, statut étendu/non étendu).
- Utilisez le format français pour les pourcentages.
- Présentez uniquement les modalités en vigueur.
- Ne faites aucune analyse ni projection. Ne mentionnez jamais l'application de règles non écrites.
- Appliquez les règles générales : terminologie exacte, pas d'intro/conclusion.