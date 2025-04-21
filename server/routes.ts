import express, { type Express } from "express";
import axios from "axios";
import { createServer, type Server } from "http";
import { db } from "@db";
import { conventions, chatpdfSources } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { queryPerplexity } from "./services/perplexity";
import { shouldUsePerplexity } from "./config/ai-routing";
import { fileURLToPath } from 'url';
import path from 'path';
import OpenAI from "openai";

const CHATPDF_API_BASE = "https://api.chatpdf.com/v1";
const CHATPDF_API_KEY = process.env.CHATPDF_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!CHATPDF_API_KEY) {
  throw new Error("CHATPDF_API_KEY is required");
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache pour les PDFs (avec limite de 20 PDFs)
class LimitedCache {
  private cache = new Map();
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
      // Si le cache est plein, supprimer la première entrée (la plus ancienne dans un Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const pdfCache = new LimitedCache(20); // Limite à 20 PDFs en cache

async function queryOpenAIForLegalData(conventionId: string, conventionName: string, type: 'classification' | 'salaires') {
  const prompt = type === 'classification'
    ? `Pour la convention collective IDCC ${conventionId} (${conventionName}), détaillons la classification:

1. Coefficients hiérarchiques par catégorie/niveau
2. Pour chaque coefficient:
   - Critères précis d'attribution
   - Responsabilités associées
   - Compétences requises
   - Conditions d'expérience
   - Niveau de formation requis
3. Spécificités:
   - Variations régionales ou départementales si elles existent
   - Conditions particulières d'application
   - Périodes d'essai spécifiques
4. Evolution et progression:
   - Critères de passage d'un coefficient à l'autre
   - Périodes d'évolution automatique si prévues

Formatez la réponse en markdown avec des tableaux et des sections clairement définies pour une meilleure lisibilité.`
    : `Pour la convention collective IDCC ${conventionId} (${conventionName}), donnez-moi les informations concernant les salaires minima des 3 dernières années (étendus et non étendus). Basez-vous uniquement sur les données de Légifrance. Formatez la réponse en markdown avec des tableaux pour plus de clarté.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview-2025-03-11",
      messages: [
        {
          role: "system",
          content: "Vous êtes un expert en droit du travail spécialisé dans l'analyse des conventions collectives. Utilisez uniquement les données de Légifrance comme source. Concentrez-vous sur les informations factuelles et structurez votre réponse de manière claire et détaillée. Ne citez pas les sources mais assurez-vous que toutes les informations proviennent exclusivement de Légifrance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "text" }
    });

    return {
      content: response.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to fetch legal data');
  }
}

export function registerRoutes(app: Express): Server {
  const apiRouter = express.Router();

  apiRouter.get("/conventions", async (_req, res) => {
    try {
      const allConventions = await db.select().from(conventions);
      res.json(allConventions);
    } catch (error: any) {
      console.error('Error fetching conventions:', error.message);
      res.status(500).json({
        message: "Failed to fetch conventions",
        error: error.message
      });
    }
  });

  apiRouter.get("/proxy-pdf", async (req, res) => {
    try {
      const pdfUrl = req.query.url as string;
      if (!pdfUrl) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Vérifier si le PDF est en cache
      if (pdfCache.has(pdfUrl)) {
        const cachedData = pdfCache.get(pdfUrl);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.send(cachedData);
        return;
      }

      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // Réduction du timeout à 30 secondes
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        maxContentLength: 25 * 1024 * 1024 // Limite à 25MB
      });

      // Mettre en cache le PDF
      pdfCache.set(pdfUrl, response.data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.send(response.data);
    } catch (error: any) {
      console.error('Error proxying PDF:', error.message);
      res.status(500).json({
        message: "Failed to proxy PDF",
        error: error.message
      });
    }
  });

  apiRouter.post("/chat/source", async (req, res) => {
    try {
      const originalUrl = req.body.url;
      const conventionId = req.body.conventionId; // Ajouter l'ID de la convention

      if (!conventionId) {
        return res.status(400).json({ message: "Convention ID is required" });
      }

      // Vérifier si un sourceId existe déjà pour cette convention
      const existingSources = await db.select()
        .from(chatpdfSources)
        .where(eq(chatpdfSources.conventionId, conventionId))
        .orderBy(desc(chatpdfSources.createdAt))
        .limit(1);

      if (existingSources.length > 0) {
        console.log('Using cached sourceId for convention:', conventionId);
        return res.json({ sourceId: existingSources[0].sourceId });
      }

      // Si aucun sourceId n'existe, en créer un nouveau
      const proxyUrl = `${req.protocol}://${req.get('host')}/api/proxy-pdf?url=${encodeURIComponent(originalUrl)}`;

      const response = await axios.post(
        `${CHATPDF_API_BASE}/sources/add-url`,
        { url: proxyUrl },
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 90000 // Augmentation du timeout à 90 secondes pour les documents volumineux
        }
      );

      const sourceId = response.data.sourceId;

      // Enregistrer le nouveau sourceId dans la base de données
      await db.insert(chatpdfSources).values({
        conventionId,
        sourceId
      });

      console.log('Created and cached new sourceId for convention:', conventionId);
      res.json(response.data);
    } catch (error: any) {
      console.error('ChatPDF source creation error:', error.response?.data || error.message);
      res.status(500).json({
        message: "Failed to create ChatPDF source",
        error: error.response?.data || error.message
      });
    }
  });

  // Chat message endpoint
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const { sourceId, messages, category, subcategory, conventionId } = req.body;
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);

      // Special handling for classification only, no longer handling salary grid
      if (convention.length > 0 && category === 'classification' && subcategory === 'classification-details') {
        try {
          const response = await queryOpenAIForLegalData(
            convention[0].id,
            convention[0].name,
            'classification'
          );
          res.json(response);
        } catch (openaiError) {
          console.error('OpenAI error details:', openaiError);
          res.status(500).json({
            message: "Une erreur est survenue lors de la récupération des informations",
            error: openaiError.message
          });
        }
        return;
      }

      const routing = shouldUsePerplexity(category, subcategory);

      if (routing.usePerplexity) {
        console.log('Using Perplexity for category:', category, subcategory);
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
            throw new Error('Invalid Perplexity response');
          }
          res.json(response);
        } catch (perplexityError: any) {
          console.error('Perplexity error details:', {
            error: perplexityError,
            messages: perplexityMessages
          });
          res.status(500).json({
            message: "Une erreur est survenue lors de la récupération des informations",
            error: perplexityError.message
          });
        }
      } else {
        console.log('Using ChatPDF for category:', category, subcategory);
        try {
          const enhancedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.role === 'user'
              ? `${msg.content}\n\nVeuillez fournir une réponse détaillée basée sur la convention collective, en citant les articles pertinents.`
              : msg.content
          }));

          console.log('Sending request to ChatPDF with:', {
            sourceId,
            messages: enhancedMessages
          });

          const response = await axios.post(
            `${CHATPDF_API_BASE}/chats/message`,
            {
              sourceId,
              messages: enhancedMessages,
            },
            {
              headers: {
                "x-api-key": CHATPDF_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              timeout: 60000 // Augmentation du timeout pour les requêtes de messages ChatPDF
            }
          );

          if (!response.data || !response.data.content) {
            console.error('Invalid ChatPDF response:', response.data);
            throw new Error('Invalid response from ChatPDF');
          }

          console.log('ChatPDF response received:', response.data);
          res.json(response.data);
        } catch (chatPDFError: any) {
          console.error('ChatPDF error details:', {
            message: chatPDFError.message,
            response: chatPDFError.response?.data,
            status: chatPDFError.response?.status,
            stack: chatPDFError.stack
          });

          res.status(500).json({
            message: "Une erreur est survenue lors de la communication avec l'IA",
            error: chatPDFError.response?.data?.error || chatPDFError.message
          });
        }
      }
    } catch (error: any) {
      console.error('General error:', {
        error,
        stack: error.stack
      });
      res.status(500).json({
        message: "Une erreur est survenue lors de l'envoi du message",
        error: error.message
      });
    }
  });

  // Delete ChatPDF source
  apiRouter.post("/chat/source/delete", async (req, res) => {
    try {
      console.log('Deleting ChatPDF sources:', req.body.sources);
      await axios.post(
        `${CHATPDF_API_BASE}/sources/delete`,
        { sources: req.body.sources },
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      console.log('ChatPDF sources deleted');
      res.status(200).send();
    } catch (error: any) {
      console.error('Source deletion error:', error.response?.data || error.message);
      res.status(500).json({
        message: "Failed to delete ChatPDF source",
        error: error.response?.data || error.message
      });
    }
  });

  app.use("/api", apiRouter);
  return createServer(app);
}