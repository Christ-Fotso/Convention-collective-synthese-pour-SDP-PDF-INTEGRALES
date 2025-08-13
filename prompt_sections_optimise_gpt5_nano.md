# PROMPT SECTIONS OPTIMISÉ POUR ARCHITECTURE GPT-5 NANO + OUTILS

## STRATÉGIE DE TRAITEMENT PAR COMPLEXITÉ

### 🚀 **SECTIONS SIMPLES → GPT-5 NANO** (18 sections)
Traitement rapide et économique avec prompts standardisés :

1. **Informations générales** - Extraction basique de métadonnées
2. **Délai de prévenance** - Recherche simple durées fin d'essai
3. **Durées du travail** - Limites horaires standards
4. **Aménagement du temps de travail** - Dispositifs d'organisation
5. **Temps partiel** - Règles heures complémentaires
6. **CET** - Existence et modalités basiques
7. **Événement familial** - Liste congés et durées
8. **Cotisation prévoyance** - Organismes et taux
9. **Cotisation mutuelle** - Régime complémentaire santé
10. **Accident de travail** - Maintien salaire AT/MP
11. **Maladie** - Maintien salaire maladie ordinaire
12. **Maternité/Paternité** - Maintien salaire congés familiaux
13. **Apprenti** - Rémunération et conditions spécifiques
14. **Contrat de professionnalisation** - Dispositions particulières
15. **Stagiaire** - Gratification et encadrement
16. **Majoration Dimanche** - Compensations travail dominical
17. **Majoration Férié** - Compensations jours fériés
18. **Majoration Nuit** - Définition et compensations nuit

### ⚡ **SECTIONS MOYENNES → GPT-5 MINI** (10 sections)  
Complexité modérée nécessitant plus de contexte :

19. **Heures supplémentaires** - Taux, contingents, repos compensateur
20. **Forfait jours** - Cadres au forfait, suivi charge travail
21. **Congés payés** - Durées, acquisition, fractionnement
22. **Classification + Détails** - Structure classifications (tableau moyen)
23. **Indemnité de Licenciement** - Calculs par tranches ancienneté
24. **Indemnité de Mise à la Retraite** - Formules spécifiques
25. **Indemnité de Départ à la Retraite** - Paliers selon ancienneté
26. **Indemnité de Rupture conventionnelle** - Dispositions particulières
27. **Préavis** - Durées par catégorie et motif (tableau)
28. **Indemnité de précarité** - Taux et exclusions CDD

### 🎯 **SECTIONS COMPLEXES → CLAUDE 4 SONNET** (6 sections)
Ultra-complexes nécessitant reasoning avancé :

29. **Période d'essai** - Analyse juridique post-2008, applicabilité
30. **Primes/Indemnités/Avantages** - Recherche exhaustive, exclusions multiples
31. **Grille de Rémunération** - Tableaux complexes, renvois, dates/statuts
32. **Contributions Formation Professionnelle** - Calculs spécialisés
33. **Cotisation retraite** - Régimes complémentaires complexes
34. **Section finale** - Selon complexité détectée

## CORRECTIONS ANTI-REDONDANCE APPLIQUÉES

### ❌ **ÉLIMINATION RÉPÉTITIONS "RAS" :**
```
AVANT: "Si aucune disposition... mentionnez RAS"
APRÈS: "Si aucune disposition... mentionnez RAS UNIQUEMENT si absence totale du sujet"
```

### ❌ **LIMITATION PHRASES NÉGATIVES :**
```
AVANT: Répétitions multiples "La convention ne prévoit rien"
APRÈS: "Maximum UNE occurrence par section avec groupement intelligent"
```

### ✅ **OPTIMISATION TABLEAUX :**
- **Grille Rémunération** : Conservé format complexe (nécessaire)
- **Autres sections** : Simplifié "tableau uniquement si indispensable"
- **Fusion cellules** : Spécifiée quand pertinente

## PROMPTS SPÉCIALISÉS PAR OUTIL GPT-5 NANO

### 🔧 **OUTIL 1 : EXTRACTEUR SIMPLE**
```typescript
const promptSimple = {
  "informations-generales": "Extraire métadonnées : IDCC, champ application, dates clés",
  "delai-prevenance": "Trouver UNIQUEMENT délais fin période d'essai",
  "durees-travail": "Limites horaires : quotidienne, hebdomadaire, repos"
  // ... 18 sections simples
};
```

### ⚡ **OUTIL 2 : EXTRACTEUR MOYEN**  
```typescript
const promptMoyen = {
  "heures-supplementaires": "Taux majoration, contingent, repos compensateur avec conditions",
  "conges-payes": "Durée base + jours supplémentaires ancienneté avec modalités",
  "classification": "Structure niveaux/échelons avec tableau simple"
  // ... 10 sections moyennes
};
```

### 🎯 **OUTIL 3 : EXTRACTEUR COMPLEXE**
```typescript
const promptComplexe = {
  "grille-remuneration": "Tableau 5 colonnes chronologiques + section renvois obligatoire",
  "primes-indemnites": "Recherche exhaustive 15+ types SAUF 6 exclusions absolues",
  "periode-essai": "Analyse applicabilité post-2008 + tableau dual"
  // ... 6 sections complexes
};
```

## ESTIMATION COÛTS OPTIMISÉE

### 💰 **RÉPARTITION BUDGÉTAIRE :**
```
GPT-5 Nano (18 sections × 377 conventions) = 6,786 appels
Prix : $0.15 input + $1.50 output = ~$200

GPT-5 Mini (10 sections × 377 conventions) = 3,770 appels  
Prix : $0.50 input + $5.00 output = ~$300

Claude 4 (6 sections × 377 conventions) = 2,262 appels
Prix : $3.00 input + $15.00 output = ~$800

TOTAL OPTIMISÉ : ~$1,300 vs $4,500 Claude seul
ÉCONOMIE : 71% de réduction !
```

## RÈGLES DE CHUNKING INTELLIGENT

### 📄 **POUR CONVENTIONS LOURDES (>400K tokens) :**

1. **Découpage thématique** par sections juridiques
2. **Préservation contexte** entre chunks via mapping
3. **Reconstitution intelligente** avec validation croisée
4. **Détection automatique** taille → stratégie

Cette approche vous donne le **meilleur rapport qualité-prix** avec **qualité maximale** sur les sections critiques (grilles salaires) et **économie optimale** sur les sections standards !