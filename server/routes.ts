import express, { type Express } from "express";
import axios from "axios";
import { createServer, type Server } from "http";
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from "drizzle-orm";
import { queryPerplexity } from "./services/perplexity";
import { shouldUsePerplexity } from "./config/ai-routing";

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

  // Modified chat message endpoint to support both AIs
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const { sourceId, messages, category, subcategory } = req.body;
      const convention = await db.select().from(conventions).where(eq(conventions.id, req.body.conventionId)).limit(1);
      const routing = shouldUsePerplexity(category, subcategory);

      if (routing.usePerplexity) {
        console.log('Using Perplexity for category:', category, subcategory);
        const perplexityMessages = [];

        if (routing.systemPrompt && convention.length > 0) {
          const conventionContext = `Convention collective: IDCC ${convention[0].id} - ${convention[0].name}`;
          perplexityMessages.push({
            role: 'system',
            content: `${conventionContext}\n\n${routing.systemPrompt}`
          });
        }

        perplexityMessages.push(...messages);
        const response = await queryPerplexity(perplexityMessages);
        res.json(response);
      } else {
        console.log('Using ChatPDF for category:', category, subcategory);

        // Add detailed response instruction to the user's message
        const enhancedMessages = messages.map(msg => {
          if (msg.role === 'user') {
            return {
              ...msg,
              content: `${msg.content}\n\nVeuillez fournir une réponse exhaustive et détaillée, en citant tous les articles pertinents de la convention collective. N'omettez aucun détail important et structurez votre réponse de manière claire avec des sections si nécessaire.`
            };
          }
          return msg;
        });

        const response = await axios.post(
          `${CHATPDF_API_BASE}/v1/chats/message`,
          {
            sourceId,
            messages: enhancedMessages,
            config: {
              temperature: 0.1,
              contextWindow: 8192,
            }
          },
          {
            headers: {
              "x-api-key": CHATPDF_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        res.json(response.data);
      }
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