import express, { type Express } from "express";
import axios from "axios";
import { createServer, type Server } from "http";
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from "drizzle-orm";
import { queryPerplexity } from "./services/perplexity";
import { shouldUsePerplexity } from "./config/ai-routing";
import { fileURLToPath } from 'url';
import path from 'path';

const CHATPDF_API_BASE = "https://api.chatpdf.com/v1";
const CHATPDF_API_KEY = process.env.CHATPDF_API_KEY;

if (!CHATPDF_API_KEY) {
  throw new Error("CHATPDF_API_KEY is required");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: Express): Server {
  const apiRouter = express.Router();

  // Get all conventions
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

  // Proxy PDF endpoint
  apiRouter.get("/proxy-pdf", async (req, res) => {
    try {
      const pdfUrl = req.query.url as string;
      if (!pdfUrl) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      console.log('Proxying PDF from URL:', pdfUrl);

      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Forward the PDF content
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

  // Create ChatPDF source
  apiRouter.post("/chat/source", async (req, res) => {
    try {
      const originalUrl = req.body.url;
      // Use our proxy URL instead of the direct S3 URL
      const proxyUrl = `${req.protocol}://${req.get('host')}/api/proxy-pdf?url=${encodeURIComponent(originalUrl)}`;

      console.log('Creating ChatPDF source using proxy URL:', proxyUrl);

      const response = await axios.post(
        `${CHATPDF_API_BASE}/sources/add-url`,
        { url: proxyUrl },
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      console.log('ChatPDF source created:', response.data);
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
              timeout: 60000 
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