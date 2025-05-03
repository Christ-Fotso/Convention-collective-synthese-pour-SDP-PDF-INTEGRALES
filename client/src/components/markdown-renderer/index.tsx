import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Prétraitement du contenu pour corriger les problèmes potentiels avec les tableaux
  let processedContent = content;
  
  // S'assurer que les tables ont suffisamment d'espace autour d'elles
  processedContent = processedContent.replace(/([^\n])\n(\|)/g, '$1\n\n$2');
  processedContent = processedContent.replace(/(\|[^\n]*)\n([^\|])/g, '$1\n\n$2');
  
  // Si le contenu contient des tableaux mais aucun ne semble avoir d'en-tête,
  // essayons d'ajouter une ligne de séparation
  if (processedContent.includes('|') && !processedContent.includes('|-')) {
    processedContent = processedContent.replace(/(\|[^\n]*\|)\n(?!\|---)/g, '$1\n|---|---|\n');
  }

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert markdown-content ${className}`}>
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
          
          // Titres avec espacement approprié
          h1: props => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: props => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: props => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: props => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
          h5: props => <h5 className="text-sm font-bold mt-2 mb-1" {...props} />,
          h6: props => <h6 className="text-xs font-bold mt-2 mb-1" {...props} />,
          
          // Liens et texte mis en forme
          a: props => <a className="text-primary hover:underline font-medium" {...props} />,
          strong: props => <strong className="font-bold" {...props} />,
          
          // Paragraphes avec traitement spécial pour les données structurées
          p: ({ children }) => {
            if (typeof children === 'string') {
              // Traiter les textes avec des barres verticales comme des éléments structurés
              if (children.includes(' | ') && !children.startsWith('|')) {
                const parts = children.split(' | ').filter(part => part.trim());
                return (
                  <div className="mb-3">
                    {parts.map((part, index) => (
                      <p key={index} className="py-1 pl-2 border-l-2 border-primary/30 mb-2">
                        {part.trim()}
                      </p>
                    ))}
                  </div>
                );
              }
            }
            // Paragraphe normal
            return <p className="my-2 leading-relaxed">{children}</p>;
          },
          
          // Listes et éléments divers
          ul: props => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
          ol: props => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
          li: props => <li className="mb-1" {...props} />,
          blockquote: props => <blockquote className="border-l-4 border-primary/20 pl-4 py-2 italic bg-muted/10 rounded-r" {...props} />,
          hr: props => <hr className="my-6 border-t border-border" {...props} />,
          
          // Code avec détection de blocs vs inline
          code: (props) => {
            const codeContent = String(props.children).replace(/\n$/, '');
            const isCodeBlock = /\n/.test(codeContent) || props.className;
            
            return isCodeBlock ? (
              <code className={`${props.className} block rounded-md p-1 text-xs`} {...props} />
            ) : (
              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
            );
          },
          pre: (props) => (
            <pre className="bg-muted/30 p-4 rounded-md overflow-x-auto border border-border my-4" {...props} />
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}