import { Express, Request, Response, NextFunction, Router } from "express";
import { createServer } from "http";
import axios from "axios";
import { Server } from "node:http";
import { parse as parseUrl } from "url";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { conventions, chatpdfSources } from "../db/schema";
import { queryPerplexity } from "./services/perplexity";
import { getConventionText, queryOpenAI, queryOpenAIForLegalData } from "./services/openai";
import { shouldUsePerplexity } from "./config/ai-routing";
import { createHash } from "crypto";

// Cache limité pour éviter de refaire les mêmes requêtes coûteuses
class LimitedCache {
  public cache = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Cache pour les réponses OpenAI
const openaiCache = new LimitedCache(50);

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
      const allConventions = await db.select().from(conventions);
      res.json(allConventions);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conventions:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des conventions",
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

  // Endpoint pour créer une nouvelle session d'analyse GPT-4o
  apiRouter.post("/chat/source", async (req, res) => {
    try {
      const { url, conventionId } = req.body;
      
      if (!url || !conventionId) {
        return res.status(400).json({
          message: "URL et conventionId sont requis"
        });
      }

      // Pour des raisons de compatibilité avec le client, nous générons un identifiant unique
      // qui remplace le sourceId de ChatPDF
      const sourceId = `src_${createHash('md5').update(`${conventionId}_${Date.now()}`).digest('hex').substring(0, 20)}`;
      
      console.log(`Création d'une nouvelle session GPT-4o pour la convention ${conventionId}`);
      
      // Enregistrer dans la base de données pour maintenir la compatibilité
      await db.insert(chatpdfSources).values({
        conventionId,
        sourceId
      });
      
      console.log(`Session GPT-4o créée pour la convention ${conventionId}: ${sourceId}`);
      res.json({ sourceId });
    } catch (error: any) {
      console.error("Erreur lors de la création de la session GPT-4o:", error);
      res.status(500).json({
        message: "Erreur lors de la création de la session GPT-4o",
        error: error.message
      });
    }
  });

  // Endpoint pour les messages de chat
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const { sourceId, messages, category, subcategory, conventionId } = req.body;
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);

      // Traitement spécial pour la classification, utilise une approche différente
      if (convention.length > 0 && category === 'classification' && subcategory === 'classification-details') {
        try {
          const response = await queryOpenAIForLegalData(
            convention[0].id,
            convention[0].name,
            'classification'
          );
          res.json(response);
        } catch (openaiError: any) {
          console.error('Erreur OpenAI:', openaiError);
          res.status(500).json({
            message: "Une erreur est survenue lors de la récupération des informations",
            error: openaiError.message
          });
        }
        return;
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
        // Utilisation de GPT-4o pour les autres catégories
        console.log('Utilisation de GPT-4o pour la catégorie:', category, subcategory);
        
        try {
          if (!convention.length) {
            throw new Error('Convention non trouvée');
          }
          
          // Créer une clé de cache unique
          const cacheKey = `${conventionId}_${category}_${subcategory}_${JSON.stringify(messages)}`;
          
          // Vérifier si la réponse est en cache
          if (openaiCache.has(cacheKey)) {
            console.log('Utilisation de la réponse en cache');
            return res.json(openaiCache.get(cacheKey));
          }
          
          // Récupérer le texte de la convention avec extraction intelligente basée sur la catégorie
          const conventionText = await getConventionText(
            convention[0].url, 
            conventionId,
            category,
            subcategory
          );
          
          // Requête à GPT-4o
          const response = await queryOpenAI(
            conventionText,
            messages,
            convention[0].id,
            convention[0].name
          );
          
          // Mettre en cache la réponse
          openaiCache.set(cacheKey, response);
          
          console.log('Réponse GPT-4o reçue et envoyée');
          res.json(response);
        } catch (openaiError: any) {
          console.error('Erreur GPT-4o:', {
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

  // Endpoint pour obtenir la classification d'une convention collective
  apiRouter.get("/convention/:id/classification", async (req, res) => {
    try {
      const conventionId = req.params.id;
      
      // Récupérer les informations de la convention
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId));
      
      if (convention.length === 0) {
        return res.status(404).json({ message: "Convention collective non trouvée" });
      }
      
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
    } catch (error: any) {
      console.error('Erreur générale:', error);
      res.status(500).json({
        message: "Une erreur est survenue",
        error: error.message
      });
    }
  });

  // Endpoint pour obtenir la grille de salaires d'une convention collective
  apiRouter.get("/convention/:id/salaires", async (req, res) => {
    try {
      const conventionId = req.params.id;
      
      // Récupérer les informations de la convention
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId));
      
      if (convention.length === 0) {
        return res.status(404).json({ message: "Convention collective non trouvée" });
      }
      
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
    } catch (error: any) {
      console.error('Erreur générale:', error);
      res.status(500).json({
        message: "Une erreur est survenue",
        error: error.message
      });
    }
  });

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

  app.use("/api", apiRouter);
  return createServer(app);
}