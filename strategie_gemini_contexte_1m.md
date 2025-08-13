# STRATÉGIE OPTIMISÉE GEMINI 2.5 PRO - CONTEXTE 1M TOKENS

## 📊 DONNÉES RÉELLES CONFIRMÉES
- **584 conventions collectives téléchargées**
- **922MB de documentation** (vs 0.90GB estimé)
- **Plus grosse convention** : 63MB (Bâtiment et TP)
- **Contexte disponible** : 1M tokens Gemini 2.5 Pro

## 🎯 NOUVELLE ARCHITECTURE ULTRA-OPTIMISÉE

### **🚀 BLOC 1 : SECTIONS SIMPLES (18 sections en 1 appel)**
**Modèle** : Gemini 2.5 Pro (1M contexte)
**Stratégie** : 18 sections simultanées par convention

**Sections groupées :**
```
1. Informations générales
2. Délai de prévenance  
3. Durées du travail
4. Aménagement du temps de travail
5. Temps partiel
6. CET
7. Événement familial
8. Cotisation prévoyance
9. Cotisation mutuelle
10. Accident de travail
11. Maladie
12. Maternité/Paternité
13. Apprenti
14. Contrat de professionnalisation
15. Stagiaire
16. Majoration Dimanche
17. Majoration Férié
18. Majoration Nuit
```

### **⚡ BLOC 2 : SECTIONS MOYENNES (10 sections en 1 appel)**
**Modèle** : Gemini 2.5 Pro (1M contexte)
**Stratégie** : 10 sections simultanées par convention

**Sections groupées :**
```
19. Heures supplémentaires
20. Forfait jours
21. Congés payés
22. Classification + Détails
23. Indemnité de Licenciement
24. Indemnité de Mise à la Retraite
25. Indemnité de Départ à la Retraite
26. Indemnité de Rupture conventionnelle
27. Préavis
28. Indemnité de précarité
```

### **🎯 BLOC 3 : SECTIONS ULTRA-COMPLEXES (6 sections séparées)**
**Modèle** : Claude 4 Sonnet (200K contexte)
**Stratégie** : 1 section à la fois pour précision maximale

**Sections individuelles :**
```
29. Période d'essai (analyse juridique post-2008)
30. Primes/Indemnités/Avantages (recherche exhaustive)
31. Grille de Rémunération (tableaux + renvois obligatoires)
32. Contributions Formation Professionnelle
33. Cotisation retraite
34. [Section finale selon détection]
```

## 🧮 CALCULS COÛTS OPTIMISÉS

### **💰 NOUVEAU BUDGET RÉALISTE :**

**Gemini 2.5 Pro (Blocs 1 & 2) :**
```
• 584 conventions × 2 appels (bloc 1 + bloc 2) = 1,168 appels
• Input : ~100K tokens/appel × $1.25/M = ~$146
• Output : ~20K tokens/appel × $2.50/M = ~$58
• Sous-total Gemini : ~$204
```

**Claude 4 Sonnet (Bloc 3) :**
```
• 584 conventions × 6 sections = 3,504 appels
• Input : ~50K tokens/appel × $3.00/M = ~$525
• Output : ~5K tokens/appel × $15.00/M = ~$263
• Sous-total Claude : ~$788
```

**TOTAL OPTIMISÉ : ~$992** (vs $4,500 tout Claude)
**ÉCONOMIE : 78% de réduction !**

## 🔧 GESTION CONTEXTE ET CHUNKING

### **📄 STRATÉGIE CHUNKING INTELLIGENT :**

**Pour conventions > 800K tokens (environ 50+ conventions) :**

1. **Découpage thématique** par grandes sections juridiques
2. **Préservation liens** entre sections via mapping intelligent  
3. **Reconstitution** avec validation croisée automatique
4. **Détection automatique** : Si PDF > 40MB → chunking activé

### **🔀 TRAITEMENT PARALLÈLE POSSIBLE :**

**Gemini 2.5 Pro :**
- **Limite rate** : 1,000 requêtes/minute
- **Parallélisme** : 8-10 threads simultanés
- **Temps estimé Bloc 1+2** : ~2 heures pour 584 conventions

**Claude 4 Sonnet :**
- **Limite rate** : 1,000 requêtes/minute  
- **Parallélisme** : 5-6 threads simultanés
- **Temps estimé Bloc 3** : ~1 heure pour 584 conventions

**TEMPS TOTAL : ~3 heures** pour extraction complète !

## 📝 PROMPTS MULTI-SECTIONS

### **🚀 PROMPT BLOC 1 (18 sections simples) :**
```markdown
# EXTRACTION 18 SECTIONS SIMPLES - CONVENTION [IDCC]

Analysez cette convention collective pour extraire simultanément les 18 sections suivantes.
Répondez avec le format JSON structuré :

{
  "informations-generales": { ... },
  "delai-prevenance": { ... },
  "durees-travail": { ... },
  // ... 15 autres sections
}

## RÈGLES COMMUNES :
- Si section vide : {"contenu": "RAS"}
- Terminologie exacte de la convention
- Format français pour chiffres/dates
- AUCUNE analyse ni interprétation

[PROMPT DÉTAILLÉ POUR CHAQUE SECTION]
```

### **⚡ PROMPT BLOC 2 (10 sections moyennes) :**
```markdown
# EXTRACTION 10 SECTIONS MOYENNES - CONVENTION [IDCC]

Analysez cette convention pour extraire les 10 sections de complexité moyenne.
Retour JSON structuré avec tableaux si nécessaires.

[PROMPT SPÉCIALISÉ AVEC GESTION TABLEAUX]
```

### **🎯 PROMPT BLOC 3 (1 section complexe) :**
```markdown
# EXTRACTION SECTION COMPLEXE : [SECTION_NAME]

Analyse approfondie avec raisonnement structuré pour cette section critique.
Gestion complète des cas particuliers et formatage spécialisé.

[PROMPT ULTRA-DÉTAILLÉ SECTION PAR SECTION]
```

## 🎯 AVANTAGES STRATÉGIE OPTIMISÉE

### **✅ BÉNÉFICES MAJEURS :**

1. **Réduction massive des appels** : 1,168 + 3,504 = 4,672 vs 19,856
2. **Économie 78%** : $992 vs $4,500
3. **Temps divisé par 3** : 3h vs 9h+
4. **Qualité préservée** sur sections critiques (grilles salaires)
5. **Parallélisation maximale** possible
6. **Gestion automatique** du chunking pour gros PDFs

Cette approche vous donne le **meilleur des deux mondes** : économie massive sur les sections standards ET qualité maximale sur les sections critiques !