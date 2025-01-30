import { type Message } from '@/types';

export function convertJsonToMarkdown(jsonString: string): string {
  // Si c'est "RAS", retourner une chaîne vide
  if (jsonString === "RAS") {
    return "";
  }

  try {
    const data = JSON.parse(jsonString);
    
    // Fonction récursive pour convertir un objet en markdown
    function objectToMarkdown(obj: any, level: number = 1): string {
      if (!obj) return '';
      
      let markdown = '';
      
      // Traitement des tableaux
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (typeof item === 'object') {
            markdown += objectToMarkdown(item, level);
          } else {
            markdown += `${'#'.repeat(level)} ${item}\n\n`;
          }
        });
        return markdown;
      }
      
      // Traitement des objets
      Object.entries(obj).forEach(([key, value]) => {
        // Ignorer les clés techniques
        if (key === 'type' || key === 'id') return;
        
        const title = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1);
        
        if (typeof value === 'object' && value !== null) {
          markdown += `${'#'.repeat(level)} ${title}\n\n`;
          markdown += objectToMarkdown(value, level + 1);
        } else if (Array.isArray(value)) {
          markdown += `${'#'.repeat(level)} ${title}\n\n`;
          value.forEach((item: any) => {
            markdown += `- ${item}\n`;
          });
          markdown += '\n';
        } else {
          markdown += `${'#'.repeat(level)} ${title}\n\n${value}\n\n`;
        }
      });
      
      return markdown;
    }

    return objectToMarkdown(data);
  } catch (e) {
    // Si ce n'est pas du JSON valide, retourner la chaîne telle quelle
    return jsonString;
  }
}
