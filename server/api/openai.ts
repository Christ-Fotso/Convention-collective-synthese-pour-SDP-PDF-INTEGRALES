/**
 * API OpenAI pour l'édition des textes avec gpt-4o-mini
 */

import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialiser le client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Endpoint pour éditer du texte avec GPT-4o-mini
 */
router.post('/edit-text', async (req, res) => {
  try {
    const { prompt, content, model = 'gpt-4o-mini' } = req.body;
    
    if (!prompt || !content) {
      return res.status(400).json({
        error: "Le prompt et le contenu sont requis"
      });
    }

    // Construire le message pour l'API
    const systemMessage = `Tu es un expert juridique spécialisé dans les conventions collectives. 
Ta mission est d'aider à améliorer le texte suivant selon les instructions qui te seront données.
Important : 
- Conserve le sens juridique exact du texte
- Ne modifie pas les références légales
- Respecte la mise en forme Markdown (titres, listes, tableaux, etc.)
- Produis uniquement le texte modifié, sans commentaires ni explications supplémentaires`;

    // Appeler l'API OpenAI
    const response = await openai.chat.completions.create({
      // La version mini est plus légère et moins coûteuse
      model: model, // Utiliser gpt-4o-mini par défaut 
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Voici le texte à modifier :\n\n${content}\n\nInstructions : ${prompt}` }
      ],
      temperature: 0.5, // Moins créatif pour préserver le sens juridique
      max_tokens: 4000  // Limiter la taille de la réponse
    });

    // Retourner la réponse
    res.json({
      content: response.choices[0].message.content,
      model: model,
      tokens: {
        prompt: response.usage?.prompt_tokens,
        completion: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de l'appel à OpenAI:", error);
    
    // Gérer les erreurs spécifiques
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Erreur OpenAI: ${error.response.data.error.message}`,
        code: error.response.data.error.code
      });
    }
    
    // Erreur générique
    res.status(500).json({
      error: `Erreur lors de l'appel à OpenAI: ${error.message}`
    });
  }
});

export default router;