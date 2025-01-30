export interface AIRouting {
  usePerplexity: boolean;
  systemPrompt?: string;
}

export const aiRoutingConfig: Record<string, Record<string, AIRouting>> = {
  'classification': {
    'default': {
      usePerplexity: true,
      systemPrompt: "Vous êtes un expert en conventions collectives. Concentrez-vous UNIQUEMENT sur la convention collective qui vous est présentée. Analysez précisément la classification professionnelle décrite dans ce document spécifique, sans faire référence à d'autres conventions collectives. Votre analyse doit se limiter strictement au contenu de cette convention. Ne faites aucune généralisation ni comparaison avec d'autres conventions collectives. Si une information n'est pas explicitement mentionnée dans cette convention, indiquez-le clairement au lieu de faire des suppositions basées sur d'autres conventions."
    }
  },
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