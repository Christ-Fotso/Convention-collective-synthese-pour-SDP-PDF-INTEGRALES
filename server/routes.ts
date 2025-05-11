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

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
import { shouldUsePerplexity } from "./config/ai-routing";
import { createHash } from "crypto";
import {
  getApiMetrics,
  saveApiMetric,
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

// Import de notre cache persistant
import { LimitedCache } from "./services/cache-manager";

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
      
      // Vérifier que la convention existe dans les données JSON
      const existingConventions = getConventions();
      const conventionExists = existingConventions.some(conv => conv.id === conventionId);
      
      if (!conventionExists) {
        return res.status(404).json({
          message: "Convention non trouvée"
        });
      }
      
      // Récupérer la section depuis les données statiques
      const { getSection } = await import('./sections-data');
      const section = getSection(conventionId, sectionType);
      
      if (!section) {
        return res.status(404).json({
          message: "Section non trouvée"
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
      
      try {
        // Enregistrer dans la base de données pour maintenir la compatibilité avec le client
        await db.insert(chatpdfSources).values({
          conventionId: conventionId,
          sourceId: sourceId
        });
        
        console.log(`Session d'analyse initialisée pour la convention ${conventionId}: ${sourceId}`);
        res.json({ sourceId });
      } catch (error: any) {
        console.error(`Erreur lors de l'initialisation de la source:`, error);
        res.status(500).json({
          message: `Erreur lors de l'initialisation de la source: ${error.message}`
        });
      }
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

      // Traitement spécial pour la classification
      if (convention.length > 0 && category === 'classification' && subcategory === 'classification') {
        console.log('POST: Traitement de la classification pour la convention', conventionId);
        
        // Clé de cache
        const cacheKey = `classification_${conventionId}`;
        
        // Vérifier si la réponse est en cache
        if (openaiCache.has(cacheKey)) {
          console.log('Utilisation de la classification en cache');
          return res.json(openaiCache.get(cacheKey));
        }
        
        // Rechercher la section dans les données statiques
        const sectionType = `${category}.${subcategory}`;
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
          console.log('Classification obtenue et mise en cache avec succès');
          
          return res.json(response);
        }
        
        // Si la section n'existe pas, renvoyer un message d'erreur
        return res.status(404).json({
          message: `Section ${sectionType} non disponible pour la convention ${conventionId}`,
          content: `La classification n'est pas disponible pour cette convention collective. Nous sommes en train de compléter notre base de données de sections pré-extraites.`
        });
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
  
  // Enregistrer les routes
  app.use('/api/admin', adminRouter);
  app.use("/api", apiRouter);
  return createServer(app);
}