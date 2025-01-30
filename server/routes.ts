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
      console.log('Sending chat message:', { 
        sourceId: req.body.sourceId,
        message: req.body.messages[req.body.messages.length - 1].content.substring(0, 100) + '...'
      });

      const chatRequest = {
        sourceId: req.body.sourceId,
        messages: req.body.messages,
        config: {
          temperature: 0.1,
          contextWindow: 8192,
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