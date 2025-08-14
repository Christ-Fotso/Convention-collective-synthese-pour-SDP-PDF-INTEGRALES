import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnhancedTableWrapper } from './enhanced-table-wrapper';

interface MarkdownTableRendererEnhancedProps {
  content: string;
  className?: string;
}

export const MarkdownTableRendererEnhanced: React.FC<MarkdownTableRendererEnhancedProps> = ({ content, className = '' }) => {
  // Prétraiter le contenu pour ajouter des espaces entre les tableaux
  const processedContent = content
    .replace(/\n<\/table>\n/g, "\n</table>\n\n<div style='height: 20px;'></div>\n\n");

  // Composants personnalisés pour ReactMarkdown
  const components = {
    // Envelopper chaque tableau dans notre composant amélioré
    table: ({ node, ...props }: any) => (
      <EnhancedTableWrapper>
        <table 
          {...props} 
          style={{ 
            width: '100%', 
            tableLayout: 'auto',
            borderCollapse: 'collapse', 
            borderSpacing: 0,
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '0.8rem',
            fontFamily: 'Inter, system-ui, sans-serif'
          }} 
        />
      </EnhancedTableWrapper>
    ),
    // Style des cellules pour améliorer la lisibilité
    td: ({ node, ...props }: any) => (
      <td 
        {...props} 
        style={{ 
          padding: '0.4rem 0.5rem', 
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e2e8f0',
          verticalAlign: 'top',
          lineHeight: '1.3',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          wordBreak: 'keep-all',
          hyphens: 'none',
          fontFamily: 'Inter, system-ui, sans-serif'
        }} 
      />
    ),
    // Style des en-têtes pour une meilleure lisibilité
    th: ({ node, ...props }: any) => (
      <th 
        {...props} 
        style={{ 
          padding: '0.4rem 0.5rem', 
          fontWeight: 'bold',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e2e8f0',
          verticalAlign: 'top',
          backgroundColor: '#f8fafc',
          lineHeight: '1.3',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          wordBreak: 'keep-all',
          hyphens: 'none',
          fontFamily: 'Inter, system-ui, sans-serif'
        }} 
      />
    )
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};