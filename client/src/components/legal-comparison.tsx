import { type Category, type Subcategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface LegalComparisonProps {
  category: Category;
  subcategory: Subcategory;
}

export function LegalComparison({ category, subcategory }: LegalComparisonProps) {
  // Nous n'utilisons plus de comparaisons légales prédéfinies
  return null;
}