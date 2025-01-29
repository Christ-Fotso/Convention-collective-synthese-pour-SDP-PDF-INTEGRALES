import express, { type Express } from "express";
import axios from "axios";
import { createServer, type Server } from "http";
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from "drizzle-orm";

const CHATPDF_API_BASE = "https://api.chatpdf.com";
const CHATPDF_API_KEY = process.env.CHATPDF_API_KEY;

if (!CHATPDF_API_KEY) {
  throw new Error("CHATPDF_API_KEY is required");
}

export function registerRoutes(app: Express): Server {
  const apiRouter = express.Router();

  // Get all conventions
  apiRouter.get("/conventions", async (_req, res) => {
    const allConventions = await db.select().from(conventions);
    res.json(allConventions);
  });

  // Create ChatPDF source
  apiRouter.post("/chat/source", async (req, res) => {
    try {
      console.log('Creating ChatPDF source for URL:', req.body.url);

      const response = await axios.post(
        `${CHATPDF_API_BASE}/v1/sources/add-url`,
        { url: req.body.url },
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

  // Send chat message
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      console.log('Sending chat message:', { sourceId: req.body.sourceId });

      // Configuration enrichie pour des réponses plus détaillées
      const chatRequest = {
        ...req.body,
        referenceSources: true, // Force l'inclusion des références
        config: {
          systemPrompt: `Tu es un expert juridique spécialisé dans l'analyse des conventions collectives. Ta mission est de:
1. Fournir des réponses exhaustives et détaillées
2. Citer systématiquement les articles et sections pertinents
3. Expliquer le contexte et les implications de chaque disposition
4. Donner des exemples concrets d'application quand c'est pertinent
5. Ne jamais résumer ou simplifier les informations importantes`,
          temperature: 0.2, // Réduit la température pour des réponses plus précises et détaillées
          contextWindow: 8192, // Augmente la fenêtre de contexte au maximum
        }
      };

      const response = await axios.post(
        `${CHATPDF_API_BASE}/v1/chats/message`,
        chatRequest,
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('Chat response received, length:', response.data.content.length);
      res.json(response.data);
    } catch (error: any) {
      console.error('Chat message error:', error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to send message",
        error: error.response?.data || error.message
      });
    }
  });

  // Delete ChatPDF source
  apiRouter.post("/chat/source/delete", async (req, res) => {
    try {
      console.log('Deleting ChatPDF sources:', req.body.sources);

      await axios.post(
        `${CHATPDF_API_BASE}/v1/sources/delete`,
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