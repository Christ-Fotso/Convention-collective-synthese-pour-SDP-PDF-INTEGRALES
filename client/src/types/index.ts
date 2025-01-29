export interface Convention {
  id: string; // IDCC
  name: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  references?: Array<{ pageNumber: number }>;
}

export interface ChatRequestBody {
  sourceId: string;
  messages: Message[];
  referenceSources?: boolean;
  stream?: boolean;
}
