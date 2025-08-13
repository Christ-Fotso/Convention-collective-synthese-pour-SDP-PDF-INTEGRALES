# PROMPTS SECTIONS CORRIGÉS AVEC TABLEAUX HTML

## PROMPT PRINCIPAL EXTRACTEUR HTML

### EXTRACTION SPÉCIALISÉE AVEC TABLEAUX HTML - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire les sections suivantes avec des TABLEAUX HTML OBLIGATOIRES pour toutes les données structurées.

## RÈGLES TABLEAUX HTML STRICTES :

### 1. UTILISATION OBLIGATOIRE DES TABLEAUX HTML :
- Dès qu'il y a 2 colonnes d'informations ou plus : TABLEAU HTML
- Pour cotisations, taux, pourcentages, durées multiples : TABLEAU HTML
- Pour classifications, grilles, indemnités par tranches : TABLEAU HTML
- JAMAIS de format liste avec tirets pour des données tabulaires

### 2. FORMAT HTML EXACT REQUIS :
```html
<table>
<tr>
  <th>Colonne 1</th>
  <th>Colonne 2</th>
  <th>Colonne 3</th>
</tr>
<tr>
  <td>Valeur 1</td>
  <td>Valeur 2</td>
  <td>Valeur 3</td>
</tr>
</table>
```

### 3. RÈGLES SPÉCIFIQUES :
- Fusion de cellules identiques : `<td rowspan="2">Valeur commune</td>`
- Headers clairs : Type, Catégorie, Taux, Répartition, etc.
- Toujours inclure les unités (%, €, jours, heures)
- Séparer patronal/salarial dans des colonnes distinctes

### 4. EXEMPLES TYPES À TRANSFORMER :

**❌ INTERDIT (format liste) :**
- Capital décès : TA 0,17% (100% patronale), TB 0,17% (100% patronale)
- Rente éducation : TA 0,13% (0,0875% patronale, 0,0425% salariale)

**✅ OBLIGATOIRE (tableau HTML) :**
```html
<table>
<tr><th>Type de garantie</th><th>Catégorie TA</th><th>Catégorie TB</th><th>Part patronale</th><th>Part salariale</th></tr>
<tr><td>Capital décès</td><td>0,17%</td><td>0,17%</td><td>100%</td><td>0%</td></tr>
<tr><td>Rente éducation</td><td>0,13%</td><td>0,13%</td><td>67,3%</td><td>32,7%</td></tr>
</table>
```

## SECTIONS À EXTRAIRE :

```json
{
  "cotisation-prevoyance": {
    "contenu": "[Tableau HTML complet ou RAS]"
  },
  "cotisation-mutuelle": {
    "contenu": "[Tableau HTML complet ou RAS]"
  },
  "evenement-familial": {
    "contenu": "[Tableau HTML avec événements et durées ou RAS]"
  },
  "classification-details": {
    "contenu": "[Tableau HTML structure classifications ou RAS]"
  },
  "grille-remuneration": {
    "contenu": "[Tableau HTML grille salaires ou RAS]"
  },
  "preavis": {
    "contenu": "[Tableau HTML durées préavis ou RAS]"
  },
  "indemnite-licenciement": {
    "contenu": "[Tableau HTML calcul indemnités ou RAS]"
  },
  "heures-supplementaires": {
    "contenu": "[Tableau HTML taux majorations ou RAS]"
  }
}
```

## RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Tableaux HTML OBLIGATOIRES pour toute donnée structurée
- Si aucune info trouvée pour une section : "RAS"
- Terminologie exacte de la convention
- Format français pour chiffres/dates (1 234,56 € et 25,5%)
- Headers de tableaux en français
- AUCUNE analyse ni interprétation
- Maximum 2 niveaux d'indentation dans tableaux

---

## PROMPT SECTIONS SIMPLES CORRIGÉ (SANS HTML)

### EXTRACTION 18 SECTIONS SIMPLES - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire simultanément les 18 sections suivantes.
Répondez EXCLUSIVEMENT avec un JSON valide au format strict suivant :

```json
{
  "informations-generales": {
    "contenu": "[Contenu extrait ou RAS]",
    "idcc": "[IDCC si trouvé]",
    "champ-application": "[Champ si trouvé]"
  },
  "delai-prevenance": {
    "contenu": "[Délais fin période essai ou RAS]"
  },
  "durees-travail": {
    "contenu": "[Limites horaires ou RAS]"
  },
  "amenagement-temps-travail": {
    "contenu": "[Dispositifs aménagement ou RAS]"
  },
  "temps-partiel": {
    "contenu": "[Règles temps partiel ou RAS]"
  },
  "cet": {
    "contenu": "[Compte épargne temps ou RAS]"
  },
  "evenement-familial": {
    "contenu": "[Congés événements familiaux ou RAS]"
  },
  "cotisation-prevoyance": {
    "contenu": "[Prévoyance obligatoire ou RAS]"
  },
  "cotisation-mutuelle": {
    "contenu": "[Complémentaire santé ou RAS]"
  },
  "accident-travail": {
    "contenu": "[Maintien salaire AT/MP ou RAS]"
  },
  "maladie": {
    "contenu": "[Maintien salaire maladie ou RAS]"
  },
  "maternite-paternite": {
    "contenu": "[Maintien salaire congés familiaux ou RAS]"
  },
  "apprenti": {
    "contenu": "[Rémunération apprentis ou RAS]"
  },
  "contrat-professionnalisation": {
    "contenu": "[Dispositions contrats pro ou RAS]"
  },
  "stagiaire": {
    "contenu": "[Gratification stagiaires ou RAS]"
  },
  "majoration-dimanche": {
    "contenu": "[Compensations travail dimanche ou RAS]"
  },
  "majoration-ferie": {
    "contenu": "[Compensations jours fériés ou RAS]"
  },
  "majoration-nuit": {
    "contenu": "[Compensations travail nuit ou RAS]"
  }
}
```

### RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Si aucune info trouvée pour une section : "RAS"
- Terminologie exacte de la convention
- Format français pour chiffres/dates
- AUCUNE analyse ni interprétation
- Extraction des informations strictement présentes

---

## PROMPT SECTIONS MOYENNES CORRIGÉ (SANS HTML)

### EXTRACTION 10 SECTIONS MOYENNES - CONVENTION COLLECTIVE

Analysez cette convention collective pour extraire les 10 sections de complexité moyenne.
Répondez EXCLUSIVEMENT avec un JSON valide au format strict suivant :

```json
{
  "heures-supplementaires": {
    "contenu": "[Taux, contingent, repos compensateur ou RAS]"
  },
  "forfait-jours": {
    "contenu": "[Cadres forfait jours, suivi charge ou RAS]"
  },
  "conges-payes": {
    "contenu": "[Durées CP, jours supplémentaires ou RAS]"
  },
  "classification-details": {
    "contenu": "[Structure classifications détaillée ou RAS]"
  },
  "indemnite-licenciement": {
    "contenu": "[Formule calcul indemnité licenciement ou RAS]"
  },
  "indemnite-mise-retraite": {
    "contenu": "[Indemnité mise à la retraite ou RAS]"
  },
  "indemnite-depart-retraite": {
    "contenu": "[Indemnité départ volontaire retraite ou RAS]"
  },
  "indemnite-rupture-conventionnelle": {
    "contenu": "[Indemnité rupture conventionnelle ou RAS]"
  },
  "preavis": {
    "contenu": "[Durées préavis par catégorie ou RAS]"
  },
  "indemnite-precarite": {
    "contenu": "[Indemnité fin CDD ou RAS]"
  }
}
```

### RÈGLES STRICTES :
- Réponse JSON valide UNIQUEMENT
- Si aucune info trouvée pour une section : "RAS"
- Tableaux autorisés si nécessaires (format texte)
- Terminologie exacte de la convention
- Format français pour chiffres/dates
- AUCUNE analyse ni interprétation
- Extraction détaillée avec conditions et modalités

---

## INSTRUCTIONS GÉNÉRALES COMMUNES

### PRINCIPES DE BASE

1. **Extraction Stricte et en Vigueur :**
   - Extraire **uniquement** les informations **en vigueur** issues **strictement** de la convention collective fournie
   - Ne **jamais** faire référence à des aspects illégaux ou supposer l'application de dispositions légales si la convention est muette

2. **Exhaustivité et Précision :**
   - **Toutes les facettes d'une règle :** Extraire non seulement les conditions principales mais aussi **toutes les alternatives, exceptions, modalités spécifiques**
   - **Recherche des liens :** Si le calcul dépend d'une **valeur de référence définie ailleurs**, la rechercher activement
   - **Terminologie Exacte :** Conserver la **terminologie exacte** de la convention collective

3. **Traitement de l'Absence d'Information :**
   - Si la convention ne donne pas de détail précis, mentionner : **"La convention ne prévoit rien à ce sujet"**
   - Mentionner **"RAS"** uniquement si la **totalité** de la section thématique est absente

4. **Références et Spécificités :**
   - Préciser le **statut** des accords/avenants (étendu / non étendu) et dates clés
   - **Vérifier toute spécificité régionale ou départementale**

### FORMAT DE RESTITUTION

- **Structure Claire :** Titres, sous-titres, listes à puces selon instructions
- **Usage Limité des Tableaux :** Uniquement si **indispensables** (sauf extracteur HTML)
- **Format des Données :** Format exact des montants (1 234,56 €) et pourcentages (25 %)
- **Concision :** Synthèse des informations essentielles, **5 dernières valeurs** pour évolutives
- **Pas d'Introduction/Conclusion :** Aller droit au but
- **Pas d'Interprétation :** Se cantonner aux faits présents

### VÉRIFICATION INTERNE

- **Recoupement :** Vérifier si des informations complémentaires se trouvent ailleurs
- **Exhaustivité des Facettes :** S'assurer que les alternatives et exceptions sont extraites
- **Conformité :** Relire pour respecter tous les principes (absence d'interprétation, formatage, etc.)

---

## CHOIX D'EXTRACTEUR

- **Extracteur HTML** : Pour affichage avec tableaux complexes et données structurées
- **Extracteur Classique** : Pour traitement textuel et système de production stable
- **Sections HTML prioritaires** : cotisations, classifications, grilles, indemnités, préavis
- **Format de sortie** : JSON identique, seul le contenu change (HTML vs texte)