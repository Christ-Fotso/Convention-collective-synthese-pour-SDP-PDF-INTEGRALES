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

async function queryOpenAIForLegalData(conventionId: string, conventionName: string, type: 'classification' | 'salaires') {
  const prompt = type === 'classification' 
    ? `Pour la convention collective IDCC ${conventionId} (${conventionName}), analysez la classification de manière exhaustive en respectant strictement ce format:

1. Tableaux de classification
Présentez chaque grille de classification dans un tableau avec les colonnes suivantes :
| Niveau/Échelon | Coefficient | Description du poste | Date de modification | Statut extension |
Ajoutez des astérisques (*) en bas du tableau pour préciser :
- Les dates exactes d'extension
- Les dates de publication au Journal Officiel
- Toute information importante sur le statut d'extension

2. Valeur du point (si applicable)
- Présentez l'historique des valeurs du point dans un tableau :
| Date d'effet | Valeur du point | Statut extension |
- Précisez la formule de calcul si elle existe

3. Spécificités par région/département
Pour chaque variation géographique, créez un tableau distinct :
| Région/Département | Particularités de classification | Date d'effet |

4. Pour chaque coefficient, détaillez dans des tableaux spécifiques :
| Coefficient | Formation requise | Expérience | Responsabilités | Autonomie |

5. Modalités d'évolution
Présentez dans un tableau :
| Niveau départ | Niveau arrivée | Conditions de passage | Durée minimale |

IMPORTANT: Ne présentez que les informations explicitement présentes dans Légifrance. Si une information n'est pas disponible, indiquez clairement "Information non disponible dans Légifrance" plutôt que d'extrapoler ou d'inventer des données.`
    : `Pour la convention collective IDCC ${conventionId} (${conventionName}), présentez les salaires minima sous forme de tableaux détaillés:

1. Grille principale des salaires minima
Utilisez ce format de tableau :
| Niveau/Coefficient | Salaire minimal | Date d'effet | Statut extension |
Pour chacune des 3 dernières années. 
Ajoutez des astérisques (*) en bas pour préciser :
- Les dates exactes d'extension
- Les dates de publication au Journal Officiel
- Les informations sur le statut d'extension (étendu/non étendu)

2. Système de calcul (si applicable)
Présentez dans un tableau :
| Date d'effet | Valeur du point | Coefficient hiérarchique | Statut extension |
Précisez en dessous la formule de calcul exacte utilisée.

3. Variations géographiques
Pour chaque région/département ayant des spécificités, créez un tableau :
| Niveau/Coefficient | Salaire minimal | Zone/Région | Date d'effet | Statut extension |

4. Historique des valeurs du point (si applicable)
Présentez dans un tableau chronologique :
| Date d'application | Valeur du point | Base de calcul | Statut extension |

IMPORTANT: 
- Ne présentez que les informations explicitement présentes dans Légifrance
- Si une information n'est pas disponible, indiquez clairement "Information non disponible dans Légifrance"
- Ne faites aucune extrapolation ou invention de données
- Si une année ou une région n'est pas mentionnée dans Légifrance, ne la présentez pas
- Tous les montants doivent être strictement ceux publiés dans Légifrance`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview-2025-03-11",
      messages: [
        {
          role: "system",
          content: `Vous êtes un expert en droit du travail spécialisé dans l'analyse des conventions collectives.

RÈGLES STRICTES À SUIVRE :
1. Utilisez UNIQUEMENT les données disponibles sur Légifrance comme source
2. Ne faites AUCUNE extrapolation ou invention d'information
3. Si une information n'est pas disponible sur Légifrance, indiquez-le explicitement
4. Ne combinez pas des informations de différentes sources
5. Ne faites aucune interprétation personnelle des données
6. Pour les dates et montants, citez uniquement ceux explicitement mentionnés dans Légifrance

Présentez systématiquement les données sous forme de tableaux avec des notes explicatives claires.
Pour toute section où l'information n'est pas disponible, indiquez "Information non disponible dans Légifrance" plutôt que de laisser un tableau vide ou d'inventer des données.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "text" },
      max_tokens: 4000
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

      // Special handling for classification and salary grids
      if (convention.length > 0 && 
          ((category === 'classification' && subcategory === 'classification-details') ||
           (category === 'remuneration' && subcategory === 'grille'))) {
        try {
          const type = category === 'classification' ? 'classification' : 'salaires';
          const response = await queryOpenAIForLegalData(
            convention[0].id,
            convention[0].name,
            type
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