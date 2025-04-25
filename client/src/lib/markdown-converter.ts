import { type Message } from '@/types';

/**
 * Supprime les phrases d'introduction communes des réponses GPT
 * @param text Le texte à nettoyer
 * @returns Le texte sans les phrases d'introduction
 */
export function removeIntroductions(text: string): string {
  if (!text) return text;
  
  // Liste de motifs d'introduction à supprimer (expressions régulières)
  const introPatterns = [
    /^Voici (la|le|les|une|un|des) .{5,50}( :|:|\n)/i,
    /^Ci-dessous (figure|se trouve|vous trouverez) .{5,50}( :|:|\n)/i,
    /^(Je vous présente|Voici|Ci-dessous|D'après la convention|Selon la convention|Sur la base du texte) .{5,100}( :|:|\n)/i,
    /^(En analysant|Après analyse|Suite à l'analyse|Selon l'analyse) .{5,100}( :|:|\n)/i,
    /^Pour la convention collective IDCC \d+ .{5,80}( :|:|\n)/i,
    /^Basé(e)? sur le texte (fourni|de la convention) .{5,80}( :|:|\n)/i,
    /^Dans la convention collective (IDCC)? \d+ .{5,80}( :|:|\n)/i,
    /^La convention collective (IDCC)? \d+ .{5,80}( :|:|\n)/i
  ];
  
  // Supprimer les introductions
  let cleanedText = text;
  for (const pattern of introPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Supprimer aussi les phrases d'ouverture communes
  cleanedText = cleanedText.replace(/^(Voici|Ci-dessous) :/i, '');
  cleanedText = cleanedText.replace(/^Voici la réponse :/i, '');
  cleanedText = cleanedText.replace(/^Voici les informations demandées :/i, '');
  
  // Supprimer les espaces vides au début du texte après nettoyage
  cleanedText = cleanedText.trim();
  
  return cleanedText;
}

/**
 * Améliore le formatage Markdown des tables et des listes
 * @param text Le texte à formater
 * @returns Le texte avec un meilleur formatage
 */
export function improveMarkdownFormatting(text: string): string {
  if (!text) return text;
  
  let formatted = text;
  
  // Recherche de tableaux Markdown et amélioration de leur formatage
  const tablePattern = /(\|.*\|[\s]*\n\|[\s]*[-:]+[-|\s:]*\|[\s]*\n)((.*\|[\s]*\n)*)/g;
  formatted = formatted.replace(tablePattern, (matchedTable) => {
    // Séparer l'en-tête, la ligne de délimitation et les données
    const tableLines = matchedTable.split('\n');
    const processedLines = tableLines.map((line) => {
      if (!line.trim()) return line;  // Ignorer les lignes vides
      
      // Nettoyer chaque ligne du tableau pour améliorer l'espacement
      const cells = line.split('|');
      const processedCells = cells.map(cell => ` ${cell.trim()} `);
      
      // Reconstruire la ligne
      return processedCells.join('|').replace(/\|\s+\|/g, '| |').trim();
    });
    
    return processedLines.join('\n') + '\n\n';
  });
  
  // Amélioration des listes à puces (assurer espace après le tiret)
  formatted = formatted.replace(/^-([^\s])/gm, '- $1');
  formatted = formatted.replace(/^\*([^\s])/gm, '* $1');
  
  // Améliorer l'espacement des titres
  formatted = formatted.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
  
  // Assurer des sauts de ligne avant et après les tableaux
  formatted = formatted.replace(/([^\n])\n(\|.*\|)/g, '$1\n\n$2');
  formatted = formatted.replace(/(\|.*\|)\n([^\|\n])/g, '$1\n\n$2');
  
  // Assurer des sauts de ligne avant et après les titres
  formatted = formatted.replace(/([^\n])(\n#{1,6} )/g, '$1\n\n$2');
  formatted = formatted.replace(/(#{1,6} .+\n)([^\n])/g, '$1\n$2');
  
  // Amélioration du formatage des puces imbriquées
  formatted = formatted.replace(/^(\s*)[-*]([^\s])/gm, '$1- $2');
  
  // S'assurer que chaque ligne de tableau se termine par un caractère de tube
  formatted = formatted.replace(/^((\s*\|.+[^|]))\s*$/gm, '$1 |');
  
  // Assurer le formatage correct des délimiteurs de tableaux
  const delimiterLinePattern = /^\s*\|([\s-:]*\|)+\s*$/gm;
  formatted = formatted.replace(delimiterLinePattern, (match) => {
    // Ajouter au moins 3 traits d'union dans chaque cellule du délimiteur
    return match.replace(/:\s*:/g, ':---:')
                .replace(/:\s*\|/g, ':---|')
                .replace(/\|\s*:/g, '|---:')
                .replace(/\|\s*\|/g, '|---|')
                .replace(/^\s*\|/g, '|---')
                .replace(/\|\s*$/g, '---|');
  });
  
  return formatted;
}

// Fonction récursive pour convertir un objet en markdown (définie en dehors pour éviter les erreurs strict mode)
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

export function convertJsonToMarkdown(jsonString: string): string {
  // Si c'est "RAS", retourner une chaîne vide
  if (jsonString === "RAS") {
    return "";
  }

  try {
    const data = JSON.parse(jsonString);
    return objectToMarkdown(data);
  } catch (e) {
    // Si ce n'est pas du JSON valide, retourner la chaîne nettoyée et formatée
    const cleanedContent = removeIntroductions(jsonString);
    return improveMarkdownFormatting(cleanedContent);
  }
}
