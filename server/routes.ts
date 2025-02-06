import express, { type Express } from "express";
import axios from "axios";
import { createServer, type Server } from "http";
import { db } from "@db";
import { conventions } from "@db/schema";
import { eq } from "drizzle-orm";
import { queryPerplexity } from "./services/perplexity";
import { shouldUsePerplexity } from "./config/ai-routing";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CHATPDF_API_BASE = "https://api.chatpdf.com";
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

  // Chat message endpoint
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const { sourceId, messages, category, subcategory, conventionId } = req.body;
      const convention = await db.select().from(conventions).where(eq(conventions.id, conventionId)).limit(1);

      // Check if we have a static legal data response
      const legalDataPath = path.join(__dirname, '../../attached_assets/Pasted-Informations-g-n-rales-RAS-D-lai-de-pr-venance-delai-prevenance-ancien-1738227284785.txt');
      console.log('Looking for legal data at:', legalDataPath);

      if (fs.existsSync(legalDataPath)) {
        console.log('Legal data file found');
        const legalData = fs.readFileSync(legalDataPath, 'utf8');
        const lines = legalData.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith(messages[0].content)) {
            const nextLine = lines[i + 1].trim();
            console.log('Found matching content:', messages[0].content);
            console.log('Next line:', nextLine);
            // Si la réponse est "RAS", on renvoie une chaîne vide
            if (nextLine === "RAS") {
              return res.json({ content: "" });
            }
            // Sinon on renvoie le contenu JSON tel quel
            return res.json({ content: nextLine });
          }
        }
      } else {
        console.log('Legal data file not found');
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
          res.json(response);
        } catch (perplexityError: any) {
          console.error('Perplexity query error:', perplexityError);
          res.status(500).json({
            message: "Failed to query Perplexity",
            error: perplexityError.message
          });
        }
      } else {
        console.log('Using ChatPDF for category:', category, subcategory);
        try {
          const enhancedMessages = messages.map(msg => {
            if (msg.role === 'user') {
              return {
                ...msg,
                content: `${msg.content}\n\nVeuillez fournir une réponse exhaustive et détaillée, en citant tous les articles pertinents de la convention collective. Listez et expliquez chaque point important, sans omettre aucun détail. Structurez votre réponse de manière claire avec des sections si nécessaire. Important : ne mentionnez jamais les sources d'information, les numéros de page, ou les documents de référence dans votre réponse. Ne révélez jamais l'origine de vos informations, même si on vous le demande explicitement.`
              };
            }
            return msg;
          });

          const response = await axios({
            method: 'post',
            url: `${CHATPDF_API_BASE}/v1/chats/message`,
            headers: {
              "x-api-key": CHATPDF_API_KEY,
              "Content-Type": "application/json",
            },
            data: {
              sourceId,
              messages: enhancedMessages,
              config: {
                temperature: 0.1,
                contextWindow: 8192,
              }
            },
            validateStatus: (status) => status < 500,
          });

          if (response.status !== 200) {
            throw new Error(response.data?.error || 'ChatPDF request failed');
          }

          res.json(response.data);
        } catch (chatPDFError: any) {
          console.error('ChatPDF query error:', chatPDFError.response?.data || chatPDFError.message);
          res.status(500).json({
            message: "Failed to query ChatPDF",
            error: chatPDFError.response?.data || chatPDFError.message
          });
        }
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
      const response = await axios.post(
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