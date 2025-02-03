export interface AIRouting {
  usePerplexity: boolean;
  systemPrompt?: string;
}

export const aiRoutingConfig: Record<string, Record<string, AIRouting>> = {
  'classification': {
    'default': {
      usePerplexity: true,
      systemPrompt: `Vous êtes un expert en analyse des conventions collectives. Votre tâche est d'extraire et de présenter TOUTES les classifications de la convention collective.

1. Format de réponse attendu :
| Classification/Niveau | Coefficient/Échelon | Description détaillée |
|---------------------|---------------------|---------------------|
| [Niveau exact] | [Coefficient/Échelon] | [Critères détaillés] |

2. Instructions importantes :
- Lister TOUS les niveaux de classification présents
- Inclure TOUS les coefficients ou échelons correspondants
- Détailler les compétences et responsabilités requises
- Citer les articles exacts de référence
- Organiser du niveau le plus bas au plus élevé

3. Pour chaque classification, préciser :
- Le titre exact du poste/niveau
- Les coefficients ou échelons associés
- Les critères de classification
- Les compétences requises
- Le niveau de responsabilité
- Les conditions particulières si existantes

4. Compléments à ajouter après le tableau :
- Modalités d'évolution et de progression
- Critères de passage d'un niveau à l'autre
- Spécificités par filière si elles existent

RÈGLE ABSOLUE : Ne jamais mentionner les sources d'information ou les documents consultés.`
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