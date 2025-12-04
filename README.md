# Convention Collective - Synthèse pour SDP (PDF Intégrales)

## 📋 Description

Ce projet est une application web complète permettant de télécharger, extraire, analyser et consulter les conventions collectives françaises. Il utilise l'intelligence artificielle pour extraire et structurer automatiquement les informations clés de chaque convention collective.

## 🎯 Fonctionnalités principales

- **Téléchargement automatique** des PDFs des conventions collectives
- **Extraction intelligente** des contenus via IA (Anthropic Claude, Google Gemini, OpenAI)
- **Structuration des données** par sections thématiques :
  - Accident de travail
  - Aménagement du temps de travail
  - Apprentissage
  - CET (Compte Épargne Temps)
  - Classifications et grilles salariales
  - Congés payés
  - Et bien d'autres...
- **Interface web moderne** pour consulter et rechercher dans les conventions
- **Système de chat** pour poser des questions sur les conventions
- **Panel d'administration** pour gérer les données
- **Base de données** structurée avec historique et versioning

## 🛠️ Technologies utilisées

### Backend
- **Node.js** avec **Express**
- **TypeScript** pour le typage statique
- **Drizzle ORM** pour la gestion de la base de données
- **PDF parsing** : pdf-parse, pdfjs-dist, pdf2pic
- **APIs IA** : Anthropic SDK, Google Generative AI, OpenAI

### Frontend
- **React 18** avec **TypeScript**
- **Wouter** pour le routing
- **TanStack Query** pour la gestion d'état
- **Radix UI** pour les composants UI
- **Tailwind CSS** pour le styling
- **Framer Motion** pour les animations

### Python (Scripts de téléchargement)
- **Requests** pour les requêtes HTTP
- **urllib3** pour la gestion des URLs

## 📦 Installation

### Prérequis
- Node.js 20.x ou supérieur
- Python 3.11 ou supérieur
- npm ou pnpm

### Installation des dépendances

#### Node.js
```bash
npm install
```

#### Python
```bash
pip install -r requirements.txt
# ou avec uv
uv sync
```

## 🚀 Utilisation

### Développement

#### Lancer le serveur de développement
```bash
npm run dev
```

Le serveur démarre par défaut sur `http://localhost:5000` (backend) et l'interface sur `http://localhost:5173` (frontend).

### Build de production

```bash
npm run build
```

### Démarrer en production

```bash
npm start
```

## 🗄️ Base de données

### Initialiser/Mettre à jour le schéma
```bash
npm run db:push
```

### Importer les sections
```bash
./import-sections.sh
```

## 📥 Téléchargement des PDFs

Plusieurs scripts Python sont disponibles pour télécharger les PDFs des conventions collectives :

```bash
# Téléchargement complet
python download_all_pdfs.py

# Téléchargement par lots
python download_batch.py

# Téléchargement rapide
python fast_download.py

# Continuer un téléchargement interrompu
python continue_download.py
```

## 📊 Structure du projet

```
.
├── client/              # Application React (frontend)
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages de l'application
│   │   └── lib/         # Utilitaires et configuration
│   └── public/          # Fichiers statiques
│
├── server/              # Serveur Express (backend)
│   ├── routes.ts        # Routes API
│   └── index.ts         # Point d'entrée du serveur
│
├── db/                  # Configuration base de données
│   ├── schema.ts        # Schéma Drizzle
│   └── migration.sql    # Migrations SQL
│
├── resultats/           # Fichiers markdown extraits (10571 fichiers)
├── telechargements_CCN_2025-08-13/  # PDFs téléchargés
├── extraction_2025-09-24/           # Extraction de PDFs
│
├── *.py                 # Scripts Python de téléchargement
├── *.ts                 # Scripts TypeScript de traitement
├── data.json            # Données des conventions
└── conventions_mapping.json  # Mapping des conventions
```

## 📝 Scripts disponibles

### TypeScript
- `batch-process-conventions.ts` - Traitement par lots des conventions
- `generate-sections-json.ts` - Génération des JSON de sections
- `import-sections.ts` - Import des sections dans la DB
- `test-*.ts` - Scripts de test divers

### Python
- `check_download_status.py` - Vérifier le statut des téléchargements
- `check_mapping.py` - Vérifier le mapping des conventions
- `create_mapping_table.py` - Créer la table de mapping

### Shell
- `import-sections.sh` - Script d'import des sections
- `generate-sections-json.sh` - Script de génération des sections

## 🔑 Configuration

Les clés API pour les services d'IA doivent être configurées comme variables d'environnement :

```bash
ANTHROPIC_API_KEY=votre_clé_anthropic
GOOGLE_API_KEY=votre_clé_google
OPENAI_API_KEY=votre_clé_openai
```

## 📖 Documentation des sections

Chaque convention collective est structurée selon les sections suivantes :

1. **Accident de travail** - Dispositions en cas d'accident
2. **Aménagement du temps de travail** - Horaires, modulation, etc.
3. **Apprenti** - Statut et conditions des apprentis
4. **CET** - Compte Épargne Temps
5. **Classification** - Grilles de classification professionnelle
6. **Congés payés** - Règles sur les congés
7. **Et plus encore...**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 👥 Auteurs

Projet développé pour la synthèse des conventions collectives françaises.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.

---

**Note** : Ce projet traite des données publiques des conventions collectives françaises. Assurez-vous de respecter les droits d'auteur et les conditions d'utilisation lors de l'utilisation de ces données.

