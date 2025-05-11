import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { conventionsData, sectionsData } from "../data";

const router = Router();

// Initialisation de l'API Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-1.5-pro";

// Endpoint pour générer une réponse à partir d'une question sur une convention collective
router.post("/ask", async (req, res) => {
  try {
    const { conventionId, query } = req.body;

    if (!conventionId || !query) {
      return res.status(400).json({ error: "L'ID de convention et la question sont requis" });
    }

    // Récupérer les informations sur la convention
    const convention = conventionsData.find(c => c.id === conventionId);
    if (!convention) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }

    // Filtrer les sections pour cette convention
    const conventionSections = sectionsData.filter(s => s.conventionId === conventionId);
    if (conventionSections.length === 0) {
      return res.status(404).json({ error: "Aucune section trouvée pour cette convention" });
    }

    // Configuration du modèle
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Construction du prompt système
    const systemPrompt = `Vous êtes un assistant expert en droit du travail français, spécialisé dans les conventions collectives.
Vous répondez à des questions concernant la convention collective ${convention.name} (IDCC: ${conventionId}).
Basez vos réponses uniquement sur le contenu de la convention collective qui vous est fourni ci-dessous.
Si les informations ne sont pas présentes dans le contexte fourni, indiquez clairement que cette information n'est pas disponible dans la convention collective.
Soyez précis, factuel et concis dans vos réponses. Citez les articles pertinents si possible.
Lorsque vous citez la convention, encadrez les références d'articles avec des caractères comme "Article 5.1" ou mettez-les en gras avec **Article 5.1**.

CONTEXTE DE LA CONVENTION COLLECTIVE:
`;

    // Construction du contenu par sections
    let conventionContent = "";
    for (const section of conventionSections) {
      const sectionType = section.sectionType.split('.');
      const category = sectionType[0];
      const subcategory = sectionType[1] || "";
      
      // Formatage simple du texte pour le label
      const formatText = (text: string) => {
        return text
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };
      
      const sectionLabel = `${formatText(category)} - ${formatText(subcategory)}`;
      conventionContent += `### ${sectionLabel}\n${section.content}\n\n`;
    }

    // Construction du prompt complet
    const prompt = `${systemPrompt}\n${conventionContent}\n\nQUESTION DE L'UTILISATEUR: ${query}`;

    // Génération de la réponse
    const result = await model.generateContent(prompt);
    const response = result.response;

    res.json({ 
      answer: response.text(),
      convention: {
        id: convention.id,
        name: convention.name
      }
    });
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse:", error);
    res.status(500).json({ 
      error: "Une erreur s'est produite lors de la génération de la réponse", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;