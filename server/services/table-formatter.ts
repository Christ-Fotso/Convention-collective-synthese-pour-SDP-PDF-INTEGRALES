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

  // Détection de tableaux avec des indicateurs spéciaux comme ##
  if (text.includes('##') && text.includes('\n')) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const potentialTableLines = lines.filter(l => l.includes('##'));
    if (potentialTableLines.length >= 1) {
      return true;
    }
  }
  
  // Détection de tableaux récapitulatifs spécifiques 
  if (
    text.includes("Tableau récapitulatif") || 
    text.includes("Tableau d'identification") || 
    (text.includes("Tableau") && (text.includes("Durée") || text.includes("Période")))
  ) {
    return true;
  }
  
  // Détection de données qui ressemblent à un tableau
  const tableKeywords = [
    /niveau\s+\d+.+coefficient\s+\d+/i,
    /catégorie.+échelon/i,
    /groupe\s+\d+.+classe\s+\d+/i,
    /\d+\s+jours\s+ouvrables/i,
    /indemnité\s+de\s+\d+/i,
    /période\s+d['']essai/i,
    /durée\s+(maximale|minimale|initiale)/i,
    /renouvellement\s+possible/i,
    /rupture\s+anticipée/i
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
  // Utiliser une approche compatible avec des versions plus anciennes de TypeScript
  const matches: RegExpExecArray[] = [];
  let match;
  while ((match = tableRowPattern.exec(text)) !== null) {
    matches.push(match);
    // Pour éviter les boucles infinies avec regex global
    if (match.index === tableRowPattern.lastIndex) {
      tableRowPattern.lastIndex++;
    }
  }
  
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
 * Détecte et convertit les tableaux avec symboles ## en tableaux Markdown
 */
function processSpecialTables(text: string): string {
  const lines = text.split('\n');
  let result = [];
  let inSpecialTable = false;
  let tableStart = -1;
  let tableLines = [];
  let tableTitle = '';
  
  // Chercher les lignes avec des patterns ## ou un titre de tableau
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Chercher le titre du tableau
    if (
      (line.startsWith('##') && line.includes('Tableau')) ||
      (line.startsWith('Tableau') && (
        line.includes('récapitulatif') || 
        line.includes('d\'identification') || 
        line.includes('des dispositions')
      ))
    ) {
      tableTitle = line;
      inSpecialTable = true;
      tableStart = i;
      tableLines = [];
      continue;
    }
    
    // Dans un tableau spécial, collecter toutes les lignes pertinentes
    if (inSpecialTable) {
      // Si on trouve une ligne qui ressemble à une fin de tableau ou un nouveau titre
      if (line === '' || line.startsWith('#') || i === lines.length - 1) {
        inSpecialTable = false;
        
        // Si on a collecté suffisamment de lignes
        if (tableLines.length > 0) {
          // Déterminer les colonnes basées sur le contenu (analyse de motifs)
          const colNames = [];
          
          // Chercher des mots-clés communs pour déterminer les colonnes
          const columnKeywords = [
            'Catégorie', 'Profession', 'Durée', 'Préavis', 'Rupture', 'Renouvellement',
            'Date', 'Période', 'Convention', 'Conditions', 'Justification', 'Applicabilité'
          ];
          
          tableLines.forEach(tLine => {
            columnKeywords.forEach(keyword => {
              if (tLine.includes(keyword) && !colNames.includes(keyword)) {
                colNames.push(keyword);
              }
            });
          });
          
          // Si pas assez de colonnes détectées, utiliser des colonnes génériques
          if (colNames.length < 2) {
            colNames.push('Caractéristique');
            colNames.push('Valeur');
          }
          
          // Formater sous forme de table Markdown
          let mdTable = '';
          
          // Ajouter le titre comme h3
          if (tableTitle) {
            mdTable += `### ${tableTitle.replace(/^#+\s*/, '')}\n\n`;
          }
          
          // Créer l'en-tête de la table
          mdTable += '| ' + colNames.join(' | ') + ' |\n';
          mdTable += '| ' + colNames.map(() => '---').join(' | ') + ' |\n';
          
          // Analyser et ajouter chaque ligne du tableau
          tableLines.forEach(tLine => {
            // Diviser la ligne selon des séparateurs heuristiques
            let cells = [];
            
            // Cas 1: Séparation par pipes (si présents)
            if (tLine.includes('|')) {
              cells = tLine.split('|').map(c => c.trim()).filter(Boolean);
            }
            // Cas 2: Séparation par tirets ou flèches
            else if (tLine.includes(' - ') || tLine.includes(' → ')) {
              cells = tLine.split(/\s+-\s+|\s+→\s+/).map(c => c.trim());
            }
            // Cas 3: Utiliser des heuristiques pour diviser la ligne
            else {
              // Chercher des indices de mots-clés pour diviser
              let bestSplit = [tLine];
              
              for (const keyword of columnKeywords) {
                if (tLine.includes(keyword) && keyword !== tLine) {
                  const parts = tLine.split(new RegExp(`(${keyword})`));
                  // Regrouper les parties pertinentes
                  if (parts.length > 2) {
                    let newSplit = [];
                    let currentPart = '';
                    for (const part of parts) {
                      if (columnKeywords.includes(part) || part === '') {
                        if (currentPart) {
                          newSplit.push(currentPart.trim());
                          currentPart = '';
                        }
                        if (part) newSplit.push(part);
                      } else {
                        currentPart += part;
                      }
                    }
                    if (currentPart) newSplit.push(currentPart.trim());
                    // Si cette division crée plus de cellules, l'utiliser
                    if (newSplit.length > bestSplit.length) {
                      bestSplit = newSplit;
                    }
                  }
                }
              }
              
              cells = bestSplit;
            }
            
            // Si on n'a toujours qu'une seule cellule, la placer dans la première colonne
            if (cells.length === 1) {
              cells.push(''); // Ajouter une cellule vide
            }
            
            // Assurer qu'on a le bon nombre de cellules
            while (cells.length < colNames.length) {
              cells.push('');
            }
            
            // Créer la ligne markdown
            mdTable += '| ' + cells.join(' | ') + ' |\n';
          });
          
          // Remplacer les lignes originales par notre nouveau tableau
          for (let j = tableStart; j < i; j++) {
            result[j] = '';
          }
          result[tableStart] = mdTable;
        }
        
        // Ajouter la ligne courante
        result[i] = line;
      } else {
        // Ignorer les lignes vides ou qui commencent par ##
        if (line !== '' && !line.startsWith('##')) {
          tableLines.push(line);
        }
        result[i] = ''; // Marquer la ligne comme traitée
      }
    } else {
      // Ligne normale en dehors d'un tableau spécial
      result[i] = line;
    }
  }
  
  // Reconstruire le texte en joignant les lignes
  return result.join('\n');
}

/**
 * Fonction principale pour transformer et normaliser tous les tableaux dans un texte
 */
export function normalizeMarkdownTables(text: string): string {
  if (!text || !containsTableData(text)) return text;
  
  let result = text;
  
  // 0. Traiter les tableaux récapitulatifs/spéciaux
  if (text.includes('Tableau') || text.includes('##')) {
    result = processSpecialTables(result);
  }
  
  // 1. Traiter les tableaux markdown existants
  result = processMarkdownTables(result);
  
  // 2. Convertir les blocs de texte qui ressemblent à des tableaux
  const paragraphs = result.split('\n\n');
  const processed = paragraphs.map(para => {
    if (para.split('\n').length >= 3 && !para.includes('|') && (
        /\b(niveau|coefficient|catégorie|échelon|indemnité|jours|durée|période)\b/i.test(para)
    )) {
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
    .replace(/\|[\s-]+\|/g, '| --- |')
    // Améliorer l'espacement des cellules
    .replace(/\|\s+/g, '| ')
    .replace(/\s+\|/g, ' |')
    // Supprimer les lignes de tableau vides
    .replace(/\|(\s*\|)+\n/g, '');
  
  return result;
}