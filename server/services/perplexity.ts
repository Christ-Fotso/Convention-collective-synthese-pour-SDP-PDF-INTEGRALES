import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_BASE = 'https://api.perplexity.ai';

if (!PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY is required");
}

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function queryPerplexity(messages: PerplexityMessage[]) {
  try {
    const response = await axios.post(
      `${PERPLEXITY_API_BASE}/chat/completions`,
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages,
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      citations: response.data.citations || []
    };
  } catch (error: any) {
    console.error('Perplexity API error:', error.response?.data || error.message);
    throw new Error('Failed to query Perplexity API');
  }
}
