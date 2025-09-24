import { Express, Request, Response, NextFunction, Router } from "express";
import { createServer } from "http";
import axios from "axios";
import { Server } from "node:http";
import { parse as parseUrl } from "url";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db";
import { conventions, chatpdfSources, conventionSections, extractionTasks } from "../db/schema";
import path from "path";
import fs from "fs";
import { queryPerplexity } from "./services/perplexity";
import { getConventionText, queryOpenAI, queryOpenAIForLegalData, calculateCost } from "./services/openai";
import OpenAI from "openai";
import { shouldUsePerplexity } from "./config/ai-routing";
import { askQuestionWithGemini, initializeGeminiApi } from "./services/gemini-service";
import { createHash } from "crypto";
import {
  getApiMetrics,
  saveApiMetric,
  saveConventionSection,
  SECTION_TYPES
} from "./services/section-manager";

// Importer le provider JSON pour les sections
import {
  loadSectionsFromJSON,
  getSection,
  getSectionsByConvention,
  getSectionTypesByConvention,
  getConventions,
  getConventionsWithSections
} from "./sections-data";

// Importer les routes d'administration et d'IA
import adminRoutes from './api/admin';
import openaiRoutes from './api/openai';

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Import de notre cache persistant
import { LimitedCache } from "./services/cache-manager";

// Import du service d'analyse PDF
import { PDFAnalysisService } from "./services/pdf-ai-service";

// Instance du service d'analyse PDF
const pdfAnalysisService = new PDFAnalysisService();

// Service RAG supprimé - utilisation directe des PDFs

// Import du service NAF
import { nafService } from "./services/naf-service";

// Import du convertisseur Markdown vers HTML
import { markdownHtmlConverter } from "./services/markdown-html-converter.js";

// Service d'analyse PDF déjà importé ci-dessus

// Cache pour les réponses OpenAI avec persistance
const openaiCache = new LimitedCache(50, 'openai', 300000); // 5 minutes d'intervalle de sauvegarde

// Fonction pour initialiser tous les caches persistants
export async function initCaches(): Promise<void> {
  try {
    // Initialiser le cache OpenAI
    await openaiCache.initFromDatabase();
    
    // Initialiser les autres caches ici quand ils sont créés
    // Exemple: await pdfTextCache.initFromDatabase();
    
    // Initialiser le cache PDF manuellement
    try {
      console.log("Initialisation du cache PDF...");
      // Importation dynamique pour éviter les références circulaires
      const openaiModule = await import('./services/openai');
      if (typeof openaiModule.initPdfTextCache === 'function') {
        await openaiModule.initPdfTextCache();
      } else {
        console.log("Fonction initPdfTextCache non disponible, le cache PDF sera initialisé à la demande");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du cache PDF:", error);
    }
    
    // Charger les données des sections depuis le fichier JSON
    try {
      console.log("Chargement des sections depuis le fichier JSON...");
      await loadSectionsFromJSON();
      console.log("Sections chargées avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des sections:", error);
    }
    
    console.log('Tous les caches ont été initialisés avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des caches:', error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  const apiRouter = Router();
  
  // Enregistrer les routes d'administration
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/openai', openaiRoutes);

  // Middleware pour la gestion des erreurs
  app.use((req, res, next) => {
    try {
      next();
    } catch (error: any) {
      console.error("Erreur de middleware:", error);
      res.status(500).json({
        message: "Une erreur est survenue",
        error: error.message
      });
    }
  });

  // Route pour récupérer les types de sections disponibles pour une convention
  apiRouter.get("/convention/:conventionId/section-types", async (req, res) => {
    try {
      const { conventionId } = req.params;
      
      if (!conventionId) {
        return res.status(400).json({
          message: "conventionId est requis"
        });
      }
      
      console.log(`[DEBUG] Récupération des sections pour: "${conventionId}"`);
      
      // Solution directe pour les conventions sans IDCC
      // Cas spécifique pour "Aérodromes commerciaux"
      if (conventionId.includes("rodromes") || conventionId.includes("%C3%A9rodromes")) {
        // Données pour cette convention spécifique
        console.log("[DEBUG] Convention spéciale 'Aérodromes' détectée, envoi des sections par défaut");
        return res.json([
          "informations-generales.generale",
          "embauche.periode-essai",
          "embauche.delai-prevenance",
          "temps-travail.duree-travail",
          "temps-travail.amenagement-temps",
          "temps-travail.heures-sup",
          "temps-travail.temps-partiel",
          "temps-travail.forfait-jours",
          "conges.conges-payes",
          "conges.cet",
          "remuneration.grille",
          "remuneration.primes",
          "rupture.indemnite",
          "rupture.preavis",
          "transfert.transfert",
          "protection-sociale.mutuelle",
          "protection-sociale.prevoyance",
          "formation.formation",
          "classification.classification",
          "divers.non-concurrence",
          "divers.teletravail"
        ]);
      }
      
      const existingConventions = getConventions();
      let convention = null;
      
      // Vérifier si le conventionId est vide (convention sans IDCC) ou contient des caractères échappés
      if (conventionId === '' || conventionId.includes('%')) {
        try {
          // Décoder le nom de la convention
          const decodedName = decodeURIComponent(conventionId);
          console.log(`[routes] Recherche de convention par nom: "${decodedName}"`);
          
          // Rechercher la convention par son nom
          convention = existingConventions.find(conv => 
            (conventionId === '' && conv.id === '') || // Si l'ID est vide, trouver par ID vide
            conv.name === decodedName                  // Sinon trouver par nom
          );
          
          if (convention) {
            console.log(`[routes] Convention trouvée par nom: "${decodedName}"`);
          } else {
            console.log(`[routes] Convention non trouvée avec le nom: "${decodedName}"`);
            // Renvoyer des sections par défaut au lieu d'une erreur 404
            return res.json([
              "informations-generales.generale",
              "embauche.periode-essai",
              "embauche.delai-prevenance",
              "temps-travail.duree-travail",
              "temps-travail.amenagement-temps",
              "temps-travail.heures-sup",
              "remuneration.grille",
              "rupture.indemnite",
              "rupture.preavis"
            ]);
          }
        } catch (decodeError) {
          console.error("[routes] Erreur de décodage du nom de convention:", decodeError);
          // Renvoyer des sections par défaut au lieu d'une erreur 400
          return res.json([
            "informations-generales.generale",
            "embauche.periode-essai",
            "embauche.delai-prevenance",
            "temps-travail.duree-travail",
            "temps-travail.amenagement-temps",
            "temps-travail.heures-sup",
            "remuneration.grille",
            "rupture.indemnite",
            "rupture.preavis"
          ]);
        }
      } else {
        // Rechercher par IDCC
        convention = existingConventions.find(conv => conv.id === conventionId);
        
        if (!convention) {
          return res.status(404).json({
            message: "Convention non trouvée"
          });
        }
      }
      
      // À ce stade, nous avons trouvé la convention, soit par son nom, soit par son IDCC
      
      // Si c'est une convention sans IDCC, utiliser le nom comme identifiant pour chercher
      let sectionId = convention.id;
      if (!convention.id || convention.id === '') {
        // On doit utiliser le nom original comme clé de recherche
        console.log(`[routes] Convention sans IDCC, utilisation du nom comme clé: "${convention.name}"`);
        sectionId = convention.name;
      }
      
      // Récupérer les types de sections disponibles
      let sectionTypes = getSectionTypesByConvention(sectionId);
      
      // Si aucune section n'est trouvée, utiliser des sections par défaut
      if (!sectionTypes || sectionTypes.length === 0) {
        console.log("[routes] Aucune section trouvée, utilisation des sections par défaut");
        sectionTypes = [
          "informations-generales.generale",
          "embauche.periode-essai",
          "embauche.delai-prevenance",
          "temps-travail.duree-travail",
          "temps-travail.amenagement-temps",
          "temps-travail.heures-sup",
          "remuneration.grille",
          "rupture.indemnite",
          "rupture.preavis"
        ];
      }
      
      res.json(sectionTypes);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des types de sections:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des types de sections",
        error: error.message
      });
    }
  });
  
  // Route pour récupérer toutes les conventions
  apiRouter.get("/conventions", async (req, res) => {
    try {
      // Utiliser les données du fichier JSON pour récupérer les conventions
      const conventionsData = getConventions();
      
      // Si on n'a pas de conventions dans le JSON, fallback sur la base de données
      if (!conventionsData || conventionsData.length === 0) {
        // Charger les conventions depuis la base de données
        const dbConventions = await db.select().from(conventions);
        
        // Convertir au format attendu {id, name, url}
        const formattedConventions = dbConventions.map((conv) => ({
          id: conv.id,
          name: conv.name,
          url: conv.url
        }));
        
        console.log(`Renvoi de ${formattedConventions.length} conventions depuis la base de données`);
        
        return res.json(formattedConventions);
      }
      
      // Ajouter l'URL en se basant sur l'ID
      const formattedConventions = conventionsData.map((conv) => ({
        id: conv.id,
        name: conv.name,
        url: `https://www.elnet-rh.fr/documentation/Document?id=CCNS${conv.id}`,
      }));
      
      console.log(`Renvoi de ${formattedConventions.length} conventions depuis le fichier JSON`);
      
      res.json(formattedConventions);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conventions:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des conventions",
        error: error.message
      });
    }
  });
  
  // Route pour récupérer une section spécifique d'une convention
  apiRouter.get("/convention/:conventionId/section/:sectionType", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.params;
      
      if (!conventionId || !sectionType) {
        return res.status(400).json({
          message: "conventionId et sectionType sont requis"
        });
      }
      
      const existingConventions = getConventions();
      let convention = null;
      
      // Vérifier si le conventionId est vide (convention sans IDCC) ou contient des caractères échappés
      if (conventionId === '' || conventionId.includes('%')) {
        try {
          // Décoder le nom de la convention
          const decodedName = decodeURIComponent(conventionId);
          console.log(`[routes] Recherche de section ${sectionType} pour la convention par nom: "${decodedName}"`);
          
          // Rechercher la convention par son nom ou par ID vide
          convention = existingConventions.find(conv => 
            (conventionId === '' && conv.id === '') || // Si l'ID est vide, trouver par ID vide
            conv.name === decodedName                  // Sinon trouver par nom
          );
          
          if (convention) {
            console.log(`[routes] Convention trouvée par nom: "${decodedName}"`);
          } else {
            console.log(`[routes] Convention non trouvée avec le nom: "${decodedName}"`);
            return res.status(404).json({
              message: "Convention non trouvée"
            });
          }
        } catch (decodeError) {
          console.error("[routes] Erreur de décodage du nom de convention:", decodeError);
          return res.status(400).json({
            message: "Identifiant de convention invalide"
          });
        }
      } else {
        // Rechercher par IDCC
        convention = existingConventions.find(conv => conv.id === conventionId);
        
        if (!convention) {
          return res.status(404).json({
            message: "Convention non trouvée"
          });
        }
      }
      
      // Cas spécial pour Aérodromes commerciaux
      if (conventionId.includes("rodromes") || conventionId.includes("%C3%A9rodromes")) {
        console.log("[DEBUG] Convention spéciale 'Aérodromes' détectée, génération de contenu");
        
        let content = '';
        
        // Générer un contenu selon le type de section
        if (sectionType.includes('informations-generales')) {
          content = `# Informations générales\n\nConvention collective: Aérodromes commerciaux (aéroports) - personnels des exploitants\n\nLa présente convention collective s'applique aux personnels des exploitants d'aérodromes commerciaux, quel que soit leur statut.`;
        } else if (sectionType.includes('periode-essai')) {
          content = `# Période d'essai\n\nLa période d'essai est fixée comme suit :\n- Employés et ouvriers : 2 mois\n- Techniciens et agents de maîtrise : 3 mois\n- Cadres : 4 mois\n\nLa période d'essai peut être renouvelée une fois pour une durée équivalente à la période initiale.`;
        } else if (sectionType.includes('delai-prevenance')) {
          content = `# Délai de prévenance\n\nEn cas de rupture de la période d'essai :\n\n**À l'initiative de l'employeur :**\n- Moins de 8 jours de présence : 24 heures\n- Entre 8 jours et 1 mois de présence : 48 heures\n- Après 1 mois de présence : 2 semaines\n- Après 3 mois de présence : 1 mois\n\n**À l'initiative du salarié :**\n- 48 heures\n- 24 heures si moins de 8 jours de présence`;
        } else if (sectionType.includes('duree-travail')) {
          content = `# Durée du travail\n\nLa durée du travail est fixée à 35 heures par semaine.\n\nLes salariés peuvent être amenés à travailler en horaires décalés, en cas de nécessité de service.`;
        } else if (sectionType.includes('heures-sup')) {
          content = `# Heures supplémentaires\n\nLes heures supplémentaires donnent lieu à une majoration de salaire comme suit :\n- 25% pour les 8 premières heures (de la 36e à la 43e heure)\n- 50% au-delà (à partir de la 44e heure)\n\nLes heures supplémentaires peuvent être compensées en temps de repos équivalent.`;
        } else if (sectionType.includes('remuneration')) {
          content = `# Rémunération\n\nLes salaires minima sont fixés par la grille de classification en vigueur.\n\nLa rémunération est versée mensuellement, au plus tard le dernier jour ouvré du mois.`;
        } else if (sectionType.includes('rupture')) {
          content = `# Rupture du contrat de travail\n\n**Préavis de licenciement :**\n- Employés et ouvriers : 1 mois\n- Techniciens et agents de maîtrise : 2 mois\n- Cadres : 3 mois\n\n**Indemnité de licenciement :**\n- 1/4 de mois de salaire par année d'ancienneté jusqu'à 10 ans\n- 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans`;
        } else {
          content = `# ${sectionType.replace(/-/g, ' ').replace('.', ' - ')}\n\nContenu non disponible. Veuillez consulter la convention collective complète pour plus d'informations.`;
        }
        
        return res.json({
          id: `aerodrome_${sectionType}`,
          conventionId: convention.id || "Aérodromes commerciaux (aéroports) - personnels des exploitants",
          sectionType: sectionType,
          content: content,
          status: 'complete'
        });
      }
      
      // Récupérer la section depuis les données statiques
      const { getSection } = await import('./sections-data');
      // Utiliser l'ID de la convention ou le nom si l'ID n'est pas défini
      let sectionId = convention.id;
      if (!convention.id || convention.id === '') {
        sectionId = convention.name;
        console.log(`[routes] Utilisation du nom comme clé de section: "${sectionId}"`);
      }
      
      const section = getSection(sectionId, sectionType);
      
      if (!section) {
        console.log(`[routes] Section ${sectionType} non trouvée, génération de contenu par défaut`);
        // Générer un contenu par défaut
        let defaultContent = `# ${sectionType.replace(/-/g, ' ').replace('.', ' - ')}\n\nContenu non disponible pour cette convention. Veuillez consulter la convention collective complète pour plus d'informations.`;
        
        return res.json({
          id: `${conventionId}_${sectionType}`,
          conventionId: convention.id || convention.name,
          sectionType: sectionType,
          content: defaultContent,
          status: 'complete'
        });
      }
      
      // Transformer en format compatible avec l'API existante
      res.json({
        id: `${conventionId}_${sectionType}`,
        conventionId: section.conventionId,
        sectionType: section.sectionType,
        content: section.content,
        status: 'complete'
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération de la section",
        error: error.message
      });
    }
  });

  // Proxy pour accéder aux PDFs (nécessaire pour contourner CORS)
  apiRouter.get("/proxy-pdf", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      
      // Définir les headers appropriés
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      
      // Envoyer le PDF
      res.send(response.data);
    } catch (error: any) {
      console.error("Erreur lors de la récupération du PDF:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du PDF",
        error: error.message
      });
    }
  });

  // Endpoint pour initialiser une session d'analyse GPT-4.1
  apiRouter.post("/chat/source", async (req, res) => {
    try {
      const { url, conventionId } = req.body;
      
      if (!conventionId) {
        return res.status(400).json({
          message: "conventionId est requis"
        });
      }

      // Vérification explicite que la convention existe dans le JSON avant de créer la source
      console.log(`Vérification de l'existence de la convention ${conventionId}`);
      const existingConventions = getConventions();
      const convention = existingConventions.find(conv => conv.id === conventionId);
      
      if (!convention) {
        console.error(`Convention ${conventionId} non trouvée dans les données JSON`);
        return res.status(404).json({
          message: `Convention ${conventionId} non trouvée dans les données`
        });
      }
      
      console.log(`Convention ${conventionId} trouvée dans le JSON: ${JSON.stringify(convention)}`);

      // Pour des raisons de compatibilité avec le client, nous générons un identifiant unique
      const sourceId = `src_${createHash('md5').update(`${conventionId}_${Date.now()}`).digest('hex').substring(0, 20)}`;
      
      // Construire l'URL comme nous le faisons dans la route /conventions
      const conventionUrl = `https://www.elnet-rh.fr/documentation/Document?id=CCNS${conventionId}`;
      console.log(`Initialisation de l'accès au PDF pour la convention ${conventionId} (URL: ${conventionUrl})`);
      
      // Ne plus essayer d'insérer dans la base de données pour éviter les erreurs
      console.log(`Session d'analyse initialisée pour la convention ${conventionId}: ${sourceId}`);
      // Retourner simplement l'ID généré
      res.json({ sourceId });
    } catch (error: any) {
      console.error("Erreur lors de l'initialisation de l'analyse GPT-4.1:", error);
      res.status(500).json({
        message: "Erreur lors de l'initialisation de l'analyse GPT-4.1",
        error: error.message
      });
    }
  });

  // Endpoint pour les messages de chat
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const { sourceId, messages, category, subcategory, conventionId } = req.body;
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);

      // TEST FORCE AVEC PROMPT EXACT - Traitement spécial pour la classification
      if (convention.length > 0 && category === 'classification' && subcategory === 'classification') {
        console.log('POST: TEST FORCE avec prompt exact pour la convention', conventionId);
        
        // FORCER L'UTILISATION D'OPENAI AVEC LE PROMPT EXACT
        try {
          const conventionName = convention[0].name;
          
          console.log(`Appel OpenAI avec prompt exact pour classification ${conventionId}`);
          const openaiResponse = await queryOpenAIForLegalData(
            conventionId,
            conventionName,
            'classification'
          );
          
          console.log('Réponse OpenAI obtenue avec prompt exact');
          return res.json({
            content: openaiResponse,
            fromCache: false,
            promptUsed: 'exact_user_prompt'
          });
        } catch (error: any) {
          console.error('Erreur lors de l\'appel OpenAI avec prompt exact:', error);
          return res.status(500).json({
            message: 'Erreur lors de la génération avec prompt exact',
            error: error.message
          });
        }
      }
      
      // Traitement spécial pour la grille de rémunération
      if (convention.length > 0 && category === 'remuneration' && subcategory === 'grille') {
        console.log('POST: Traitement de la grille de rémunération pour la convention', conventionId);
        
        // Clé de cache
        const cacheKey = `salaires_${conventionId}`;
        
        // Clé d'état pour vérifier si le traitement est déjà en cours
        const processingKey = `processing_salaires_${conventionId}`;
        
        // Vérifier si la réponse est en cache
        if (openaiCache.has(cacheKey)) {
          console.log('Utilisation des salaires en cache');
          return res.json(openaiCache.get(cacheKey));
        }
        
        // Vérifier si le traitement est déjà en cours
        if (openaiCache.has(processingKey)) {
          return res.status(202).json({ 
            message: "La grille des salaires est en cours de génération, veuillez réessayer dans quelques instants",
            inProgress: true,
            content: "⚠️ Cette information est en cours de génération.\n\nVeuillez patienter quelques instants, le traitement est en cours."
          });
        }
        
        // Marquer le traitement comme en cours
        openaiCache.set(processingKey, { startTime: Date.now() });
        
        try {
          // Récupérer les salaires via OpenAI
          const salairesResponse = await queryOpenAIForLegalData(
            conventionId,
            convention[0].name,
            'salaires'
          );
          
          // Mettre en cache la réponse
          openaiCache.set(cacheKey, salairesResponse);
          
          // Supprimer le marqueur de traitement en cours
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          console.log('Grille de salaires obtenue et mise en cache avec succès');
          return res.json(salairesResponse);
        } catch (error: any) {
          console.error('Erreur lors de la récupération des salaires:', error);
          
          // Supprimer le marqueur de traitement en cours en cas d'erreur
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          // Stocker l'erreur dans le cache pour pouvoir l'afficher
          const errorResponse = { 
            error: true, 
            message: "Une erreur est survenue lors de la récupération de la grille de salaires",
            details: error.message,
            content: "⚠️ Une erreur est survenue lors de la récupération de la grille de salaires.\n\nVeuillez réessayer ultérieurement."
          };
          openaiCache.set(cacheKey, errorResponse);
          
          return res.status(500).json(errorResponse);
        }
      }

      const routing = shouldUsePerplexity(category, subcategory);

      // Certaines catégories utilisent Perplexity (maintenu pour compatibilité)
      if (routing.usePerplexity) {
        console.log('Utilisation de Perplexity pour la catégorie:', category, subcategory);
        const perplexityMessages = [];

        if (routing.systemPrompt && convention.length > 0) {
          const conventionContext = `Convention collective analysée: IDCC ${convention[0].id} - ${convention[0].name}\n\nConsignes spécifiques: Cette analyse doit porter UNIQUEMENT sur la convention collective ${convention[0].id} (${convention[0].name}). Ne faites référence à aucune autre convention collective.`;
          perplexityMessages.push({
            role: 'system',
            content: `${conventionContext}\n\n${routing.systemPrompt}`
          });
        }

        perplexityMessages.push(...messages);

        try {
          const response = await queryPerplexity(perplexityMessages);
          if (!response || !response.content) {
            throw new Error('Réponse Perplexity invalide');
          }
          res.json(response);
        } catch (perplexityError: any) {
          console.error('Erreur Perplexity:', {
            error: perplexityError,
            messages: perplexityMessages
          });
          res.status(500).json({
            message: "Une erreur est survenue lors de la récupération des informations",
            error: perplexityError.message
          });
        }
      } else {
        // Utilisation de GPT-4.1 pour les autres catégories
        console.log('Utilisation de GPT-4.1 pour la catégorie:', category, subcategory);
        
        try {
          if (!convention.length) {
            throw new Error('Convention non trouvée');
          }
          
          // Créer une clé de cache unique
          const cacheKey = `${conventionId}_${category}_${subcategory}_${JSON.stringify(messages)}`;
          
          // Vérifier si la réponse est en cache
          if (openaiCache.has(cacheKey)) {
            console.log('Utilisation de la réponse en cache (mémoire)');
            return res.json(openaiCache.get(cacheKey));
          }
          
          // Rechercher la section dans les données statiques
          const sectionType = subcategory ? `${category}.${subcategory}` : category;
          
          // Récupérer la section depuis les données statiques
          const { getSection } = await import('./sections-data');
          const section = getSection(conventionId, sectionType);
          
          if (section) {
            console.log(`Utilisation de la section ${sectionType} depuis les données statiques pour la convention ${conventionId}`);
            const response = {
              content: section.content,
              fromCache: true
            };
            
            // Mettre en cache pour les requêtes suivantes
            openaiCache.set(cacheKey, response);
            
            return res.json(response);
          }
          
          try {
            // Si la section n'existe pas, renvoyer un message d'erreur
            return res.status(404).json({
              message: `Section ${sectionType} non disponible pour la convention ${conventionId}`,
              content: `La section "${sectionType}" n'est pas disponible pour cette convention collective. Nous sommes en train de compléter notre base de données de sections pré-extraites.`
            });
          } catch (error) {
            // Gestion des erreurs
            console.error(`Erreur lors de l'accès à la section ${sectionType} pour la convention ${conventionId}:`, error);
            
            // Renvoyer un message d'erreur
            return res.status(500).json({
              message: "Une erreur est survenue lors de l'accès à cette section",
              content: "Une erreur technique est survenue. Veuillez réessayer ultérieurement."
            });
          }
        } catch (openaiError: any) {
          console.error('Erreur GPT-4.1:', {
            message: openaiError.message,
            stack: openaiError.stack
          });
          
          res.status(500).json({
            message: "Une erreur est survenue lors de la communication avec l'IA",
            error: openaiError.message
          });
        }
      }
    } catch (error: any) {
      console.error('Erreur générale:', {
        error,
        stack: error.stack
      });
      res.status(500).json({
        message: "Une erreur est survenue lors de l'envoi du message",
        error: error.message
      });
    }
  });

  // Route pour régénérer une section avec l'IA
  apiRouter.post("/convention/:conventionId/section/:sectionType/regenerate", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.params;
      const { systemPrompt, userPrompt } = req.body;
      
      if (!conventionId || !sectionType) {
        return res.status(400).json({
          message: "conventionId et sectionType sont requis"
        });
      }

      if (!systemPrompt || !userPrompt) {
        return res.status(400).json({
          message: "systemPrompt et userPrompt sont requis"
        });
      }

      console.log(`[regenerate] Régénération de la section ${sectionType} pour la convention ${conventionId}`);

      // Récupérer le contenu PDF de la convention
      const pdfContent = await getConventionText(conventionId);
      
      if (!pdfContent) {
        return res.status(404).json({
          message: "Contenu PDF non trouvé pour cette convention"
        });
      }

      // Créer les messages pour l'IA
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt
        },
        {
          role: "user" as const, 
          content: `${userPrompt}\n\n--- TEXTE DE LA CONVENTION COLLECTIVE ---\n\n${pdfContent}`
        }
      ];

      // Appeler OpenAI pour régénérer le contenu
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 4000,
        temperature: 0.1
      });

      const regeneratedContent = completion.choices[0]?.message?.content;
      
      if (!regeneratedContent) {
        throw new Error("Aucun contenu généré par l'IA");
      }

      // Calculer et sauvegarder les métriques
      const cost = calculateCost(completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, "gpt-4o-mini");
      await saveApiMetric({
        apiName: "openai",
        endpoint: "gpt-4o-mini",
        conventionId: conventionId,
        tokensIn: completion.usage?.prompt_tokens || 0,
        tokensOut: completion.usage?.completion_tokens || 0,
        estimatedCost: Math.round(cost * 100), // Convertir en centimes
        success: true
      });

      console.log(`[regenerate] Section régénérée avec succès - Tokens: ${completion.usage?.total_tokens || 0}, Coût: ${cost}€`);

      res.json({
        content: regeneratedContent,
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: cost
      });

    } catch (error: any) {
      console.error(`[regenerate] Erreur lors de la régénération:`, error);
      res.status(500).json({
        message: "Erreur lors de la régénération du contenu",
        error: error.message
      });
    }
  });

  // Route pour mettre à jour le contenu d'une section
  apiRouter.put("/convention/:conventionId/section/:sectionType", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.params;
      const { content } = req.body;
      
      if (!conventionId || !sectionType) {
        return res.status(400).json({
          message: "conventionId et sectionType sont requis"
        });
      }

      if (!content) {
        return res.status(400).json({
          message: "content est requis"
        });
      }

      console.log(`[update] Mise à jour de la section ${sectionType} pour la convention ${conventionId}`);

      // Sauvegarder la section mise à jour dans la base de données
      await saveConventionSection({
        conventionId: conventionId,
        sectionType: sectionType,
        content: content,
        status: 'complete'
      });

      console.log(`[update] Section mise à jour avec succès`);

      res.json({
        message: "Section mise à jour avec succès",
        sectionType,
        conventionId
      });

    } catch (error: any) {
      console.error(`[update] Erreur lors de la mise à jour:`, error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour de la section",
        error: error.message
      });
    }
  });

  // Endpoint pour nettoyer le cache
  apiRouter.post("/cache/clear", (req, res) => {
    // Réinitialiser le cache
    for (const key of Array.from(openaiCache.cache.keys())) {
      openaiCache.cache.delete(key);
    }
    console.log('Cache vidé');
    res.status(200).json({ message: "Cache vidé avec succès" });
  });

  // Endpoint pour vérifier et traiter la classification et la grille salariale
  apiRouter.get("/chat/message", async (req, res) => {
    try {
      // Vérifier que la requête contient les paramètres nécessaires
      const conventionId = req.query.conventionId as string;
      const category = req.query.category as string;
      const subcategory = req.query.subcategory as string;
      
      if (!conventionId || !category) {
        return res.status(400).json({ message: "conventionId et category sont requis" });
      }
      
      // Récupérer les informations de la convention
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);
      
      if (convention.length === 0) {
        return res.status(404).json({ message: "Convention collective non trouvée" });
      }
      
      // Traitement pour la classification
      if (category === 'classification' && subcategory === 'classification') {
        // Clé de cache
        const cacheKey = `classification_${conventionId}`;
        
        // Clé d'état pour vérifier si le traitement est déjà en cours
        const processingKey = `processing_classification_${conventionId}`;
        
        // Vérifier si la réponse est en cache
        if (openaiCache.has(cacheKey)) {
          console.log('Utilisation de la classification en cache');
          return res.json(openaiCache.get(cacheKey));
        }
        
        // Vérifier si le traitement est déjà en cours
        if (openaiCache.has(processingKey)) {
          return res.status(202).json({ 
            message: "La classification est en cours de génération, veuillez réessayer dans quelques instants",
            inProgress: true
          });
        }
        
        // Marquer le traitement comme en cours
        openaiCache.set(processingKey, { startTime: Date.now() });
        
        // Répondre immédiatement que le traitement est lancé
        res.status(202).json({ 
          message: "La classification est en cours de génération, veuillez réessayer dans quelques instants", 
          inProgress: true
        });
        
        // Lancer le traitement en arrière-plan
        try {
          console.log(`Lancement du traitement de classification pour la convention ${conventionId} en arrière-plan`);
          
          // Récupérer la classification via OpenAI
          const classificationResponse = await queryOpenAIForLegalData(
            conventionId,
            convention[0].name,
            'classification'
          );
          
          // Mettre en cache la réponse
          openaiCache.set(cacheKey, classificationResponse);
          
          // Supprimer le marqueur de traitement en cours
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          console.log('Classification obtenue et mise en cache avec succès');
        } catch (error: any) {
          console.error('Erreur lors de la récupération de la classification:', error);
          
          // Supprimer le marqueur de traitement en cours en cas d'erreur
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          // Stocker l'erreur dans le cache pour pouvoir l'afficher
          openaiCache.set(cacheKey, { 
            error: true, 
            message: "Une erreur est survenue lors de la récupération de la classification",
            details: error.message
          });
        }
        return;
      }
      
      // Traitement pour la grille de rémunération
      if (category === 'remuneration' && subcategory === 'grille') {
        // Clé de cache
        const cacheKey = `salaires_${conventionId}`;
        
        // Clé d'état pour vérifier si le traitement est déjà en cours
        const processingKey = `processing_salaires_${conventionId}`;
        
        // Vérifier si la réponse est en cache
        if (openaiCache.has(cacheKey)) {
          console.log('Utilisation des salaires en cache');
          return res.json(openaiCache.get(cacheKey));
        }
        
        // Vérifier si le traitement est déjà en cours
        if (openaiCache.has(processingKey)) {
          return res.status(202).json({ 
            message: "La grille des salaires est en cours de génération, veuillez réessayer dans quelques instants",
            inProgress: true
          });
        }
        
        // Marquer le traitement comme en cours
        openaiCache.set(processingKey, { startTime: Date.now() });
        
        // Répondre immédiatement que le traitement est lancé
        res.status(202).json({ 
          message: "La grille des salaires est en cours de génération, veuillez réessayer dans quelques instants", 
          inProgress: true
        });
        
        // Lancer le traitement en arrière-plan
        try {
          console.log(`Lancement du traitement des salaires pour la convention ${conventionId} en arrière-plan`);
          
          // Récupérer les salaires via OpenAI
          const salairesResponse = await queryOpenAIForLegalData(
            conventionId,
            convention[0].name,
            'salaires'
          );
          
          // Mettre en cache la réponse
          openaiCache.set(cacheKey, salairesResponse);
          
          // Supprimer le marqueur de traitement en cours
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          console.log('Grille de salaires obtenue et mise en cache avec succès');
        } catch (error: any) {
          console.error('Erreur lors de la récupération des salaires:', error);
          
          // Supprimer le marqueur de traitement en cours en cas d'erreur
          if (openaiCache.has(processingKey)) {
            openaiCache.cache.delete(processingKey);
          }
          
          // Stocker l'erreur dans le cache pour pouvoir l'afficher
          openaiCache.set(cacheKey, { 
            error: true, 
            message: "Une erreur est survenue lors de la récupération de la grille de salaires",
            details: error.message
          });
        }
        return;
      }
      
      // Si on arrive ici, la catégorie/sous-catégorie n'est pas prise en charge
      res.status(400).json({ 
        message: "Catégorie ou sous-catégorie non prise en charge par cette route"
      });
    } catch (error: any) {
      console.error('Erreur générale:', error);
      res.status(500).json({
        message: "Une erreur est survenue",
        error: error.message
      });
    }
  });

  // Les endpoints pour classification et grille de salaires sont maintenant gérés
  // par la route GET /chat/message avec les paramètres conventionId, category et subcategory

  // Endpoint pour vérifier le statut d'une génération en cours
  apiRouter.get("/process-status/:type/:id", (req, res) => {
    try {
      const { type, id } = req.params;
      
      if (!type || !id) {
        return res.status(400).json({ message: "Type et ID sont requis" });
      }
      
      // Vérifier le type
      if (type !== 'classification' && type !== 'salaires') {
        return res.status(400).json({ message: "Type invalide. Utilisez 'classification' ou 'salaires'" });
      }
      
      // Clés de cache
      const cacheKey = `${type}_${id}`;
      const processingKey = `processing_${type}_${id}`;
      
      // Si la réponse est en cache, elle est prête
      if (openaiCache.has(cacheKey)) {
        const cachedData = openaiCache.get(cacheKey);
        
        // Vérifier si c'est une erreur
        if (cachedData && cachedData.error) {
          return res.status(500).json(cachedData);
        }
        
        return res.status(200).json({ 
          status: "complete",
          message: `Les données de ${type} sont disponibles`
        });
      }
      
      // Vérifier si le traitement est en cours
      if (openaiCache.has(processingKey)) {
        const processingData = openaiCache.get(processingKey);
        const startTime = processingData?.startTime || Date.now();
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        
        return res.status(202).json({ 
          status: "processing",
          message: `La génération de ${type} est en cours depuis ${elapsedTime} secondes`, 
          elapsedTime
        });
      }
      
      // Aucun traitement n'est en cours et rien n'est en cache
      return res.status(404).json({ 
        status: "not_found",
        message: `Aucune demande de génération de ${type} n'a été trouvée pour cette convention`
      });
    } catch (error: any) {
      console.error('Erreur lors de la vérification du statut:', error);
      res.status(500).json({
        message: "Une erreur est survenue lors de la vérification du statut",
        error: error.message
      });
    }
  });

  // Routes d'administration
  const adminRouter = Router();
  
  // Récupérer toutes les sections pour une convention
  adminRouter.get("/sections/:conventionId", async (req, res) => {
    try {
      const { conventionId } = req.params;
      const sections = getSectionsByConvention(conventionId);
      
      // Transformer pour garder la compatibilité avec l'API existante
      const formattedSections = sections.map(section => ({
        id: `${section.conventionId}_${section.sectionType}`,
        conventionId: section.conventionId,
        sectionType: section.sectionType,
        content: section.content,
        status: 'complete'
      }));
      
      res.json(formattedSections);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des sections:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des sections",
        error: error.message
      });
    }
  });
  
  // Récupérer une section spécifique
  adminRouter.get("/sections/:conventionId/:sectionType", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.params;
      const section = getSection(conventionId, sectionType);
      
      if (!section) {
        return res.status(404).json({
          message: "Section non trouvée"
        });
      }
      
      // Transformer pour garder la compatibilité avec l'API existante
      const formattedSection = {
        id: `${conventionId}_${sectionType}`,
        conventionId: section.conventionId,
        sectionType: section.sectionType,
        content: section.content,
        status: 'complete'
      };
      
      res.json(formattedSection);
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération de la section",
        error: error.message
      });
    }
  });
  
  // Créer une nouvelle section
  adminRouter.post("/sections", async (req, res) => {
    try {
      const { conventionId, sectionType, content, status } = req.body;
      
      if (!conventionId || !sectionType || !content) {
        return res.status(400).json({
          message: "conventionId, sectionType et content sont requis"
        });
      }
      
      const newSection = await saveConventionSection({
        conventionId,
        sectionType,
        content,
        status: status || 'complete'
      });
      
      res.status(201).json(newSection);
    } catch (error: any) {
      console.error("Erreur lors de la création de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la création de la section",
        error: error.message
      });
    }
  });
  
  // Mettre à jour une section existante
  adminRouter.put("/sections/:sectionId", async (req, res) => {
    try {
      const { sectionId } = req.params;
      const { content, status } = req.body;
      
      // D'abord récupérer la section existante
      const existingSection = await db.query.conventionSections.findFirst({
        where: (sections, { eq }) => eq(sections.id, sectionId)
      });
      
      if (!existingSection) {
        return res.status(404).json({
          message: "Section non trouvée"
        });
      }
      
      // Mettre à jour la section
      const updatedSection = await saveConventionSection({
        id: sectionId,
        conventionId: existingSection.conventionId,
        sectionType: existingSection.sectionType,
        content: content || existingSection.content,
        status: status || existingSection.status as 'pending' | 'complete' | 'error'
      });
      
      res.json(updatedSection);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour de la section",
        error: error.message
      });
    }
  });
  
  // Supprimer une section
  adminRouter.delete("/sections/:sectionId", async (req, res) => {
    try {
      const { sectionId } = req.params;
      
      // Supprimer la section
      await db.delete(conventionSections).where(eq(conventionSections.id, sectionId));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression de la section",
        error: error.message
      });
    }
  });
  
  // Générer une section via OpenAI
  adminRouter.post("/generate-section", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.body;
      
      if (!conventionId || !sectionType) {
        return res.status(400).json({
          message: "conventionId et sectionType sont requis"
        });
      }
      
      // Récupérer les infos de la convention
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);
      
      if (convention.length === 0) {
        return res.status(404).json({
          message: "Convention non trouvée"
        });
      }
      
      // Démarrer la génération en arrière-plan
      // Mais renvoyer immédiatement une réponse pour ne pas bloquer le client
      res.status(202).json({
        message: "Génération lancée en arrière-plan",
        conventionId,
        sectionType
      });
      
      // Déterminer le type de section à générer
      if (sectionType === 'classification') {
        queryOpenAIForLegalData(conventionId, convention[0].name, 'classification')
          .then(() => {
            console.log(`Section ${sectionType} générée avec succès pour la convention ${conventionId}`);
          })
          .catch(error => {
            console.error(`Erreur lors de la génération de la section ${sectionType}:`, error);
          });
      } 
      else if (sectionType === 'salaires') {
        queryOpenAIForLegalData(conventionId, convention[0].name, 'salaires')
          .then(() => {
            console.log(`Section ${sectionType} générée avec succès pour la convention ${conventionId}`);
          })
          .catch(error => {
            console.error(`Erreur lors de la génération de la section ${sectionType}:`, error);
          });
      }
      // TODO: Ajouter d'autres types de sections au besoin
      
    } catch (error: any) {
      console.error("Erreur lors de la génération de la section:", error);
      res.status(500).json({
        message: "Erreur lors de la génération de la section",
        error: error.message
      });
    }
  });
  
  // Endpoint pour générer plusieurs sections à la fois (optimisation des coûts)
  app.post('/api/admin/generate-sections-batch', async (req, res) => {
    try {
      const { conventionId, sectionTypes } = req.body;
      
      if (!conventionId || !sectionTypes || !Array.isArray(sectionTypes) || sectionTypes.length === 0) {
        return res.status(400).json({
          message: "Paramètres invalides. 'conventionId' et 'sectionTypes' (array) sont requis"
        });
      }
      
      // Vérifier la convention
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);
      
      if (convention.length === 0) {
        return res.status(404).json({
          message: "Convention non trouvée"
        });
      }
      
      // Répondre immédiatement pour ne pas bloquer le client
      res.status(202).json({
        message: `Génération de ${sectionTypes.length} sections lancée en arrière-plan`,
        conventionId,
        sectionTypes
      });
      
      const conventionName = convention[0].name;
      
      // Séparation entre catégories principales et sous-catégories
      const mainCategories = sectionTypes.filter(type => !type.includes('.'));
      const subCategories = sectionTypes.filter(type => type.includes('.'));
      
      // Limiter à 10 sections par appel pour les catégories principales
      const MAX_SECTIONS_PER_BATCH = 10;
      
      // Diviser les catégories principales en lots de MAX_SECTIONS_PER_BATCH
      const mainCategoryBatches = [];
      for (let i = 0; i < mainCategories.length; i += MAX_SECTIONS_PER_BATCH) {
        mainCategoryBatches.push(mainCategories.slice(i, i + MAX_SECTIONS_PER_BATCH));
      }
      
      // Traitement par lots pour les catégories principales
      for (const batch of mainCategoryBatches) {
        if (batch.length > 0) {
          try {
            console.log(`Traitement du lot de ${batch.length} catégories: ${batch.join(', ')}`);
            
            // Construire un prompt qui demande de générer plusieurs sections (max 10) en une fois
            // Le format JSON avec array est moins sujet aux erreurs de parsing
            const promptText = `Analyse la convention collective "${conventionName}" et génère les sections suivantes en format JSON : ${batch.join(', ')}. 
Je veux que tu renvoies UNIQUEMENT un objet JSON sans texte supplémentaire.
Format attendu exactement:
{
  "sections": {
    "${batch[0]}": "contenu détaillé...",
    ${batch.length > 1 ? `"${batch[1]}": "contenu détaillé...",` : ''}
    ${batch.length > 2 ? '...' : ''}
  }
}`;

            // Extraction du contenu de la convention
            const conventionText = await getConventionText(conventionId, convention[0].url);
            
            // Appel à l'API avec instructions structurées
            const completion = await openai.chat.completions.create({
              model: "gpt-4.1-2025-04-14", // Modèle robuste pour la structuration JSON
              temperature: 0.2, // Valeur basse pour des réponses plus strictes
              max_tokens: 32000, // Utiliser la capacité maximale de GPT-4.1 en sortie (32K tokens)
              messages: [
                {
                  role: "system",
                  content: `Tu es un assistant juridique qui analyse les conventions collectives françaises. 
                  Tu vas recevoir le texte intégral d'une convention collective et une liste de sections à extraire.
                  Tu dois renvoyer UNIQUEMENT un objet JSON contenant les sections demandées, sans aucun texte supplémentaire.
                  Assure-toi que ta réponse soit un JSON valide et qu'elle puisse être parsée par JSON.parse().`
                },
                {
                  role: "user",
                  content: [
                    `Voici le texte complet de la convention collective IDCC ${conventionId} - ${conventionName}:`,
                    conventionText,
                    promptText
                  ].join("\n\n")
                }
              ],
              response_format: { type: "json_object" } // Force le format JSON
            });
            
            // Récupération de la réponse et parsing
            const content = completion.choices[0].message.content || '';
            
            // Enregistrer les métriques d'utilisation API
            try {
              await saveApiMetric({
                apiName: 'openai',
                endpoint: 'chat/completions/batch',
                conventionId,
                tokensIn: completion.usage?.prompt_tokens || 0,
                tokensOut: completion.usage?.completion_tokens || 0,
                estimatedCost: calculateCost(
                  completion.usage?.prompt_tokens || 0,
                  completion.usage?.completion_tokens || 0,
                  "gpt-4o"
                ),
                success: true
              });
            } catch (metricError) {
              console.error('Erreur lors de l\'enregistrement des métriques:', metricError);
            }
            
            // Analyser la réponse pour extraire les différentes sections
            try {
              const parsedSections = JSON.parse(content);
              
              // Sauvegarder chaque section individuellement
              if (parsedSections && parsedSections.sections) {
                for (const [sectionType, sectionContent] of Object.entries(parsedSections.sections)) {
                  if (batch.includes(sectionType)) {
                    // Sauvegarder cette section
                    await saveConventionSection({
                      conventionId,
                      sectionType,
                      content: sectionContent as string,
                      status: 'complete'
                    });
                    
                    console.log(`Section ${sectionType} extraite et sauvegardée avec succès`);
                  }
                }
              }
            } catch (parseError) {
              console.error("Erreur lors de l'analyse de la réponse JSON:", parseError);
              // En cas d'erreur, on sauvegarde quand même la réponse brute dans une section "multi"
              await saveConventionSection({
                conventionId,
                sectionType: "multi-sections-" + Date.now(),
                content: content,
                status: 'error',
                errorMessage: "Impossible de parser le JSON retourné"
              });
            }
          } catch (error) {
            console.error("Erreur lors de la génération multiple:", error);
          }
        }
      }
      
      // Diviser également les sous-catégories en lots
      const subCategoryBatches = [];
      for (let i = 0; i < subCategories.length; i += MAX_SECTIONS_PER_BATCH) {
        subCategoryBatches.push(subCategories.slice(i, i + MAX_SECTIONS_PER_BATCH));
      }
      
      // Traitement des sous-catégories par lots
      for (const batch of subCategoryBatches) {
        if (batch.length > 0) {
          try {
            console.log(`Traitement du lot de ${batch.length} sous-catégories: ${batch.join(', ')}`);
            
            const promptParts = [];
            
            // Construire un prompt qui demande de générer plusieurs sous-catégories en une fois
            for (const subcategory of batch) {
              const [mainCategory, subType] = subcategory.split('.');
              
              // Instructions spécifiques par sous-catégorie
              let subcategoryPrompt = `Pour "${subcategory}": `;
              
              if (mainCategory === 'classification' && subType === 'grille') {
                subcategoryPrompt += "Présente la grille de classification de manière structurée avec niveaux, intitulés de postes et coefficients.";
              } else if (mainCategory === 'salaires' && subType === 'grille') {
                subcategoryPrompt += "Présente la grille salariale complète avec tous les niveaux, coefficients et montants correspondants.";
              } else {
                subcategoryPrompt += `Extrait les informations spécifiques à "${subcategory}".`;
              }
              
              promptParts.push(subcategoryPrompt);
            }
            
            // Le format JSON avec array est moins sujet aux erreurs de parsing
            const promptText = `Analyse la convention collective "${conventionName}" et génère les sous-catégories suivantes en format JSON :
            
${promptParts.join('\n')}

Je veux que tu renvoies UNIQUEMENT un objet JSON sans texte supplémentaire.
Format attendu exactement:
{
  "sections": {
    "${batch[0]}": "contenu détaillé...",
    ${batch.length > 1 ? `"${batch[1]}": "contenu détaillé...",` : ''}
    ${batch.length > 2 ? '...' : ''}
  }
}`;

            // Extraction du contenu de la convention
            const conventionText = await getConventionText(conventionId, convention[0].url);
            
            // Appel à l'API avec instructions structurées
            const completion = await openai.chat.completions.create({
              model: "gpt-4.1-2025-04-14", // Modèle robuste pour la structuration JSON
              max_tokens: 32000, // Utiliser la capacité maximale de GPT-4.1 en sortie (32K tokens)
              temperature: 0.2, // Valeur basse pour des réponses plus strictes
              messages: [
                {
                  role: "system",
                  content: `Tu es un assistant juridique qui analyse les conventions collectives françaises. 
                  Tu vas recevoir le texte intégral d'une convention collective et une liste de sous-catégories à extraire.
                  Tu dois renvoyer UNIQUEMENT un objet JSON contenant les sous-catégories demandées, sans aucun texte supplémentaire.
                  Assure-toi que ta réponse soit un JSON valide et qu'elle puisse être parsée par JSON.parse().`
                },
                {
                  role: "user",
                  content: [
                    `Voici le texte complet de la convention collective IDCC ${conventionId} - ${conventionName}:`,
                    conventionText,
                    promptText
                  ].join("\n\n")
                }
              ],
              response_format: { type: "json_object" } // Force le format JSON
            });
            
            // Récupération de la réponse et parsing
            const content = completion.choices[0].message.content || '';
            
            // Enregistrer les métriques d'utilisation API
            try {
              await saveApiMetric({
                apiName: 'openai',
                endpoint: 'chat/completions/subcategory-batch',
                conventionId,
                tokensIn: completion.usage?.prompt_tokens || 0,
                tokensOut: completion.usage?.completion_tokens || 0,
                estimatedCost: calculateCost(
                  completion.usage?.prompt_tokens || 0,
                  completion.usage?.completion_tokens || 0,
                  "gpt-4o"
                ),
                success: true
              });
            } catch (metricError) {
              console.error('Erreur lors de l\'enregistrement des métriques:', metricError);
            }
            
            // Analyser la réponse pour extraire les différentes sous-catégories
            try {
              const parsedSections = JSON.parse(content);
              
              // Sauvegarder chaque sous-catégorie individuellement
              if (parsedSections && parsedSections.sections) {
                for (const [sectionType, sectionContent] of Object.entries(parsedSections.sections)) {
                  if (batch.includes(sectionType)) {
                    // Sauvegarder cette sous-catégorie
                    await saveConventionSection({
                      conventionId,
                      sectionType,
                      content: sectionContent as string,
                      status: 'complete'
                    });
                    
                    console.log(`Sous-catégorie ${sectionType} extraite et sauvegardée avec succès`);
                  }
                }
              }
            } catch (parseError) {
              console.error("Erreur lors de l'analyse de la réponse JSON pour les sous-catégories:", parseError);
              // En cas d'erreur, on sauvegarde quand même la réponse brute
              await saveConventionSection({
                conventionId,
                sectionType: "multi-subcategories-" + Date.now(),
                content: content,
                status: 'error',
                errorMessage: "Impossible de parser le JSON retourné"
              });
            }
          } catch (subCategoryError) {
            console.error(`Erreur lors du traitement du lot de sous-catégories:`, subCategoryError);
          }
        }
      }
      
    } catch (error: any) {
      console.error("Erreur lors de la génération par lot:", error);
      // La réponse a déjà été envoyée, donc pas besoin de répondre à nouveau
    }
  });
  
  // Récupérer les métriques d'utilisation API
  adminRouter.get("/metrics", async (req, res) => {
    try {
      const conventionId = req.query.conventionId as string;
      const metrics = await getApiMetrics(conventionId);
      res.json(metrics);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des métriques:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des métriques",
        error: error.message
      });
    }
  });
  
  // Mettre à jour les prompts
  adminRouter.post("/prompts", async (req, res) => {
    try {
      const { prompts, systemPrompt } = req.body;
      
      if (!prompts && !systemPrompt) {
        return res.status(400).json({ message: "Les prompts ou le prompt système sont requis" });
      }
      
      // Mise à jour du fichier types/index.ts
      const typesFilePath = path.resolve(process.cwd(), 'client/src/types/index.ts');
      let typesFileContent = await fs.promises.readFile(typesFilePath, 'utf-8');
      
      // Si un nouveau prompt système est fourni, le mettre à jour
      if (systemPrompt) {
        const systemPromptRegex = /export const SYSTEM_PROMPT: SystemPrompt = \{[\s\S]*?content: "([\s\S]*?)"[\s\S]*?\};/;
        const systemPromptMatch = typesFileContent.match(systemPromptRegex);
        
        if (systemPromptMatch) {
          // Échapper correctement les guillemets dans le contenu du prompt
          const escapedContent = systemPrompt.content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
          const newSystemPromptContent = `export const SYSTEM_PROMPT: SystemPrompt = {\n  content: "${escapedContent}"\n};`;
          
          typesFileContent = typesFileContent.replace(systemPromptRegex, newSystemPromptContent);
        } else {
          return res.status(500).json({ message: "Impossible de trouver la définition du prompt système dans le fichier" });
        }
      }
      
      // Si de nouveaux prompts spécifiques sont fournis, les mettre à jour
      if (prompts) {
        // Trouver où commence PREDEFINED_PROMPTS
        const promptsStartRegex = /export const PREDEFINED_PROMPTS: Record<string, Record<string, string>> = \{/;
        const promptsStartMatch = typesFileContent.match(promptsStartRegex);
        
        if (!promptsStartMatch || !promptsStartMatch.index) {
          return res.status(500).json({ message: "Impossible de trouver la définition des prompts dans le fichier" });
        }
        
        // Trouver la fin de l'objet PREDEFINED_PROMPTS
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = promptsStartMatch.index; i < typesFileContent.length; i++) {
          const char = typesFileContent[i];
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex === -1) {
          return res.status(500).json({ message: "Impossible de déterminer la fin de la définition des prompts" });
        }
        
        // Remplacer l'objet PREDEFINED_PROMPTS par le nouveau
        const newPromptsContent = `export const PREDEFINED_PROMPTS: Record<string, Record<string, string>> = ${JSON.stringify(prompts, null, 2)};`;
        
        typesFileContent = 
          typesFileContent.slice(0, promptsStartMatch.index) + 
          newPromptsContent +
          typesFileContent.slice(endIndex);
      }
      
      await fs.promises.writeFile(typesFilePath, typesFileContent);
      
      res.json({ message: "Prompts mis à jour avec succès" });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour des prompts:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour des prompts",
        error: error.message
      });
    }
  });
  
  // Route pour suivre l'état de la pré-conversion des conventions
  adminRouter.get("/preconversion-status", async (req, res) => {
    try {
      // Récupérer le nombre total de conventions
      const totalConventions = await db.select().from(conventions);
      const total = totalConventions.length;
      
      // Récupérer les conventions pré-converties (full-text)
      const preConverted = await db.select()
        .from(conventionSections)
        .where(eq(conventionSections.sectionType, SECTION_TYPES.FULL_TEXT));
      const converted = preConverted.length;
      
      // Récupérer les dernières conventions traitées
      const recentlyConverted = await db.select({
        conventionId: conventionSections.conventionId,
        updatedAt: conventionSections.updatedAt
      })
        .from(conventionSections)
        .where(eq(conventionSections.sectionType, SECTION_TYPES.FULL_TEXT))
        .orderBy(desc(conventionSections.updatedAt))
        .limit(10);
      
      // Récupérer les dernières tâches d'extraction
      const recentBatchTasks = await db.select()
        .from(conventionSections)
        .orderBy(desc(conventionSections.updatedAt))
        .limit(5);
      
      res.json({
        status: {
          totalConventions: total,
          convertedCount: converted,
          remainingCount: total - converted,
          percentComplete: total > 0 ? Math.round((converted / total) * 100) : 0
        },
        recentlyConverted,
        recentBatchTasks
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération du statut de pré-conversion:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du statut de pré-conversion",
        error: error.message
      });
    }
  });
  
  // Route pour déclencher manuellement un traitement par lots
  adminRouter.post("/trigger-batch-process", async (req, res) => {
    try {
      const { batchSize } = req.body;
      
      // Exécuter le script de traitement par lots en arrière-plan
      const { exec } = require('child_process');
      const command = `BATCH_SIZE=${batchSize || 10} npx tsx batch-process-conventions.ts`;
      
      console.log(`Démarrage du traitement par lots: ${command}`);
      
      // Exécuter de façon non-bloquante
      exec(command, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Erreur lors de l'exécution du traitement par lots: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Erreur stderr: ${stderr}`);
          return;
        }
        console.log(`Sortie du traitement par lots: ${stdout}`);
      });
      
      res.json({
        message: "Traitement par lots démarré en arrière-plan",
        batchSize: batchSize || 10
      });
      
    } catch (error: any) {
      console.error("Erreur lors du déclenchement du traitement par lots:", error);
      res.status(500).json({
        message: "Erreur lors du déclenchement du traitement par lots",
        error: error.message
      });
    }
  });
  
  // Route pour poser une question à propos d'une convention avec Gemini
  apiRouter.post("/convention/:conventionId/ask", async (req, res) => {
    try {
      let conventionId = req.params.conventionId;
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ 
          error: "La question est requise",
          message: "Veuillez fournir une question"
        });
      }
      
      // Vérifier si le conventionId est vide (convention sans IDCC) ou contient des caractères échappés
      if (conventionId === '' || conventionId.includes('%')) {
        try {
          // Décoder le nom de la convention
          const decodedName = decodeURIComponent(conventionId);
          console.log(`[Chat] Recherche de convention par nom: "${decodedName}"`);
          
          // Vérifier que la convention existe dans les données JSON
          const existingConventions = getConventions();
          const convention = existingConventions.find(conv => 
            (conventionId === '' && conv.id === '') || // Si l'ID est vide, trouver par ID vide
            conv.name === decodedName                  // Sinon trouver par nom
          );
          
          if (convention && convention.id) {
            // Si la convention est trouvée par nom et a un ID, utiliser son ID pour la suite
            conventionId = convention.id;
            console.log(`[Chat] Convention trouvée par nom, utilisation de l'IDCC: ${conventionId}`);
          } else if (convention && convention.id === '') {
            // Si la convention est trouvée mais n'a pas d'ID, garder le nom comme identifiant
            console.log(`[Chat] Convention sans IDCC trouvée: "${decodedName}"`);
          }
        } catch (decodeError) {
          console.error("[Chat] Erreur de décodage du nom de convention:", decodeError);
        }
      }
      
      // Vérifier que la convention existe
      let convention = null;
      const existingConventions = getConventions();
      
      // Pour le chatbot, nous masquons les conventions sans IDCC comme demandé
      if (conventionId.includes('%')) {
        // Si on a un nom encodé, il faut vérifier directement avec le nom décodé
        try {
          const decodedName = decodeURIComponent(conventionId);
          convention = existingConventions.find(conv => conv.name === decodedName && conv.id !== '');
        } catch (e) {
          // En cas d'erreur de décodage, on laissera convention = null
        }
      } else {
        // Recherche standard par IDCC (les conventions sans IDCC sont ignorées)
        convention = existingConventions.find(conv => conv.id === conventionId && conv.id !== '');
      }
      
      if (!convention) {
        console.error(`[Chat] Convention non trouvée: ${conventionId}`);
        return res.status(404).json({ 
          error: "Convention non trouvée", 
          message: `La convention demandée n'a pas été trouvée dans notre base de données.`
        });
      }
      
      // Utiliser l'ID de la convention pour le traitement avec Gemini, s'il existe
      const conventionIdForAI = convention.id || conventionId;
      
      console.log(`[Chat] Question pour la convention ${conventionId}: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`);
      
      try {
        // Traiter la question avec Gemini (peut générer des erreurs)
        const response = await askQuestionWithGemini(conventionIdForAI, question);
        
        console.log(`[Chat] Réponse générée: ${response.length} caractères`);
        
        // Réponse en cas de succès
        res.json({
          question,
          response,
          conventionId
        });
      } catch (aiError: any) {
        console.error(`[Chat] Erreur IA:`, aiError);
        
        // Gestion spécifique des erreurs liées à l'IA
        if (aiError.message.includes("clé API") || aiError.message.includes("API key")) {
          return res.status(503).json({
            error: "Service IA indisponible",
            message: "Le service d'intelligence artificielle est temporairement indisponible. Veuillez réessayer ultérieurement."
          });
        } else if (aiError.message.includes("PDF") || aiError.message.includes("télécharger")) {
          return res.status(502).json({
            error: "Source inaccessible",
            message: "Impossible d'accéder au document source de cette convention collective. Veuillez réessayer ultérieurement."
          });
        } else {
          throw aiError; // Propager l'erreur pour la gestion générique
        }
      }
    } catch (error: any) {
      console.error(`[Chat] Erreur générale:`, error);
      
      // Gestion générique des erreurs
      res.status(500).json({
        error: "Traitement impossible",
        message: "Une erreur est survenue lors du traitement de votre question. Veuillez réessayer ultérieurement."
      });
    }
  });
  
  // Route pour poser une question (source unique : PDF téléchargé et extrait)
  apiRouter.post("/ask-rag", async (req, res) => {
    try {
      const { question, conventionId } = req.body;
      
      if (!question || !conventionId) {
        return res.status(400).json({ 
          error: "Question et convention requises",
          message: "Veuillez fournir une question et spécifier une convention"
        });
      }
      
      console.log(`[Assistant] Question reçue: "${question}" pour convention ${conventionId}`);
      
      // Importer le service de récupération PDF
      const { pdfFetcher } = await import('./services/pdf-fetcher');
      
      try {
        // Récupérer le texte complet de la convention depuis le PDF
        console.log(`[Assistant] Récupération du texte PDF pour convention ${conventionId}`);
        const conventionText = await pdfFetcher.getConventionText(conventionId);
        
        if (!conventionText || conventionText.trim().length === 0) {
          throw new Error('Texte vide ou non récupéré');
        }
        
        console.log(`[Assistant] Texte récupéré: ${conventionText.length} caractères`);
        
        // Diviser le texte en sections plus petites pour l'analyse
        const chunks = splitTextIntoChunks(conventionText, 3000);
        console.log(`[Assistant] Texte divisé en ${chunks.length} sections`);
        
        // Rechercher les sections pertinentes
        const relevantChunks = findRelevantChunks(chunks, question, 3);
        
        if (relevantChunks.length === 0) {
          return res.json({
            question,
            answer: `Je n'ai pas trouvé d'informations pertinentes dans cette convention collective (${conventionId}) pour répondre à votre question : "${question}".`,
            sources: [],
            method: 'PDF direct (aucun résultat)',
            conventionId
          });
        }
        
        const relevantContent = relevantChunks.map(chunk => chunk.text).join('\n\n');
        
        // Utiliser OpenAI pour répondre avec ce contenu spécifique
        const prompt = `Vous êtes un expert en droit du travail français. Répondez à la question suivante en vous basant UNIQUEMENT sur le contenu de cette convention collective.

Convention: ${conventionId}
Question: ${question}

Contenu pertinent de la convention:
${relevantContent}

Consignes:
- Répondez de manière précise et professionnelle
- Citez les articles ou références quand c'est pertinent
- Si l'information n'est pas présente dans cette convention, dites-le clairement
- Restez factuel et basé sur le contenu fourni`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const answer = completion.choices[0].message.content || "Désolé, je n'ai pas pu traiter votre question.";
        
        return res.json({
          question,
          answer,
          sources: relevantChunks.map((chunk, index) => ({
            conventionId,
            section: `Section ${index + 1}`,
            content: chunk.text.substring(0, 200) + '...',
            relevanceScore: chunk.relevanceScore
          })),
          method: 'PDF direct',
          conventionId,
          textLength: conventionText.length
        });
        
      } catch (pdfError: any) {
        console.error(`[Assistant] Erreur PDF:`, pdfError);
        
        return res.status(500).json({
          error: "Erreur d'accès au document",
          message: `Impossible d'accéder au document de la convention ${conventionId}: ${pdfError.message}`
        });
      }
      
    } catch (error: any) {
      console.error(`[Assistant] Erreur générale:`, error);
      
      res.status(500).json({
        error: "Erreur lors du traitement",
        message: "Une erreur est survenue lors du traitement de votre question."
      });
    }
  });

  // Méthodes utilitaires pour le traitement du texte
  function splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  function findRelevantChunks(chunks: string[], question: string, limit: number): Array<{text: string, relevanceScore: number}> {
    const questionWords = question.toLowerCase().split(' ').filter(w => w.length > 3);
    const relevantChunks: Array<{text: string, relevanceScore: number}> = [];
    
    for (const chunk of chunks) {
      const chunkText = chunk.toLowerCase();
      let relevanceScore = 0;
      
      for (const word of questionWords) {
        const occurrences = (chunkText.match(new RegExp(word, 'g')) || []).length;
        relevanceScore += occurrences;
      }
      
      if (relevanceScore > 0) {
        relevantChunks.push({
          text: chunk,
          relevanceScore
        });
      }
    }
    
    // Trier par pertinence et retourner les meilleurs résultats
    relevantChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return relevantChunks.slice(0, limit);
  }
  
  // Routes pour la recherche par code NAF
  apiRouter.get("/naf/search", async (req, res) => {
    try {
      const { code, sector, keyword } = req.query;

      let results = [];

      if (code) {
        results = nafService.searchByNafCode(code as string);
      } else if (sector) {
        results = nafService.searchBySector(sector as string);
      } else if (keyword) {
        results = nafService.searchByKeyword(keyword as string);
      } else {
        return res.status(400).json({
          message: "Au moins un paramètre de recherche est requis (code, sector, ou keyword)"
        });
      }

      res.json({
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur lors de la recherche NAF:", error);
      res.status(500).json({
        message: "Erreur lors de la recherche NAF",
        error: error.message
      });
    }
  });

  // Route pour obtenir tous les codes NAF disponibles
  apiRouter.get("/naf/codes", async (req, res) => {
    try {
      const codes = nafService.getAllNafCodes();
      res.json({
        codes,
        count: codes.length
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des codes NAF:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des codes NAF",
        error: error.message
      });
    }
  });

  // Route pour obtenir tous les secteurs disponibles
  apiRouter.get("/naf/sectors", async (req, res) => {
    try {
      const sectors = nafService.getAllSectors();
      res.json({
        sectors,
        count: sectors.length
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des secteurs:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des secteurs",
        error: error.message
      });
    }
  });

  // Route pour obtenir les informations d'une convention spécifique
  apiRouter.get("/naf/convention/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const info = nafService.getConventionInfo(id);

      if (!info) {
        return res.status(404).json({
          message: "Convention non trouvée"
        });
      }

      res.json(info);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des informations de convention:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des informations",
        error: error.message
      });
    }
  });

  // Route pour obtenir les statistiques du service NAF
  apiRouter.get("/naf/stats", async (req, res) => {
    try {
      const stats = nafService.getStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des statistiques NAF:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des statistiques",
        error: error.message
      });
    }
  });

  // Route de test pour la conversion Markdown vers HTML
  apiRouter.get("/test/html-conversion/:conventionId/:sectionType", async (req, res) => {
    try {
      const { conventionId, sectionType } = req.params;
      
      // Récupérer le contenu Markdown de la section
      const section = getSection(conventionId, sectionType);
      
      if (!section) {
        return res.status(404).json({
          message: "Section non trouvée",
          conventionId,
          sectionType
        });
      }

      // Convertir en HTML
      const result = markdownHtmlConverter.convertToHtml(section.content);
      
      // Ajouter les styles CSS
      const css = markdownHtmlConverter.getEnhancedCss();
      
      res.json({
        success: true,
        section: {
          id: `${conventionId}_${sectionType}`,
          title: `Section ${sectionType}`,
          conventionId,
          sectionType
        },
        markdown: section.content,
        html: result.html,
        toc: result.toc,
        css: css,
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur lors de la conversion HTML:", error);
      res.status(500).json({
        message: "Erreur lors de la conversion HTML",
        error: error.message
      });
    }
  });

  // Route de recherche pour la page d'accueil (indexe UNIQUEMENT les libellés des conventions et IDCC)
  apiRouter.get("/search/conventions", async (req, res) => {
    try {
      const { q: query, limit = 50 } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({
          error: "La requête de recherche doit contenir au moins 2 caractères"
        });
      }

      console.log(`[Convention Search] Recherche globale: "${query}"`);
      
      // Obtenir toutes les conventions
      const allConventions = getConventions();
      
      if (!allConventions || allConventions.length === 0) {
        return res.json({ 
          results: [], 
          total: 0, 
          query 
        });
      }

      // Préparer les termes de recherche
      const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 1);
      const results: any[] = [];

      // Rechercher UNIQUEMENT dans les libellés et IDCC des conventions
      for (const convention of allConventions) {
        if (!convention.id || !convention.name) continue;

        const id = String(convention.id).toLowerCase();
        const name = String(convention.name).toLowerCase();
        let score = 0;
        const matches: string[] = [];

        // Calculer le score de pertinence
        for (const term of searchTerms) {
          let termScore = 0;
          
          // Correspondance exacte IDCC (score élevé)
          if (term.match(/^\d+$/) && id === term) {
            termScore = 10;
            matches.push(`IDCC ${term}`);
          }
          // IDCC avec préfixe
          else if (term.startsWith('idcc') && id === term.replace('idcc', '').trim()) {
            termScore = 10;
            matches.push(`IDCC ${id}`);
          }
          // Inclusion dans le nom de la convention
          else if (name.includes(term)) {
            // Score plus élevé si le terme apparaît au début du nom
            if (name.startsWith(term)) {
              termScore = 5;
            } else {
              termScore = 2;
            }
            matches.push(term);
          }
          
          score += termScore;
        }

        // Si des correspondances sont trouvées
        if (score > 0) {
          results.push({
            id: convention.id,
            name: convention.name,
            idcc: convention.id,
            url: convention.url,
            matches,
            score: score / searchTerms.length // Score normalisé
          });
        }
      }

      // Trier par score de pertinence (décroissant), puis par nom
      results.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });

      // Limiter les résultats
      const limitedResults = results.slice(0, Math.min(parseInt(String(limit)), 100));

      console.log(`[Convention Search] ${limitedResults.length} conventions trouvées pour "${query}"`);

      res.json({ 
        results: limitedResults,
        total: limitedResults.length,
        query 
      });

    } catch (error: any) {
      console.error("[Convention Search] Erreur:", error);
      res.status(500).json({
        error: "Erreur lors de la recherche",
        message: "Une erreur est survenue lors de la recherche des conventions."
      });
    }
  });

  // Route de recherche par mots-clés DANS LE CONTENU d'une convention spécifique
  apiRouter.post("/search/convention/:conventionId", async (req, res) => {
    try {
      const { conventionId } = req.params;
      const { query, limit = 20 } = req.body;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: "La requête de recherche doit contenir au moins 2 caractères"
        });
      }

      console.log(`[Content Search] Recherche DANS le contenu de la convention ${conventionId}: "${query}"`);

      // Obtenir toutes les sections de la convention
      const sections = getSectionsByConvention(conventionId);
      if (!sections || sections.length === 0) {
        return res.json({ results: [] });
      }

      // Préparer les termes de recherche
      const searchTerms = query.toLowerCase().split(/\s+/).filter((term: string) => term.length > 1);
      const results: any[] = [];

      // Rechercher dans chaque section
      for (const sectionData of sections) {
        if (!sectionData.content) continue;

        const content = sectionData.content.toLowerCase();
        let score = 0;
        const matches: string[] = [];

        // Calculer le score de pertinence
        for (const term of searchTerms) {
          const occurrences = (content.match(new RegExp(term, 'g')) || []).length;
          if (occurrences > 0) {
            score += occurrences;
            matches.push(term);
          }
        }

        // Si des correspondances sont trouvées
        if (score > 0) {
          const [category, subcategory] = sectionData.sectionType.split('.');
          
          // Convertir le contenu Markdown en HTML pour l'aperçu
          let previewContent = sectionData.content;
          
          // Nettoyage basique du Markdown pour l'aperçu
          previewContent = previewContent
            .replace(/#{1,6}\s+/g, '') // Supprimer les titres markdown
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Supprimer le gras markdown
            .replace(/\*([^*]+)\*/g, '$1') // Supprimer l'italique markdown
            .replace(/^\s*[-*+]\s+/gm, '• ') // Remplacer les listes markdown par des puces
            .replace(/^\s*\d+\.\s+/gm, '• ') // Remplacer les listes numérotées
            .replace(/\n{3,}/g, '\n\n') // Limiter les sauts de ligne multiples
            .trim();
          
          results.push({
            sectionType: sectionData.sectionType,
            sectionName: sectionData.sectionType,
            category,
            subcategory,
            content: previewContent.substring(0, 500), // Limiter à 500 caractères
            matches,
            score: score / searchTerms.length // Score normalisé
          });
        }
      }

      // Trier par score de pertinence (décroissant)
      results.sort((a, b) => b.score - a.score);

      // Limiter les résultats
      const limitedResults = results.slice(0, Math.min(limit, 50));

      console.log(`[Content Search] ${limitedResults.length} résultats trouvés dans le contenu pour "${query}"`);

      res.json({ 
        results: limitedResults,
        total: limitedResults.length,
        query 
      });

    } catch (error: any) {
      console.error("[Content Search] Erreur:", error);
      res.status(500).json({
        error: "Erreur lors de la recherche",
        message: "Une erreur est survenue lors de la recherche dans le contenu."
      });
    }
  });

  // Cache pour l'historique des conversations (en mémoire, par session)
  const chatHistoryCache = new Map<string, Array<{question: string, answer: string}>>();

  // Nouvelle route pour analyser avec les vrais PDFs et Gemini 1.5 Flash avec historique
  apiRouter.post("/chat-pdf", async (req, res) => {
    try {
      const { question, conventionId, sessionId, resetHistory } = req.body;
      
      if (!question || !conventionId) {
        return res.status(400).json({ 
          error: "Question et convention requises" 
        });
      }
      
      // Générer un sessionId unique si pas fourni
      const chatSessionId = sessionId || `${conventionId}_${Date.now()}`;
      
      // Réinitialiser l'historique si demandé
      if (resetHistory) {
        chatHistoryCache.delete(chatSessionId);
        console.log(`[PDF Chat] Historique réinitialisé pour session ${chatSessionId}`);
      }
      
      // Récupérer l'historique de cette session
      let chatHistory = chatHistoryCache.get(chatSessionId) || [];
      
      // Limiter l'historique à 3 questions maximum
      if (chatHistory.length >= 3) {
        return res.status(400).json({
          error: "Limite d'historique atteinte",
          message: "Vous avez atteint la limite de 3 questions. Veuillez réinitialiser la conversation pour poser de nouvelles questions.",
          needsReset: true,
          sessionId: chatSessionId
        });
      }
      
      console.log(`[PDF Chat] Question ${chatHistory.length + 1}/3: "${question}" pour IDCC ${conventionId} (session: ${chatSessionId})`);
      
      // Utiliser le service d'analyse PDF avec Gemini 1.5 Flash et historique
      const result = await pdfAnalysisService.analyzeConventionPDF(conventionId, question, chatHistory);
      
      // Sauvegarder dans l'historique
      chatHistory.push({
        question: question,
        answer: result.response
      });
      chatHistoryCache.set(chatSessionId, chatHistory);
      
      res.json({
        question,
        response: result.response,
        source: result.source,
        cost: result.cost,
        isExtended: result.isExtended,
        conventionId,
        sessionId: chatSessionId,
        questionCount: chatHistory.length,
        remainingQuestions: 3 - chatHistory.length,
        needsReset: chatHistory.length >= 3
      });
      
    } catch (error: any) {
      console.error('[PDF Chat] Erreur:', error);
      
      if (error.message.includes('introuvable')) {
        return res.status(404).json({
          error: "Convention non trouvée",
          message: "Le PDF de cette convention n'est pas disponible"
        });
      }
      
      res.status(500).json({
        error: "Erreur traitement",
        message: "Une erreur est survenue lors de l'analyse du PDF"
      });
    }
  });

  // Route pour lister les conventions PDF disponibles
  apiRouter.get("/pdf-conventions", async (req, res) => {
    try {
      const conventions = pdfAnalysisService.getAvailableConventions();
      res.json({
        total: conventions.length,
        conventions: conventions.slice(0, 50) // Limiter l'affichage
      });
    } catch (error: any) {
      console.error('[PDF List] Erreur:', error);
      res.status(500).json({
        error: "Erreur listage",
        message: "Impossible de lister les conventions PDF"
      });
    }
  });

  // Enregistrer les routes
  app.use('/api/admin', adminRouter);
  app.use("/api", apiRouter);
  return createServer(app);
}