import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MarkdownTableRendererProps {
  content: string;
}

function extractTables(markdown: string): { tables: string[], textParts: string[] } {
  // Une approche plus simple : diviser le texte en lignes et chercher les sections de table
  const lines = markdown.split('\n');
  const tableRanges: {start: number, end: number}[] = [];
  
  let inTable = false;
  let tableStartIndex = -1;
  let tableStartPos = 0;
  let currentPos = 0;
  
  // Parcourir toutes les lignes et détecter les lignes qui ressemblent à des tables Markdown
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1; // +1 pour le caractère de nouvelle ligne
    
    // Vérifier si c'est une ligne de table (commence et finit par | avec au moins un | à l'intérieur)
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);
    
    if (isTableRow && !inTable) {
      // Début d'un nouveau tableau
      inTable = true;
      tableStartIndex = i;
      tableStartPos = currentPos;
    } else if (!isTableRow && inTable) {
      // Fin d'un tableau
      inTable = false;
      tableRanges.push({ 
        start: tableStartPos, 
        end: currentPos
      });
    }
    
    currentPos += lineLength;
  }
  
  // Ne pas oublier le dernier tableau s'il va jusqu'à la fin du texte
  if (inTable) {
    tableRanges.push({ 
      start: tableStartPos, 
      end: currentPos
    });
  }
  
  // Extraire les tableaux et le texte entre eux
  const tables: string[] = [];
  const textParts: string[] = [];
  
  let lastEnd = 0;
  for (const range of tableRanges) {
    // Ajouter le texte avant ce tableau
    if (range.start > lastEnd) {
      textParts.push(markdown.substring(lastEnd, range.start));
    }
    
    // Ajouter le tableau
    tables.push(markdown.substring(range.start, range.end));
    lastEnd = range.end;
  }
  
  // Ajouter le reste du texte après le dernier tableau
  if (lastEnd < markdown.length) {
    textParts.push(markdown.substring(lastEnd));
  }
  
  return { tables, textParts };
}

function formatTable(table: string): string {
  // S'assurer que les séparateurs de colonnes sont correctement formatés
  const lines = table.split('\n').filter(line => line.trim() !== '');
  
  // Vérifier si nous avons une ligne d'en-tête et une ligne de séparation
  if (lines.length < 2) return table;
  
  // Normaliser la largeur des colonnes
  const headerCells = lines[0].split('|').filter(cell => cell.trim() !== '');
  const numCols = headerCells.length;
  
  // Vérifier si la deuxième ligne est une ligne de séparation
  const secondLine = lines[1];
  if (!secondLine.includes('---')) {
    // Insérer une ligne de séparation
    const separatorLine = '| ' + headerCells.map(() => '--- |').join(' ');
    lines.splice(1, 0, separatorLine);
  }
  
  return lines.join('\n');
}

export function MarkdownTableRenderer({ content }: MarkdownTableRendererProps) {
  const { tables, textParts, combinedContent } = useMemo(() => {
    const extracted = extractTables(content);
    const formattedTables = extracted.tables.map(formatTable);
    
    // Recombiner le contenu pour le rendu
    let combined = '';
    const maxLength = Math.max(formattedTables.length, extracted.textParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < extracted.textParts.length) {
        combined += extracted.textParts[i];
      }
      if (i < formattedTables.length) {
        combined += '\n\n' + formattedTables[i] + '\n\n';
      }
    }
    
    return {
      tables: formattedTables,
      textParts: extracted.textParts,
      combinedContent: combined
    };
  }, [content]);
  
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-auto rounded-md border">
              <table className="w-full border-collapse bg-white text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 text-left text-gray-600" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-medium" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3" {...props} />
          )
        }}
      >
        {combinedContent}
      </ReactMarkdown>
    </div>
  );
}