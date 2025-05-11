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
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table {...props} style={{ minWidth: '100%' }} />
      </div>
    ),
    // Réduire la taille du texte dans les cellules
    td: ({ node, ...props }: any) => (
      <td {...props} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} />
    ),
    // Réduire la taille du texte dans les en-têtes
    th: ({ node, ...props }: any) => (
      <th {...props} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', fontWeight: 'bold' }} />
    )
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};