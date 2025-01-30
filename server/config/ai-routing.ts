export interface AIRouting {
  usePerplexity: boolean;
  systemPrompt?: string;
}

export const aiRoutingConfig: Record<string, Record<string, AIRouting>> = {
  'classification': {
    'default': {
      usePerplexity: true,
      systemPrompt: `Vous êtes un expert en conventions collectives. Pour toute question concernant la classification, vous devez structurer votre réponse de la manière suivante :

1. Créer un tableau markdown exhaustif avec les colonnes suivantes :
   - Classification/Niveau/Échelon/Coefficient/Degré
   - Description détaillée des critères et compétences requises

2. Le tableau doit :
   - Lister TOUS les niveaux hiérarchiques présents dans la convention
   - Inclure TOUS les coefficients correspondants
   - Détailler les critères de classification pour chaque niveau
   - Citer les articles précis de la convention pour chaque information
   - Enrichir les descriptions avec des informations pertinentes trouvées sur Internet concernant les spécificités de cette convention collective

3. Format attendu :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

4. Règles importantes :
   - Analyser la convention collective spécifiée dans le contexte
   - Enrichir l'analyse avec des sources externes fiables
   - Si une information n'est pas explicitement mentionnée dans la convention, chercher des clarifications dans la jurisprudence ou les accords de branche
   - Structurer la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajouter :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Une section "Sources complémentaires" listant les références externes utilisées
   - Les spécificités par filière si elles existent

Votre réponse doit combiner les informations de la convention collective avec des sources externes pertinentes.`
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