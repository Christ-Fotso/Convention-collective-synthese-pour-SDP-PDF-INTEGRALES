import React from 'react';
import { MarkdownTableRenderer } from './markdown-table-renderer';

interface AdvancedTableRendererProps {
  content: string;
  className?: string;
}

/**
 * Composant wrapper qui utilise MarkdownTableRenderer pour le rendu des tableaux Markdown
 * Conservé pour rétrocompatibilité avec le code existant
 */
export function AdvancedTableRenderer({ content, className = '' }: AdvancedTableRendererProps) {
  return (
    <div className={`advanced-table-renderer ${className}`}>
      <MarkdownTableRenderer content={content} />
    </div>
  );
}