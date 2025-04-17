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
  const { data } = await axios.post(`${API_BASE}/chat/message`, params);
  return data;
}

export async function deleteChatPDFSource(sourceId: string): Promise<void> {
  await axios.post(`${API_BASE}/chat/source/delete`, { sources: [sourceId] });
}