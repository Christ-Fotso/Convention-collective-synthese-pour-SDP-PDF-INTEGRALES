# Convention Collective Analytics Platform - replit.md

## Overview
This platform is a web application designed for analyzing and managing French collective bargaining agreements (conventions collectives). Its primary purpose is to provide AI-powered extraction and analysis of legal documents, specifically focusing on employment law provisions within collective agreements. It serves HR professionals, legal experts, and organizations by enabling efficient navigation and extraction of information from numerous collective agreements using advanced AI technologies. The project aims to leverage AI to parse complex legal documents, offering a specialized tool for legal compliance and information retrieval.

## User Preferences
Preferred communication style: Simple, everyday language.
Content editing: User adds specific corrections/annotations to individual conventions (e.g., IDCC 0843 and 575 trial period corrections: durations mentioned in conventions are inapplicable, should be two months without renewal).

## System Architecture
### Frontend
- **Framework**: React with TypeScript
- **UI/UX**: Radix UI components integrated with shadcn/ui for design consistency, styled using Tailwind CSS with a custom theme.
- **State Management**: TanStack React Query for server-side state.
- **Build Tool**: Vite.

### Backend
- **Runtime**: Node.js with TypeScript (ESM modules).
- **Framework**: Express.js for REST API services.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **AI Integration**: Supports multiple AI providers including OpenAI (GPT-4o Mini, GPT-4), Google Gemini (Gemini 2.5 Pro, Gemini Flash), Perplexity, and Anthropic (Claude 4 Sonnet). Features intelligent routing for provider selection and cost optimization.
- **PDF Processing**: Custom extraction using `pdf-parse` and `pdfjs-dist`.

### Data Processing & Key Components
- **Document Ingestion**: Automated PDF download and text extraction.
- **AI-Powered Analysis**: Structured extraction of legal provisions using specialized prompts, including a dedicated `HtmlTableExtractor` for complex tabular data.
- **Caching**: Multi-tier caching (memory, database, file system) with `LimitedCache` class for performance and cost reduction on AI API calls and PDF processing.
- **Batch Processing**: Background jobs for bulk imports, pre-conversion to Markdown, and AI-powered section extraction.
- **Database Schema**: `conventions` (metadata), `conventionSections` (extracted content), `chatpdfSources`, `apiMetrics`, `extractionTasks`.
- **Content Management**: Over 30 predefined section types, JSON data provider for static content, Markdown processing, and automatic table normalization.
- **UI Features**: Modern sidebar navigation, advanced keyword search with HTML preview and relevance scoring, and a refactored home interface with statistical insights.
- **HTML Rendering**: Automatic Markdown to HTML conversion with `marked` library, professional formatting, and syntax highlighting via `highlight.js`.

### Deployment Strategy
- **Platform**: Google Cloud Run.
- **Database**: PostgreSQL 16.
- **Runtime Environment**: Node.js 20.
- **Build Process**: Multi-stage build using Vite and ESBuild.
- **Optimizations**: Static asset serving, database connection pooling, multi-level caching, and background batch processing.
- **Monitoring**: API usage tracking, error logging, and performance metrics.

## External Dependencies
### AI Services
- **OpenAI API**: Primary AI provider for text analysis and extraction (GPT-4, GPT-4o Mini).
- **Google Gemini**: Alternative AI provider (Gemini 2.5 Pro, Gemini Flash).
- **Perplexity API**: Utilized for internet-connected research capabilities.
- **Anthropic Claude**: Additional AI provider for complex legal analysis (Claude 4 Sonnet).

### Data Sources
- **Official Legal Databases**: Elnet.fr and other government sources for official collective agreement PDFs.
- **JSON Data Files**: Pre-processed legal information.

### Development Tools
- **Drizzle Kit**: For database migrations and schema management.
- **TypeScript**: For type safety across the full stack.
- **ESBuild**: For production bundling of server code.
- **Vite**: For development server and client-side bundling.