import React from 'react';

interface TextTableFormatterProps {
  content: string;
  className?: string;
}

/**
 * Composant spécialisé pour le formatage de n'importe quel contenu textuel 
 * contenant des barres verticales en tableaux HTML
 */
export function TextTableFormatter({ content, className = '' }: TextTableFormatterProps) {
  // Si pas de contenu, ne rien afficher
  if (!content) return null;

  // Fonction pour détecter si un texte contient un tableau potentiel
  const containsTable = (text: string): boolean => {
    // Un tableau potentiel contient plusieurs barres verticales
    const verticalBarCount = (text.match(/\|/g) || []).length;
    return verticalBarCount > 3;
  };

  // Diviser le contenu en paragraphes
  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  
  return (
    <div className={`text-table-formatter ${className}`}>
      {paragraphs.map((paragraph, index) => {
        // Si le paragraphe contient un tableau potentiel, le formater comme tel
        if (containsTable(paragraph)) {
          // Traiter le contenu pour identifier les lignes de tableau
          const lines = paragraph.split('\n').map(line => line.trim()).filter(Boolean);
          
          // Identifier les lignes qui sont des lignes de tableau (contenant des barres verticales)
          const tableLines = lines.filter(line => line.includes('|'));
          
          // Extraire les données du tableau
          const tableData = tableLines.map(line => {
            return line.split('|')
              .map(cell => cell.trim())
              .filter(Boolean);
          }).filter(row => row.length > 0);

          // Déterminer le nombre maximum de colonnes
          const maxColumns = Math.max(...tableData.map(row => row.length));
          
          // Si peu de données, ce n'est probablement pas un vrai tableau
          if (tableData.length <= 1 || maxColumns <= 1) {
            return (
              <div key={index} className="my-4 whitespace-pre-wrap">
                {paragraph.split("\n").map((line, i) => (
                  <p key={i} className="my-1">{line}</p>
                ))}
              </div>
            );
          }

          // Analyser les en-têtes (première ligne)
          const headers = tableData.length > 0 ? tableData[0] : [];
          const hasHeaders = headers.some(header => 
            header.includes('Catégorie') || 
            header.includes('Salaire') ||
            header.includes('Durée') ||
            header.includes('Date') ||
            header.includes('Coefficient')
          );

          // Créer les données du tableau en excluant les en-têtes si nécessaire
          const rows = hasHeaders ? tableData.slice(1) : tableData;
          
          return (
            <div key={index} className="my-6">
              <div className="overflow-x-auto rounded-md border border-border shadow-sm">
                <table className="w-full border-collapse table-auto text-left">
                  {hasHeaders && (
                    <thead className="bg-muted/30">
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="border border-border p-2 text-left font-semibold text-sm">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className={rowIndex % 2 === 0 ? 'bg-muted/10' : ''}
                      >
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex} 
                            className="border border-border p-2 text-sm align-top whitespace-normal break-words"
                          >
                            {cell}
                          </td>
                        ))}
                        {/* Ajouter des cellules vides si nécessaire */}
                        {hasHeaders && row.length < headers.length && (
                          Array(headers.length - row.length).fill(0).map((_, i) => (
                            <td key={`empty-${rowIndex}-${i}`} className="border border-border p-2 text-sm"></td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        
        // Sinon, le rendre normalement comme du texte
        return (
          <div key={index} className="my-4 whitespace-pre-wrap">
            {paragraph.split('\n').map((line, i) => (
              <p key={i} className="my-1">{line}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}