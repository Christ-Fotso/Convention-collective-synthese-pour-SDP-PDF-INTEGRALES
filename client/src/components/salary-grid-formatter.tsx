import React from 'react';

interface SalaryGridFormatterProps {
  content: string;
  className?: string;
}

/**
 * Composant spécialisé pour le formatage des grilles salariales
 * Ce composant analyse le texte brut contenant des barres verticales
 * et le convertit en un tableau HTML proprement formaté
 */
export function SalaryGridFormatter({ content, className = '' }: SalaryGridFormatterProps) {
  // Si pas de contenu, ne rien afficher
  if (!content) return null;

  // Traiter le contenu pour identifier les lignes de tableau
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Identifier les lignes qui sont des lignes de tableau (contenant des barres verticales)
  const tableLines = lines.filter(line => line.includes('|'));
  
  // Si pas de lignes de tableau, afficher le contenu original
  if (tableLines.length === 0) {
    return <div className={className}>{content}</div>;
  }

  // Analyser les lignes de tableau pour extraire les données
  const tableData = tableLines.map(line => {
    // Séparer les cellules (en ignorant les cellules vides potentielles)
    return line.split('|')
      .map(cell => cell.trim())
      .filter(Boolean);
  }).filter(row => row.length > 0);

  // Analyser les en-têtes de tableau (première ligne)
  let headers: string[] = [];
  if (tableData.length > 0) {
    headers = tableData[0];
    // Si les en-têtes contiennent "Catégorie" ou "Salaire", considérer que c'est une ligne d'en-tête
    const isHeader = headers.some(header => 
      header.toLowerCase().includes('catégorie') || 
      header.toLowerCase().includes('salaire') ||
      header.toLowerCase().includes('coefficient')
    );
    
    // Si ce n'est pas une ligne d'en-tête valide, créer des en-têtes génériques
    if (!isHeader) {
      // Déterminer le nombre maximum de colonnes dans le tableau
      const maxColumns = Math.max(...tableData.map(row => row.length));
      headers = Array(maxColumns).fill('').map((_, i) => {
        if (i === 0) return 'Catégorie/Position';
        if (i === 1) return 'Coefficient';
        if (i === 2) return 'Salaire';
        if (i === 3) return 'Unité';
        if (i === 4) return 'Date d\'application';
        return `Colonne ${i + 1}`;
      });
      
      // Ne pas retirer la première ligne des données si elle n'est pas un en-tête
    } else {
      // Retirer la ligne d'en-tête des données
      tableData.shift();
    }
  }

  // Transformer les lignes de référence (après le tableau)
  const references = lines.filter(line => 
    !line.includes('|') && (line.includes('Avenant') || line.includes('Référence') || line.includes('Source') || line.startsWith('•') || line.startsWith('*'))
  );

  // Formatter les références comme une liste
  const formattedReferences = references.map(ref => {
    let formattedRef = ref;
    // Si la référence commence par "•" ou "*", la formatter comme un élément de liste
    if (ref.startsWith('•') || ref.startsWith('*')) {
      formattedRef = ref;
    } else if (ref.includes('Référence') || ref.includes('Source')) {
      formattedRef = `<strong>${ref}</strong>`;
    } else {
      formattedRef = `• ${ref}`;
    }
    return formattedRef;
  });

  return (
    <div className={`salary-grid-formatter ${className}`}>
      {/* Titre ou description avant le tableau (facultatif) */}
      {lines.length > 0 && !lines[0].includes('|') && (
        <h3 className="text-lg font-semibold mb-4">{lines[0]}</h3>
      )}
      
      {/* Tableau formaté */}
      <div className="overflow-x-auto my-6 rounded-md border border-border shadow-sm">
        <table className="w-full border-collapse table-auto text-left">
          <thead className="bg-muted/30">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="border border-border p-2 text-left font-semibold text-sm">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
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
                {/* Ajouter des cellules vides si la ligne a moins de cellules que les en-têtes */}
                {row.length < headers.length && (
                  Array(headers.length - row.length).fill(0).map((_, i) => (
                    <td key={`empty-${rowIndex}-${i}`} className="border border-border p-2 text-sm"></td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Références */}
      {formattedReferences.length > 0 && (
        <div className="mt-4">
          <strong className="text-sm">Références :</strong>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            {formattedReferences.map((ref, i) => (
              <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: ref }}></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}