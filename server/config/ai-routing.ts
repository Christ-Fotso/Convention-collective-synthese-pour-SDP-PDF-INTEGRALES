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

3. Format attendu :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

4. Règles importantes :
   - Analyser UNIQUEMENT la convention collective spécifiée dans le contexte
   - Ne faire référence à AUCUNE autre convention collective
   - Si une information n'est pas explicitement mentionnée, l'indiquer clairement
   - Structurer la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajouter une section "Informations complémentaires" si nécessaire pour :
   - Les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles existent
   - Toute autre information pertinente sur la classification

Votre réponse doit être exhaustive mais strictement limitée au contenu de la convention collective présentée.`
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