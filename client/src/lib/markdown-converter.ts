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
  
  // Convertit les "faux tableaux" (sections avec | sans bon formatage Markdown) en vrais tableaux Markdown
  const fakeTablePattern = /(\|[\s-]+\|+[\s-]*\n)+/g;
  formatted = formatted.replace(fakeTablePattern, (match) => {
    // Nettoyer et formater comme un délimiteur de tableau
    return '|' + '---|'.repeat(match.split('|').length - 2) + '\n';
  });

  // Traiter les séparateurs de tableau mal formatés comme "---------------------"
  const badSeparatorPattern = /\| *[-]+ *\|/g;
  formatted = formatted.replace(badSeparatorPattern, '| --- |');

  // Détection et correction des faux délimiteurs (lignes avec beaucoup de traits d'union)
  formatted = formatted.replace(/\n([-]{5,})\n/g, '\n\n$1\n\n');

  // Transformer les lignes qui ressemblent à des tableaux (utilisant un | comme séparateur, mais pas proprement formatées)
  const messyTableRowPattern = /^([^|]*\|[^|]+\|[^|]*\|.*)/gm;
  formatted = formatted.replace(messyTableRowPattern, (match) => {
    // S'assurer que c'est bien un tableau en vérifiant le nombre de |
    const pipes = match.match(/\|/g);
    if (pipes && pipes.length >= 3) {
      // C'est un potentiel tableau, formater la ligne
      return match.split('|')
        .map(cell => cell.trim())
        .join(' | ')
        .replace(/^\s*\|\s*/, '| ')
        .replace(/\s*\|\s*$/, ' |');
    }
    return match;
  });

  // Convertir les tableaux horizontaux basés sur des traits d'union en tableaux Markdown
  formatted = formatted.replace(/(?:^|\n)([^\n]+)\n([-]{5,}[^\n]*)\n/g, (match, headerRow, delimiterRow) => {
    if (headerRow.includes('|') || !delimiterRow.includes('-')) return match;
    
    // Si le séparateur est juste une ligne continue de traits d'union, c'est un titre souligné, pas un tableau
    const trimmedDelimiter = delimiterRow.trim();
    let isContinuousDash = true;
    for (let i = 0; i < trimmedDelimiter.length; i++) {
      if (trimmedDelimiter[i] !== '-') {
        isContinuousDash = false;
        break;
      }
    }
    if (isContinuousDash) {
      return `\n## ${headerRow.trim()}\n\n`;
    }
    
    // Détecter les colonnes basées sur les groupes de traits d'union
    const columns = [];
    let startIndex = 0;
    let inColumn = false;
    
    for (let i = 0; i < delimiterRow.length; i++) {
      if (delimiterRow[i] === '-' && !inColumn) {
        startIndex = i;
        inColumn = true;
      } else if ((delimiterRow[i] !== '-' || i === delimiterRow.length - 1) && inColumn) {
        const endIndex = delimiterRow[i] === '-' ? i : i - 1;
        if (endIndex >= startIndex) {
          columns.push({ start: startIndex, end: endIndex });
        }
        inColumn = false;
      }
    }
    
    if (columns.length < 2) return match; // Pas assez de colonnes pour un tableau
    
    // Créer l'en-tête du tableau
    let markdownTable = '|';
    for (const column of columns) {
      const cellContent = headerRow.substring(column.start, column.end + 1).trim() || ' ';
      markdownTable += ` ${cellContent} |`;
    }
    markdownTable += '\n|';
    
    // Créer la ligne de délimitation
    for (let i = 0; i < columns.length; i++) {
      markdownTable += ' --- |';
    }
    markdownTable += '\n';
    
    return markdownTable;
  });

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

/**
 * Fonction pour transformer des lignes spécifiques contenant des patterns de tableaux courants
 * Cette fonction convertit certains formats non-markdown en tableaux markdown valides
 */
export function preprocessMarkdownTables(text: string): string {
  if (!text) return text;
  
  let processed = text;
  
  // Détection et transformation des lignes de "tableau" avec séparateur | mais sans structure markdown
  // Pattern: | Décès d'un enfant du salarié | 4 jours | | 
  const rowsWithSeparatorsPattern = /^(\s*\|\s*[^|\n]+\|\s*[^|\n]+\|\s*.*)$/gm;
  processed = processed.replace(rowsWithSeparatorsPattern, (match) => {
    // Vérifier si cette ligne n'est pas déjà un tableau markdown correctement formaté
    if (/\|\s*[-:]+\s*\|/.test(match)) return match;
    
    // Compter le nombre de cellules pour déterminer si c'est vraiment un tableau
    const cells = match.split('|').filter(part => part.trim().length > 0);
    if (cells.length < 2) return match;
    
    return match.trim();
  });
  
  // Trouver une séquence de lignes qui ressemblent à un tableau sans en-tête délimiteur
  const tableRowsPattern = /(\s*\|[^\n]+\|\s*\n)(\s*\|[^\n]+\|\s*\n)+/g;
  processed = processed.replace(tableRowsPattern, (match) => {
    const rows = match.trim().split('\n');
    // Si la deuxième ligne n'est pas un délimiteur, on en ajoute un
    if (rows.length > 1 && !/\|\s*[-:]+[-:|\s]*\|/.test(rows[1])) {
      // Compter le nombre de cellules dans la première ligne
      const cellCount = (rows[0].match(/\|/g) || []).length - 1;
      // Insérer un délimiteur après la première ligne
      rows.splice(1, 0, '|' + ' --- |'.repeat(cellCount));
    }
    return rows.join('\n') + '\n';
  });
  
  // Convertir les lignes avec tirets horizontaux (souvent mal formatées)
  const messyHorizontalLinePattern = /\|[-]{3,}\|/g;
  processed = processed.replace(messyHorizontalLinePattern, '| --- |');
  
  return processed;
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
    
    // Prétraiter le texte pour améliorer les tableaux
    const preprocessed = preprocessMarkdownTables(cleanedContent);
    
    // Appliquer les améliorations générales de formatage Markdown
    return improveMarkdownFormatting(preprocessed);
  }
}
