import axios from 'axios';
import type { Convention, ChatRequestBody, ChatResponse } from '@/types';

const API_BASE = '/api';

export async function getConventions(): Promise<Convention[]> {
  const { data } = await axios.get(`${API_BASE}/conventions`);
  return data;
}

export interface CreateSourceParams {
  url: string;
  conventionId: string;
}

export async function createChatPDFSource(params: CreateSourceParams): Promise<string> {
  const { data } = await axios.post(`${API_BASE}/chat/source`, params);
  return data.sourceId;
}

export interface SendChatMessageParams extends ChatRequestBody {
  category: string;
  subcategory?: string;
  conventionId: string;
}

export async function sendChatMessage(params: SendChatMessageParams): Promise<ChatResponse> {
  try {
    const response = await axios.post(`${API_BASE}/chat/message`, params);
    
    // Gestion du code 202 (traitement asynchrone en cours)
    if (response.status === 202 && response.data.inProgress) {
      // Si la réponse contient un contenu temporaire, on le retourne
      if (response.data.content) {
        return {
          content: response.data.content,
          inProgress: true
        };
      }
      
      // Sinon, on retourne un message d'attente par défaut
      return {
        content: "⚠️ Cette information est en cours de génération.\n\nVeuillez patienter quelques instants, le traitement est en cours.",
        inProgress: true
      };
    }
    
    return response.data;
  } catch (error) {
    // Si l'erreur a une réponse et contient un message d'erreur formaté
    if (axios.isAxiosError(error) && error.response?.data?.content) {
      return error.response.data;
    }
    
    // Sinon, on relance l'erreur pour la traiter au niveau supérieur
    throw error;
  }
}

export async function deleteChatPDFSource(sourceId: string): Promise<void> {
  await axios.post(`${API_BASE}/chat/source/delete`, { sources: [sourceId] });
}