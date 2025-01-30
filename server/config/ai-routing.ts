export interface AIRouting {
  usePerplexity: boolean;
  systemPrompt?: string;
}

export const aiRoutingConfig: Record<string, Record<string, AIRouting>> = {
  'classification': {
    'default': {
      usePerplexity: true,
      systemPrompt: "Vous êtes un expert en conventions collectives. Concentrez-vous UNIQUEMENT sur la convention collective qui vous est présentée. Analysez précisément la classification professionnelle décrite dans ce document spécifique, sans faire référence à d'autres conventions collectives. Votre analyse doit se limiter strictement au contenu de cette convention."
    }
  },
  // Add other categories that should use Perplexity here
  'default': {
    'default': {
      usePerplexity: false
    }
  }
};

export function shouldUsePerplexity(category: string, subcategory?: string): AIRouting {
  const categoryConfig = aiRoutingConfig[category] || aiRoutingConfig['default'];
  return categoryConfig[subcategory || 'default'] || categoryConfig['default'] || aiRoutingConfig['default']['default'];
}