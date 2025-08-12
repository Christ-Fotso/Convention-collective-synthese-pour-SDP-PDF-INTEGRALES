# Convention Collective Analytics Platform - replit.md

## Overview

This is a comprehensive web application for analyzing and managing French collective bargaining agreements (conventions collectives). The platform provides AI-powered extraction and analysis of legal documents, particularly focused on employment law provisions within collective agreements.

The application serves as a specialized tool for HR professionals, legal experts, and organizations to efficiently navigate and extract specific information from hundreds of collective agreements, using modern AI technologies to parse complex legal documents.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: TanStack React Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Multiple AI providers (OpenAI GPT-4, Google Gemini, Perplexity, Anthropic)
- **PDF Processing**: Custom PDF text extraction using pdf-parse and pdfjs-dist

### Data Processing Pipeline
- **Document Ingestion**: Automated PDF download and text extraction
- **AI-Powered Analysis**: Structured extraction of legal provisions using specialized prompts
- **Caching Strategy**: Multi-tier caching (memory, database, file system) for performance
- **Batch Processing**: Background jobs for pre-processing documents

## Key Components

### Database Schema
- **conventions**: Core table storing collective agreement metadata
- **conventionSections**: Extracted sections with content and status tracking
- **chatpdfSources**: External document sources integration
- **apiMetrics**: Usage tracking and cost monitoring
- **extractionTasks**: Background job management

### AI Service Integration
- **OpenAI Integration**: Primary AI provider using GPT-4 for legal text analysis
- **Multi-Provider Support**: Fallback systems with Gemini, Perplexity, and Anthropic
- **Intelligent Routing**: Context-aware AI provider selection based on query type
- **Cost Optimization**: Token usage tracking and model selection optimization

### Content Management
- **Section Types**: 30+ predefined categories (employment, time-work, leave, classification, etc.)
- **JSON Data Provider**: Static data serving for pre-extracted content
- **Markdown Processing**: Structured formatting for legal documents
- **Table Normalization**: Automatic formatting of tabular legal data

### Caching System
- **LimitedCache Class**: Memory-efficient caching with persistence
- **PDF Text Cache**: Reduces redundant document processing
- **API Response Cache**: Minimizes expensive AI API calls
- **Database Persistence**: Automatic cache backup and restoration

## Data Flow

1. **Document Ingestion**: PDFs are downloaded from official sources and cached locally
2. **Text Extraction**: Raw text is extracted using specialized PDF parsing
3. **AI Processing**: Structured prompts extract specific legal provisions
4. **Content Normalization**: Tables and formatting are standardized
5. **Database Storage**: Processed content is stored with metadata tracking
6. **API Serving**: Frontend requests are served from cache or generated on-demand

### Batch Processing Workflow
- **Convention Import**: Bulk import from JSON data sources
- **Pre-conversion**: Background markdown conversion of entire documents
- **Section Extraction**: AI-powered extraction of specific legal provisions
- **Quality Assurance**: Validation and error handling for processed content

## External Dependencies

### AI Services
- **OpenAI API**: Primary text analysis and extraction
- **Google Gemini**: Alternative AI provider for specialized tasks
- **Perplexity API**: Internet-connected research capabilities
- **Anthropic Claude**: Additional AI provider for complex legal analysis

### Data Sources
- **Official Legal Databases**: Elnet.fr and other government sources
- **PDF Documents**: Direct access to official collective agreement texts
- **JSON Data Files**: Pre-processed legal information

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the full stack
- **ESBuild**: Production bundling for server code
- **Vite**: Development server and client-side bundling

## Deployment Strategy

### Platform Configuration
- **Deployment Target**: Google Cloud Run
- **Database**: PostgreSQL 16 with automatic provisioning
- **Environment**: Node.js 20 runtime
- **Build Process**: Multi-stage build (Vite + ESBuild)

### Performance Optimizations
- **Static Asset Serving**: Efficient client-side resource delivery
- **Database Connection Pooling**: Optimized database access
- **Caching Strategy**: Multi-level caching reduces AI API costs
- **Batch Processing**: Background jobs prevent UI blocking

### Monitoring and Metrics
- **API Usage Tracking**: Cost monitoring for AI services
- **Error Logging**: Comprehensive error tracking and reporting
- **Performance Metrics**: Response time and throughput monitoring

## Changelog
- June 17, 2025. Initial setup
- June 17, 2025. Ajout du "Code du travail" (IDCC 9999) comme référence légale de base :
  - Créé en première position dans la liste des conventions
  - 4 sections de base : Informations générales, Délai de prévenance, Période d'essai, Durée du travail
  - Contenu basé sur les dispositions légales du Code du travail français
  - Intégration complète avec le système de chat IA pour répondre aux questions sur le droit du travail
- August 12, 2025. Système de rendu HTML enrichi pour les documents légaux :
  - Conversion automatique Markdown vers HTML avec bibliothèque marked
  - Mise en forme professionnelle avec highlight.js pour la coloration syntaxique
  - Interface utilisateur avec vue enrichie HTML accessible depuis chaque section
  - API de conversion HTML (/api/test/html-conversion/:conventionId/:sectionType)
  - Composant HtmlTestViewer intégré avec onglets (rendu HTML, markdown original, code HTML)
  - Statistiques automatiques (mots, titres, tableaux, listes)
  - Routage optimisé pour les pages de sections individuelles
  - Boutons "Page complète" ajoutés à chaque section pour accès direct
  - MISE À JOUR : Affichage HTML automatique par défaut dans la vue principale
    * Remplacement du rendu Markdown par HTML enrichi automatique
    * Vue directe sans boutons d'activation ou choix utilisateur
    * Interface simplifiée et professionnelle pour service commercial
    * Amélioration du design avec thème vert cohérent et typographie moderne
    * Police réduite (14px) avec design responsive optimisé
    * Tableaux avec dégradés verts et effets hover sophistiqués
    * Listes et citations stylées avec indicateurs visuels verts
    * Ombres subtiles et bordures arrondies pour un aspect professionnel
    * Séparation claire entre la fonction chat IA et la navigation/recherche
    * Barre dédiée pour l'assistant IA avec design distinctif vert
    * Zone de recherche repositionnée comme filtre de navigation
    * Correction du formatage Markdown : suppression des astérisques parasites
    * Conversion automatique des éléments **gras** et *italique* en HTML stylé
    * Formatage automatique des grilles de rémunération avec tri et retours à la ligne
    * Références d'avenants organisées par ordre numérique avec design cards élégant
    * Suppression des titres H1 redondants qui doublonnent avec les noms de sections
- August 12, 2025. Navigation latérale moderne pour une meilleure UX :
    * Implémentation d'une sidebar gauche élégante pour les sous-sections
    * Interface responsive avec overlay mobile pour une expérience optimale sur tous écrans
    * Séparation claire entre recherche par mots-clés (icône loupe) et assistant IA conversationnel
    * Allègement de la barre de navigation principale avec plus d'espace horizontal
    * Sidebar contextuelle qui n'apparaît que lors de la sélection d'une catégorie principale
    * Fermeture automatique sur mobile après sélection d'une sous-section
    * Transitions fluides et design moderne avec thème vert cohérent
    * Navigation hiérarchique intuitive sans surcharge visuelle (suppression des flèches)
    * Optimisation de l'espace vertical avec positionnement intelligent des éléments
- August 12, 2025. Recherche avancée par mots-clés avec aperçu HTML :
    * Moteur de recherche intelligent avec scoring de pertinence automatique
    * Interface de recherche moderne avec dialog responsive et debounce optimisé
    * Aperçu HTML enrichi intégré directement dans les résultats de recherche
    * Bouton œil pour basculer l'affichage entre résumé textuel et rendu HTML complet
    * API de recherche côté serveur analysant tout le contenu des sections
    * Mise en évidence des termes recherchés avec score de pertinence affiché
    * Navigation directe vers les sections depuis les résultats de recherche
    * Design cohérent avec le thème vert et intégration parfaite à l'interface
    * Distinction claire entre recherche par mots-clés (loupe) et assistant IA (chat)
- August 12, 2025. Amélioration ergonomique du bouton de recherche :
    * Bouton "Rechercher" avec texte visible sur grands écrans (desktop/tablet)
    * Transformation automatique en icône loupe seule sur petits écrans (mobile)
    * Design responsive avec classes Tailwind (hidden sm:inline) pour adaptation fluide
    * Amélioration de la visibilité et de l'accessibilité de la fonction recherche
    * Cohérence avec le design général et les interactions utilisateur existantes
- August 12, 2025. Refonte complète de l'interface d'accueil des conventions :
    * Design moderne avec dégradé de couleurs et cartes élégantes
    * Section statistiques avec chiffres clés (380 conventions, 12,917 sections, 1,187 codes NAF)
    * Mise en avant spéciale du "Code du travail" comme référence légale
    * Interface de recherche enrichie avec descriptions et visuels
    * Grille responsive de cartes pour les conventions avec aperçu des fonctionnalités
    * Résultats NAF redesignés avec cartes modernes et informations sectorielles
    * Navigation améliorée avec animations et effets hover sophistiqués
    * Interface professionnelle adaptée au service commercial B2B
    * Hiérarchisation visuelle claire entre référence légale et conventions

## User Preferences

Preferred communication style: Simple, everyday language.