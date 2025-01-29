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
      const response = await axios.post(
        `${CHATPDF_API_BASE}/sources/add-url`,
        { url: req.body.url },
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ChatPDF source" });
    }
  });

  // Send chat message
  apiRouter.post("/chat/message", async (req, res) => {
    try {
      const response = await axios.post(
        `${CHATPDF_API_BASE}/chats/message`,
        req.body,
        {
          headers: {
            "x-api-key": CHATPDF_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Delete ChatPDF source
  apiRouter.post("/chat/source/delete", async (req, res) => {
    try {
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
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ChatPDF source" });
    }
  });

  app.use("/api", apiRouter);

  return createServer(app);
}
