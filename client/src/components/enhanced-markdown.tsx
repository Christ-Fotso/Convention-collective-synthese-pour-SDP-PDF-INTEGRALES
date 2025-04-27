import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
}

export function EnhancedMarkdown({ content, className = '' }: EnhancedMarkdownProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-table:w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-md border shadow-sm">
              <table className="w-full border-collapse table-auto" {...props} />
            </div>
          ),
          thead: props => <thead className="bg-primary/10" {...props} />,
          th: props => <th className="border-b border-r last:border-r-0 border-border p-3 text-left font-semibold text-sm" {...props} />,
          td: props => <td className="border-b border-r last:border-r-0 border-border p-3 text-sm align-top whitespace-normal break-words" {...props} />,
          tr: props => <tr className="hover:bg-muted/30 even:bg-muted/10" {...props} />,
          h1: props => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: props => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: props => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: props => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
          h5: props => <h5 className="text-sm font-bold mt-2 mb-1" {...props} />,
          h6: props => <h6 className="text-xs font-bold mt-2 mb-1" {...props} />,
          a: props => <a className="text-primary hover:underline" {...props} />,
          strong: props => <strong className="font-bold" {...props} />,
          p: props => <p className="my-2" {...props} />,
          ul: props => <ul className="list-disc pl-6 my-2" {...props} />,
          ol: props => <ol className="list-decimal pl-6 my-2" {...props} />,
          li: props => <li className="mb-1" {...props} />,
          blockquote: props => <blockquote className="border-l-4 border-primary/20 pl-4 py-2 italic" {...props} />,
          hr: props => <hr className="my-4 border-muted" {...props} />,
          code: (props) => {
            // Déterminer si c'est un bloc de code ou code inline
            const codeContent = String(props.children).replace(/\n$/, '');
            // Si le contenu contient des sauts de ligne, c'est un bloc de code
            const isCodeBlock = /\n/.test(codeContent) || props.className;
            
            return isCodeBlock ? (
              <code className={props.className} {...props} />
            ) : (
              <code className="bg-muted/50 px-1 py-0.5 rounded text-xs" {...props} />
            );
          },
          pre: (props) => (
            <pre className="bg-muted/20 p-4 rounded-md overflow-x-auto" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}