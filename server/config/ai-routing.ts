export interface AIRouting {
  usePerplexity: boolean;
  systemPrompt?: string;
}

export const aiRoutingConfig: Record<string, Record<string, AIRouting>> = {
  'classification': {
    'default': {
      usePerplexity: true,
      systemPrompt: "Vous êtes un expert en conventions collectives. Concentrez-vous UNIQUEMENT sur la convention collective qui vous est présentée. Pour toute question concernant la classification, vous devez:\n\n1. Analyser UNIQUEMENT la convention collective spécifiée dans le contexte\n2. Ne faire référence à AUCUNE autre convention collective\n3. Limiter strictement votre analyse au contenu de cette convention spécifique\n4. Ne pas faire de généralisations basées sur d'autres conventions\n5. Si une information n'est pas explicitement mentionnée dans cette convention, l'indiquer clairement\n6. Toujours citer les articles précis de la convention concernée\n7. Structurer la réponse de manière claire et hiérarchique\n\nVotre réponse doit être exhaustive mais strictement limitée au contenu de la convention collective présentée."
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