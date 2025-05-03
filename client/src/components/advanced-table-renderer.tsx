import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AdvancedTableRendererProps {
  content: string;
  className?: string;
}

export function AdvancedTableRenderer({ content, className = '' }: AdvancedTableRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);

  // Fonction pour détecter les tableaux Markdown et les formater correctement
  useEffect(() => {
    if (!content) return;

    // Étape 1: Préparation du contenu
    let newContent = content;

    // Remplacer les tableaux numériques avec symboles ## par des tables Markdown propres
    newContent = processNumericTables(newContent);

    // Étape 2: Formater les tableaux contenant des barres verticales
    newContent = processVerticalBarTables(newContent);

    // Étape 3: Nettoyer les espaces multiples, les lignes vides consécutives
    newContent = cleanupContent(newContent);

    setProcessedContent(newContent);
  }, [content]);

  // Fonction pour traiter les tableaux numériques (avec ##, etc.)
  function processNumericTables(text: string): string {
    // Recherche de motifs de lignes avec ## ou similaire
    const lines = text.split('\n');
    let inTable = false;
    let tableStart = -1;
    let tableContent: string[] = [];
    let result: string[] = [];

    // Parcourir les lignes pour détecter les tableaux
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Détection du début d'un tableau
      if (line.includes('##') || 
          line.includes('Tableau') || 
          (line.includes('**') && line.toLowerCase().includes('section'))) {
        if (!inTable) {
          inTable = true;
          tableStart = i;
          tableContent = [];
        }
        tableContent.push(line);
      } 
      // Si déjà dans un tableau, continuer à collecter les lignes
      else if (inTable) {
        // Détection de la fin du tableau (ligne vide ou nouvelle section)
        if (line === '' || line.startsWith('#') || (i === lines.length - 1)) {
          inTable = false;
          
          // Traiter les données du tableau collectées
          if (tableContent.length > 1) {
            // Convertir en table Markdown
            const markdownTable = convertToMarkdownTable(tableContent);
            
            // Remplacer les lignes du tableau original par notre nouvelle table
            for (let j = tableStart; j < i; j++) {
              result[j] = '';  // Effacer les lignes originales
            }
            
            // Ajouter le titre puis la table
            if (tableContent[0].includes('Tableau')) {
              result[tableStart] = `### ${tableContent[0]}`;
              result[tableStart + 1] = markdownTable;
            } else {
              result[tableStart] = markdownTable;
            }
          } else {
            // Si ce n'était pas vraiment un tableau, conserver les lignes originales
            for (let j = tableStart; j < i; j++) {
              result[j] = lines[j];
            }
          }
          
          // Ajouter la ligne courante (qui a terminé le tableau)
          result[i] = line;
        } else {
          // Continuer à collecter les lignes du tableau
          tableContent.push(line);
        }
      } else {
        // Ligne normale hors tableau
        result[i] = line;
      }
    }

    // Reconstruire le texte en conservant les lignes correctes
    return result.join('\n');
  }

  // Fonction pour convertir un tableau textuel en table Markdown
  function convertToMarkdownTable(tableRows: string[]): string {
    // Déterminer les colonnes en analysant le contenu
    const columns: string[] = [];
    const dataRows: string[][] = [];
    
    // Chercher les noms de colonnes possibles dans les premières lignes
    tableRows.forEach(row => {
      // Rechercher des indications de colonnes
      ['Catégorie', 'Champ', 'Valeur', 'Coefficient', 'Salaire', 'Date', 'Durée'].forEach(colName => {
        if (row.includes(colName) && !columns.includes(colName)) {
          columns.push(colName);
        }
      });
    });
    
    // Si pas assez de colonnes détectées, créer des colonnes génériques
    if (columns.length < 2) {
      if (tableRows[0].includes('Tableau')) {
        columns.push('Propriété');
        columns.push('Valeur');
      } else {
        columns.push('Champ');
        columns.push('Valeur');
      }
    }

    // Analyser les données
    tableRows.forEach(row => {
      if (row.includes('##') || row.includes('Tableau')) return; // Ignorer les titres
      
      // Pour les lignes avec séparateurs existants
      if (row.includes('|')) {
        const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
        dataRows.push(cells);
      } 
      // Pour les lignes avec des patterns comme "Champ: Valeur"
      else if (row.includes(':')) {
        const [key, ...valueParts] = row.split(':');
        const value = valueParts.join(':').trim();
        dataRows.push([key.trim(), value]);
      }
      // Pour les lignes avec "**section**" (cas spécial)
      else if (row.includes('**section**')) {
        const parts = row.split('**');
        if (parts.length >= 3) {
          const restOfLine = parts.slice(3).join('').trim();
          dataRows.push([parts[1], restOfLine || '-']);
        }
      }
      // Lignes normales - essayer de diviser intelligemment
      else if (row.trim()) {
        // Essayer de diviser en fonction des espaces multiples
        const parts = row.split(/\s{2,}/g).filter(Boolean);
        if (parts.length >= 2) {
          dataRows.push(parts);
        } else {
          dataRows.push([row, '-']);
        }
      }
    });
    
    // Créer l'en-tête de la table Markdown
    let markdownTable = '| ' + columns.join(' | ') + ' |\n';
    markdownTable += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
    
    // Ajouter les lignes de données
    dataRows.forEach(row => {
      let markdownRow = '| ';
      
      // Ajuster les données aux colonnes
      for (let i = 0; i < columns.length; i++) {
        markdownRow += (i < row.length ? row[i] : '') + ' | ';
      }
      
      markdownTable += markdownRow.trim() + '\n';
    });
    
    return markdownTable;
  }

  // Fonction pour traiter les tableaux avec barres verticales
  function processVerticalBarTables(text: string): string {
    // Diviser en paragraphes
    const paragraphs = text.split('\n\n');
    const processedParagraphs = paragraphs.map(paragraph => {
      // Vérifier si le paragraphe contient des barres verticales
      if (paragraph.includes('|')) {
        const lines = paragraph.split('\n');
        
        // Compter les barres verticales pour voir s'il s'agit d'un tableau
        const verticalBarsCount = (paragraph.match(/\|/g) || []).length;
        if (verticalBarsCount > 3) {
          // C'est probablement un tableau - vérifier s'il est bien formaté
          let hasHeaderSeparator = false;
          for (const line of lines) {
            if (line.includes('|---') || line.includes('| ---')) {
              hasHeaderSeparator = true;
              break;
            }
          }
          
          if (!hasHeaderSeparator && lines.length > 1) {
            // Tableau mal formaté - essayer de le réparer
            let headers: string[] = [];
            
            // Extraire les en-têtes potentiels
            const firstLine = lines[0].trim();
            if (firstLine.includes('|')) {
              headers = firstLine.split('|').map(h => h.trim()).filter(Boolean);
            } else {
              // Créer des en-têtes génériques basés sur le contenu
              const maxCellCount = Math.max(...lines.map(line => {
                return line.split('|').filter(Boolean).length;
              }));
              
              for (let i = 0; i < maxCellCount; i++) {
                headers.push(`Colonne ${i+1}`);
              }
            }
            
            // Reconstruire le tableau correctement
            let markdownTable = '| ' + headers.join(' | ') + ' |\n';
            markdownTable += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
            
            // Ajouter les lignes de données, en ignorant la première si elle contient les en-têtes
            const dataLines = firstLine.includes('|') ? lines.slice(1) : lines;
            dataLines.forEach(line => {
              if (line.trim() && line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
                markdownTable += '| ' + cells.join(' | ') + ' |\n';
              }
            });
            
            return markdownTable;
          }
        }
      }
      
      // Pas de traitement spécial nécessaire
      return paragraph;
    });
    
    return processedParagraphs.join('\n\n');
  }

  // Nettoyage général du contenu
  function cleanupContent(text: string): string {
    // Supprimer les espaces multiples
    let clean = text.replace(/ {2,}/g, ' ');
    
    // Remplacer les lignes vides multiples par une seule
    clean = clean.replace(/\n{3,}/g, '\n\n');
    
    // Améliorer le formatage des listes
    clean = clean.replace(/^[-*]\s+/gm, '- ');
    
    return clean;
  }

  return (
    <div className={`advanced-table-renderer ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Rendu des tableaux avec bordures et overflow
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-md border border-border shadow-sm">
              <table className="w-full border-collapse table-auto text-left" {...props} />
            </div>
          ),
          thead: props => <thead className="bg-muted/30" {...props} />,
          th: props => <th className="border border-border p-2 text-left font-semibold text-sm" {...props} />,
          td: props => <td className="border border-border p-2 text-sm align-top whitespace-normal break-words" {...props} />,
          tr: props => <tr className="hover:bg-muted/20" {...props} />,
          
          // Formatage des titres et texte
          h1: props => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: props => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: props => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: props => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
          p: props => <p className="my-2 leading-relaxed" {...props} />,
          ul: props => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
          ol: props => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
          li: props => <li className="mb-1" {...props} />,
          blockquote: props => <blockquote className="border-l-4 border-primary/20 pl-4 py-2 italic bg-muted/10 rounded-r" {...props} />
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}