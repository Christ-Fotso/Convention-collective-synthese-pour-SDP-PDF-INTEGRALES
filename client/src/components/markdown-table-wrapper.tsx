import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTableWrapperProps {
  content: string;
  className?: string;
}

export const MarkdownTableWrapper: React.FC<MarkdownTableWrapperProps> = ({ content, className = '' }) => {
  // Prétraiter le contenu pour ajouter des espaces entre les tableaux
  const processedContent = content
    .replace(/\n<\/table>\n/g, "\n</table>\n\n<div style='height: 20px;'></div>\n\n");

  // Composants personnalisés pour ReactMarkdown
  const components = {
    // Style global du conteneur
    div: ({ node, className, ...props }: any) => {
      if (className === 'table-container') {
        return (
          <div 
            className={className} 
            style={{ 
              overflowX: 'auto', 
              maxWidth: '100%', 
              marginBottom: '1.5rem',
              paddingBottom: '0.5rem',
              display: 'block',
              clear: 'both'
            }} 
            {...props} 
          />
        );
      }
      return <div {...props} />;
    },
    // Envelopper chaque tableau dans un conteneur scrollable
    table: ({ node, ...props }: any) => (
      <div className="table-container">
        <table 
          {...props} 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            borderSpacing: 0,
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '0.7rem'
          }} 
        />
      </div>
    ),
    // Réduire la taille du texte dans les cellules
    td: ({ node, ...props }: any) => (
      <td 
        {...props} 
        style={{ 
          fontSize: '0.7rem', 
          padding: '0.25rem 0.5rem', 
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#eee'
        }} 
      />
    ),
    // Réduire la taille du texte dans les en-têtes
    th: ({ node, ...props }: any) => (
      <th 
        {...props} 
        style={{ 
          fontSize: '0.7rem', 
          padding: '0.25rem 0.5rem', 
          fontWeight: 'bold',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#eee'
        }} 
      />
    ),
    // Réduire la taille du texte des paragraphes
    p: ({ node, ...props }: any) => (
      <p 
        {...props} 
        style={{ 
          fontSize: '0.8rem', 
          marginTop: '0.5rem', 
          marginBottom: '0.5rem',
          lineHeight: '1.2'
        }} 
      />
    ),
    // Réduire la taille des titres
    h1: ({ node, ...props }: any) => (
      <h1 
        {...props} 
        style={{ 
          fontSize: '1rem', 
          marginTop: '1rem', 
          marginBottom: '0.5rem',
          fontWeight: 'bold'
        }} 
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 
        {...props} 
        style={{ 
          fontSize: '0.9rem', 
          marginTop: '1rem', 
          marginBottom: '0.5rem',
          fontWeight: 'bold'
        }} 
      />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 
        {...props} 
        style={{ 
          fontSize: '0.85rem', 
          marginTop: '0.75rem', 
          marginBottom: '0.5rem',
          fontWeight: 'bold' 
        }} 
      />
    )
  };

  return (
    <div 
      className={`markdown-content ${className}`} 
      style={{ 
        fontSize: '0.8rem', 
        overflowX: 'auto',
        maxWidth: '100%',
        display: 'block'
      }}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};