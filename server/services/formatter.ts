/**
 * Utilitaire de formatage spécialisé pour les informations générales
 * Transforme le texte avec barres verticales en tableau Markdown structuré
 */

/**
 * Analyse une chaîne pour déterminer si elle contient probablement des informations générales avec barres verticales
 */
function containsVerticalBarPattern(content: string): boolean {
  // Vérifie les modèles typiques d'informations générales avec barres
  return /Informations Générales/i.test(content) && 
         /\|/.test(content) && 
         (/IDCC \d+/.test(content) || /Convention collective/.test(content));
}

/**
 * Extrait les sections d'informations à partir du texte brut avec barres verticales
 */
function extractInfoSections(content: string): { title: string, sections: Record<string, string[]> } {
  // Détecter le titre principal
  let title = "Informations Générales";
  const titleMatch = content.match(/##?\s+(.+?)(?:\n|$)/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  // Identifier les sections principales
  const sections: Record<string, string[]> = {};
  
  // Initialiser les sections standards si aucune n'est trouvée
  const standardSections = ["Identifiants", "Champ d'application", "Dates clés", "Signataires", "Structure", "Modalités d'application"];
  standardSections.forEach(section => {
    sections[section] = [];
  });
  
  // Rechercher manuellement toutes les occurrences de sections
  const sectionRegex = /\|\s*section\s*\|\s*([^|]+)\s*\|/gi;
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const sectionName = match[1].trim();
    if (sectionName && !sections[sectionName]) {
      sections[sectionName] = [];
    }
  }
  
  // Analyse du contenu pour trouver des lignes qui commencent par des barres verticales
  const lines = content.split('\n');
  let currentSection = "Informations générales";
  
  for (const line of lines) {
    // Ignorer les lignes vides ou qui ne commencent pas par des barres
    if (!line.trim() || !line.includes('|')) continue;
    
    // Vérifier si c'est une ligne qui définit une section
    const sectionMatch = line.match(/\|\s*section\s*\|\s*([^|]+)\s*\|/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }
    
    // Extraire les informations de la ligne (champ | valeur)
    const parts = line.split('|').map(part => part.trim()).filter(part => part);
    if (parts.length >= 1) {
      // Si la section existe, ajouter l'information
      if (sections[currentSection]) {
        sections[currentSection].push(parts.join(' - '));
      } else {
        // Sinon, l'ajouter à la section générale
        if (!sections["Informations générales"]) {
          sections["Informations générales"] = [];
        }
        sections["Informations générales"].push(parts.join(' - '));
      }
    }
  }
  
  return { title, sections };
}

/**
 * Convertit les informations générales contenant des barres verticales en tableau Markdown
 */
export function formatInfoGenerales(content: string): string {
  // Si déjà au format tableau Markdown, ne rien faire
  if (content.includes('| Champ | Valeur |') && !containsVerticalBarPattern(content)) {
    return content;
  }

  // Stratégie 1: Utiliser l'extraction de sections pour les contenus structurés avec des barres verticales
  if (containsVerticalBarPattern(content)) {
    console.log("Détection d'informations générales avec barres verticales, application du formateur avancé");
    const { title, sections } = extractInfoSections(content);
    
    let formattedContent = `## ${title}\n\n`;
    
    // Créer un tableau pour chaque section qui contient des données
    for (const [sectionName, items] of Object.entries(sections)) {
      // Ne pas inclure les sections vides
      if (items.length === 0) continue;
      
      formattedContent += `### ${sectionName}\n\n`;
      formattedContent += '| Champ | Valeur |\n';
      formattedContent += '| --- | --- |\n';
      
      // Traiter les entrées de chaque section
      items.forEach(item => {
        // Si l'item contient un tiret, le considérer comme une paire clé-valeur
        if (item.includes(' - ')) {
          const [key, ...valueParts] = item.split(' - ');
          formattedContent += `| **${key.trim()}** | ${valueParts.join(' - ').trim()} |\n`;
        } 
        // Sinon, juste l'afficher comme un élément de liste
        else {
          formattedContent += `| **${item.trim()}** | |\n`;
        }
      });
      
      formattedContent += '\n';
    }
    
    return formattedContent.trim();
  }
  
  // Stratégie 2: Pour les contenus moins structurés, utiliser l'approche ligne par ligne
  console.log("Pas de structure spécifique d'informations générales détectée, application du formateur standard");
  const lines = content.split('\n');
  let formattedContent = '';
  
  // Extraire le titre s'il existe
  if (lines[0] && lines[0].startsWith('## ')) {
    formattedContent += lines[0] + '\n\n';
  } else {
    formattedContent += '## Informations Générales\n\n';
  }
  
  formattedContent += '| Champ | Valeur |\n';
  formattedContent += '| --- | --- |\n';
  
  // Récupérer toutes les lignes qui pourraient contenir des informations
  const infoLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#') && 
           (trimmed.includes(':') || trimmed.includes('|'));
  });
  
  // Si aucune information structurée n'est trouvée, ajouter une ligne par défaut
  if (infoLines.length === 0) {
    formattedContent += '| **Convention Collective** | Le contenu n\'est pas structuré |\n';
    return formattedContent;
  }
  
  // Traiter chaque ligne d'information
  infoLines.forEach(line => {
    const trimmed = line.trim();
    
    // Cas 1: Ligne avec deux-points (format clé: valeur)
    if (trimmed.includes(':') && !trimmed.includes('|')) {
      const [key, ...valueParts] = trimmed.split(':');
      formattedContent += `| **${key.trim()}** | ${valueParts.join(':').trim()} |\n`;
    }
    // Cas 2: Ligne avec barres verticales
    else if (trimmed.includes('|')) {
      // Nettoyer la ligne
      let parts = trimmed.split('|')
                          .map(part => part.trim())
                          .filter(part => part.length > 0);
      
      if (parts.length > 0) {
        // Premier élément comme clé, le reste comme valeur
        formattedContent += `| **${parts[0]}** | ${parts.slice(1).join(' ')} |\n`;
      }
    }
    // Cas 3: Autre format (juste afficher comme information)
    else {
      formattedContent += `| **Information** | ${trimmed} |\n`;
    }
  });
  
  return formattedContent;
}