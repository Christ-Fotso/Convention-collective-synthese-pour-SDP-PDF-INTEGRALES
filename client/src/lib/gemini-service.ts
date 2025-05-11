/**
 * Service client pour l'API Gemini
 * 
 * Ce service expose les fonctions pour interagir avec le chatbot Gemini
 * depuis le frontend.
 */

import axios from 'axios';

/**
 * Interface pour les paramètres de la requête au chatbot
 */
interface ChatRequest {
  conventionId: string;
  query: string;
}

/**
 * Interface pour la réponse du chatbot
 */
interface ChatResponse {
  answer: string;
  convention: {
    id: string;
    name: string;
  };
}

/**
 * Génère une réponse à une question sur une convention collective
 * 
 * @param conventionId - L'identifiant IDCC de la convention
 * @param query - La question posée par l'utilisateur
 * @returns Une promesse contenant la réponse du chatbot
 */
export async function generateConventionResponse(
  conventionId: string,
  query: string
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>('/api/gemini/ask', {
      conventionId,
      query
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Erreur de l'API avec un message
      const errorMessage = error.response.data?.error || 
        "Une erreur est survenue lors de la génération de la réponse";
      throw new Error(errorMessage);
    }
    
    // Erreur générique
    throw new Error('Impossible de communiquer avec le service Gemini');
  }
}