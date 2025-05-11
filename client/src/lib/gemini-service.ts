import { GoogleGenerativeAI } from "@google/generative-ai";

// Récupération de la clé API depuis les variables d'environnement
const API_KEY = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;

// Initialisation de l'API
export const genAI = new GoogleGenerativeAI(API_KEY);

// Le modèle Gemini 1.5 Pro avec contexte étendu
export const MODEL_NAME = "gemini-1.5-pro";

// Fonction pour générer une réponse basée sur une question sur une convention collective
export async function generateConventionResponse(
  conventionId: string,
  conventionName: string, 
  allSections: { sectionType: string; content: string; label: string }[],
  query: string
): Promise<string> {
  try {
    // Configuration du modèle avec des paramètres optimisés
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Construire le système de prompt avec le contexte de la convention
    const systemPrompt = `Vous êtes un assistant expert en droit du travail français, spécialisé dans les conventions collectives.
Vous répondez à des questions concernant la convention collective ${conventionName} (IDCC: ${conventionId}).
Basez vos réponses uniquement sur le contenu de la convention collective qui vous est fourni ci-dessous.
Si les informations ne sont pas présentes dans le contexte fourni, indiquez clairement que cette information n'est pas disponible dans la convention collective.
Soyez précis, factuel et concis dans vos réponses. Citez les articles pertinents si possible.
Lorsque vous citez la convention, encadrez les références d'articles avec des caractères comme "Article 5.1" ou mettez-les en gras avec **Article 5.1**.

CONTEXTE DE LA CONVENTION COLLECTIVE:
`;

    // Construction du contenu de la convention par sections
    let conventionContent = "";
    for (const section of allSections) {
      conventionContent += `### ${section.label}\n${section.content}\n\n`;
    }

    // Construction du prompt complet
    const prompt = `${systemPrompt}\n${conventionContent}\n\nQUESTION DE L'UTILISATEUR: ${query}`;

    // Génération de la réponse
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse:", error);
    return "Désolé, une erreur s'est produite lors de la génération de la réponse. Veuillez réessayer ultérieurement.";
  }
}