import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTableWrapperProps {
  content: string;
  className?: string;
}

export const MarkdownTableWrapper: React.FC<MarkdownTableWrapperProps> = ({ content, className = '' }) => {
  // Composants personnalisés pour ReactMarkdown
  const components = {
    // Envelopper chaque tableau dans un conteneur scrollable
    table: ({ node, ...props }: any) => (
      <div className="table-container mb-4" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table {...props} style={{ minWidth: '100%', borderCollapse: 'separate' }} />
      </div>
    ),
    // Réduire la taille du texte dans les cellules
    td: ({ node, ...props }: any) => (
      <td {...props} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} />
    ),
    // Réduire la taille du texte dans les en-têtes
    th: ({ node, ...props }: any) => (
      <th {...props} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontWeight: 'bold' }} />
    ),
    // Réduire la taille du texte des paragraphes
    p: ({ node, ...props }: any) => (
      <p {...props} style={{ fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '0.5rem' }} />
    ),
    // Réduire la taille des titres
    h1: ({ node, ...props }: any) => (
      <h1 {...props} style={{ fontSize: '1.2rem', marginTop: '1rem', marginBottom: '0.5rem' }} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 {...props} style={{ fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem' }} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 {...props} style={{ fontSize: '1rem', marginTop: '0.75rem', marginBottom: '0.5rem' }} />
    )
  };

  return (
    <div className={`markdown-content ${className}`} style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};