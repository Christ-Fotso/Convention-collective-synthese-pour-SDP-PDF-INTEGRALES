/**
 * Utilitaire de formatage spécialisé pour les informations générales
 * Transforme le texte avec barres verticales en tableau Markdown structuré
 */

/**
 * Convertit les informations générales contenant des barres verticales en tableau Markdown
 */
export function formatInfoGenerales(content: string): string {
  // Si déjà au format tableau Markdown, ne rien faire
  if (content.includes('| Champ | Valeur |')) {
    return content;
  }

  const lines = content.split('\n');
  let formattedContent = '';
  let inTableSection = false;
  let hasCreatedTable = false;

  // Ajouter le titre si présent
  if (lines[0] && lines[0].startsWith('## ')) {
    formattedContent += lines[0] + '\n\n';
  } else {
    formattedContent += '## Informations Générales\n\n';
  }

  // Créer l'en-tête du tableau
  formattedContent += '| Champ | Valeur |\n';
  formattedContent += '| --- | --- |\n';
  hasCreatedTable = true;

  // Parcourir chaque ligne pour extraire les informations
  let skipNextLine = false;
  for (let i = 0; i < lines.length; i++) {
    if (skipNextLine) {
      skipNextLine = false;
      continue;
    }

    const line = lines[i].trim();
    
    // Sauter les lignes vides et les lignes qui sont des titres
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    // Vérifier si la ligne contient des barres verticales
    if (line.includes('|')) {
      inTableSection = true;
      
      // Nettoyer les barres verticales multiples
      let cleanedLine = line.replace(/\|\s*\|/g, '|').trim();
      
      // Enlever les barres au début et à la fin si présentes
      if (cleanedLine.startsWith('|')) {
        cleanedLine = cleanedLine.substring(1);
      }
      if (cleanedLine.endsWith('|')) {
        cleanedLine = cleanedLine.substring(0, cleanedLine.length - 1);
      }
      
      // Nettoyer les espaces excessifs
      cleanedLine = cleanedLine.trim();
      
      // Découper par barre verticale
      const parts = cleanedLine.split('|').map(part => part.trim());
      
      // Si assez de parties pour faire une entrée de tableau
      if (parts.length >= 1) {
        // Gérer les entrées spéciales avec préfixes communs (ex: "Champ d'application | ...")
        if (parts[0].toLowerCase().includes('champ') && parts[0].toLowerCase().includes('application')) {
          formattedContent += `| **Champ d'application** | ${parts.slice(1).join(' ')} |\n`;
        } 
        // Gérer les entrées simples avec une seule partie
        else if (parts.length === 1) {
          // Vérifier si la ligne suivante pourrait être la valeur
          if (i + 1 < lines.length && !lines[i + 1].includes('|')) {
            formattedContent += `| **${parts[0]}** | ${lines[i + 1].trim()} |\n`;
            skipNextLine = true;
          } else {
            formattedContent += `| **${parts[0]}** | |\n`;
          }
        } 
        // Format standard Clé | Valeur
        else {
          formattedContent += `| **${parts[0]}** | ${parts.slice(1).join(' ')} |\n`;
        }
      }
    } 
    // Lignes sans barres verticales - les considérer comme des entrées simples si en mode tableau
    else if (inTableSection) {
      // Vérifier s'il s'agit d'une paire clé-valeur avec des deux-points
      if (line.includes(':')) {
        const colonParts = line.split(':');
        formattedContent += `| **${colonParts[0].trim()}** | ${colonParts.slice(1).join(':').trim()} |\n`;
      } 
      // Sinon, le considérer comme une continuation de l'entrée précédente
      else {
        const lastNewlinePos = formattedContent.lastIndexOf('\n');
        if (lastNewlinePos > 0) {
          // Insérer le texte avant le dernier caractère de nouvelle ligne
          formattedContent = formattedContent.substring(0, lastNewlinePos) + ' ' + line + formattedContent.substring(lastNewlinePos);
        }
      }
    }
  }

  // Si aucun tableau n'a été créé, ajouter un tableau par défaut
  if (!hasCreatedTable) {
    formattedContent += '| Champ | Valeur |\n';
    formattedContent += '| --- | --- |\n';
    formattedContent += '| **Aucune information structurée trouvée** | Veuillez consulter le texte original |\n';
  }

  return formattedContent;
}