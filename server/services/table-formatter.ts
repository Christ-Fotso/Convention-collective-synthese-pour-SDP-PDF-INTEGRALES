/**
 * Utilitaire pour la normalisation et le formatage des tableaux dans les réponses OpenAI
 * Effectue un prétraitement avant stockage en base de données pour garantir une structure cohérente
 */

/**
 * Vérifie si un texte contient des tableaux ou des données tabulaires
 */
export function containsTableData(text: string): boolean {
  // Détection de tableaux markdown
  if (text.includes('|') && text.includes('\n')) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const potentialTableLines = lines.filter(l => l.includes('|'));
    return potentialTableLines.length >= 2;
  }
  
  // Détection de données qui ressemblent à un tableau
  const tableKeywords = [
    /niveau\s+\d+.+coefficient\s+\d+/i,
    /catégorie.+échelon/i,
    /groupe\s+\d+.+classe\s+\d+/i,
    /\d+\s+jours\s+ouvrables/i,
    /indemnité\s+de\s+\d+/i
  ];
  
  return tableKeywords.some(pattern => pattern.test(text));
}

/**
 * Normalise les lignes d'un tableau pour avoir un nombre cohérent de colonnes
 */
function normalizeTableRows(rows: string[]): string[] {
  if (rows.length < 2) return rows;
  
  // Compter le nombre maximum de colonnes
  const columnCounts = rows.map(row => (row.match(/\|/g) || []).length - 1);
  const maxColumns = Math.max(...columnCounts);
  
  // Normaliser chaque ligne pour avoir le même nombre de colonnes
  return rows.map(row => {
    const currentCount = (row.match(/\|/g) || []).length - 1;
    if (currentCount < maxColumns) {
      // Ajouter les colonnes manquantes
      return row + ' |'.repeat(maxColumns - currentCount);
    }
    return row;
  });
}

/**
 * Nettoie une cellule de tableau pour un affichage optimal
 */
function cleanTableCell(cellContent: string): string {
  return cellContent
    .trim()
    .replace(/\s{2,}/g, ' ')
    .replace(/\n/g, ' ');
}

/**
 * Extrait et normalise les tableaux d'un texte markdown
 */
function processMarkdownTables(text: string): string {
  const lines = text.split('\n');
  let inTable = false;
  let tableStartIndex = -1;
  let result = '';
  let currentTable: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détection du début d'un tableau
    if (line.startsWith('|') && line.endsWith('|') && !inTable) {
      inTable = true;
      tableStartIndex = i;
      currentTable = [line];
      continue;
    }
    
    // Continuation du tableau
    if (inTable && line.startsWith('|') && line.endsWith('|')) {
      currentTable.push(line);
      continue;
    }
    
    // Fin du tableau
    if (inTable && (!line.startsWith('|') || !line.includes('|'))) {
      inTable = false;
      
      // Traiter le tableau extrait
      const normalizedTable = normalizeTableRows(currentTable);
      
      // Assurer qu'il y a un délimiteur après la première ligne
      if (normalizedTable.length >= 2 && !normalizedTable[1].includes('---')) {
        const headerCellCount = (normalizedTable[0].match(/\|/g) || []).length - 1;
        normalizedTable.splice(1, 0, '|' + ' --- |'.repeat(headerCellCount));
      }
      
      // Reformater chaque cellule pour un meilleur affichage
      const cleanedTable = normalizedTable.map(row => {
        const cells = row.split('|').slice(1, -1); // Ignorer les séparateurs de début et fin
        return '| ' + cells.map(cleanTableCell).join(' | ') + ' |';
      });
      
      // Remplacer le tableau original
      for (let j = tableStartIndex; j < i; j++) {
        lines[j] = '';
      }
      
      // Ajouter le tableau normalisé
      result += cleanedTable.join('\n') + '\n\n';
      continue;
    }
    
    // Lignes hors tableau
    if (!inTable) {
      result += line + '\n';
    }
  }
  
  // Si on était encore dans un tableau à la fin du texte
  if (inTable && currentTable.length > 0) {
    const normalizedTable = normalizeTableRows(currentTable);
    
    // Assurer qu'il y a un délimiteur après la première ligne
    if (normalizedTable.length >= 2 && !normalizedTable[1].includes('---')) {
      const headerCellCount = (normalizedTable[0].match(/\|/g) || []).length - 1;
      normalizedTable.splice(1, 0, '|' + ' --- |'.repeat(headerCellCount));
    }
    
    // Ajouter le tableau final
    result += normalizedTable.join('\n');
  }
  
  return result.trim();
}

/**
 * Fonction pour convertir des lignes de texte mal formatées en tableau markdown
 */
function convertTextLinesToTable(text: string): string {
  // Expression régulière pour détecter des lignes qui ressemblent à des entrées de tableau
  const tableRowPattern = /^([A-Za-z0-9].+?)(\s{2,}|\t)(.+?)(?:(\s{2,}|\t)(.+?))?(?:(\s{2,}|\t)(.+?))?$/gm;
  
  // Vérifier s'il y a au moins deux lignes qui correspondent au pattern
  const matches = [...text.matchAll(tableRowPattern)];
  
  if (matches.length < 2) return text;
  
  // Déterminer le nombre de colonnes
  let maxColumns = 1;
  for (const match of matches) {
    let columnCount = 1; // Au moins une colonne
    for (let i = 2; i < match.length; i += 2) {
      if (match[i]) columnCount++;
    }
    maxColumns = Math.max(maxColumns, columnCount);
  }
  
  // Créer l'en-tête à partir de la première ligne
  const firstMatch = matches[0];
  let tableContent = '|';
  
  for (let i = 1; i < firstMatch.length; i += 2) {
    if (firstMatch[i]) {
      tableContent += ` ${firstMatch[i].trim()} |`;
    } else if (i < maxColumns * 2) {
      tableContent += ' |';
    }
  }
  
  tableContent += '\n|';
  
  // Ajouter la ligne de délimitation
  for (let i = 0; i < maxColumns; i++) {
    tableContent += ' --- |';
  }
  
  tableContent += '\n';
  
  // Ajouter les lignes de données (en sautant la première qui est devenue l'en-tête)
  for (let j = 1; j < matches.length; j++) {
    const match = matches[j];
    tableContent += '|';
    
    for (let i = 1; i < match.length; i += 2) {
      if (match[i]) {
        tableContent += ` ${match[i].trim()} |`;
      } else if (i < maxColumns * 2) {
        tableContent += ' |';
      }
    }
    
    tableContent += '\n';
  }
  
  return tableContent;
}

/**
 * Fonction principale pour transformer et normaliser tous les tableaux dans un texte
 */
export function normalizeMarkdownTables(text: string): string {
  if (!text || !containsTableData(text)) return text;
  
  let result = text;
  
  // 1. D'abord traiter les tableaux markdown existants
  result = processMarkdownTables(result);
  
  // 2. Convertir les blocs de texte qui ressemblent à des tableaux
  const paragraphs = result.split('\n\n');
  const processed = paragraphs.map(para => {
    if (para.split('\n').length >= 3 && !para.includes('|') && 
        /\b(niveau|coefficient|catégorie|échelon|indemnité|jours)\b/i.test(para)) {
      return convertTextLinesToTable(para);
    }
    return para;
  });
  
  result = processed.join('\n\n');
  
  // 3. Nettoyer les tableaux mal formatés (pipes mal alignés, etc.)
  result = result
    // Corriger les pipes consécutifs
    .replace(/\|\|+/g, '| |')
    // Assurer un espace après chaque pipe
    .replace(/\|(?!\s)/g, '| ')
    // Assurer un espace avant chaque pipe
    .replace(/(?<!\s)\|/g, ' |')
    // Corriger les délimiteurs mal formatés
    .replace(/\|[\s-]+\|/g, '| --- |');
  
  return result;
}