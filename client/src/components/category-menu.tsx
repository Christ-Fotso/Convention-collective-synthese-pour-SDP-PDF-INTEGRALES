import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { type Category, type Subcategory } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface CategoryMenuProps {
  categories: Category[];
  onSelectSubcategory: (category: Category, subcategory: Subcategory) => void;
  isLoading?: boolean;
}

export function CategoryMenu({ categories, onSelectSubcategory, isLoading }: CategoryMenuProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    if (isLoading) return;
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Mémoiser le tri des catégories
  const sortedCategories = useMemo(() => {
    const priorityOrder = ['informations-generales', 'embauche', 'maintien-salaire', 'depart'];
    return [...categories].sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.id);
      const bIndex = priorityOrder.indexOf(b.id);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [categories]);

  return (
    <Card className={`shadow-md ${isLoading ? 'opacity-50' : ''}`}>
      <div className="p-4 border-b bg-primary/10">
        <h2 className="text-lg font-semibold">Catégories</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4">
          <Accordion 
            type="multiple" 
            value={expandedCategories}
            className="space-y-2"
          >
            {sortedCategories.map(category => (
              <AccordionItem 
                key={category.id} 
                value={category.id}
                className="border rounded-md overflow-hidden"
              >
                <AccordionTrigger 
                  onClick={() => toggleCategory(category.id)}
                  className="hover:no-underline px-4 py-2 bg-primary/5 hover:bg-primary/10"
                  disabled={isLoading}
                >
                  <span className="text-base font-medium">{category.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-1 p-2">
                    {category.subcategories.map(subcategory => (
                      <Button
                        key={subcategory.id}
                        variant="ghost"
                        className="justify-start h-auto py-2 px-4 text-sm font-normal hover:bg-primary/10 hover:text-primary whitespace-normal text-left"
                        onClick={() => onSelectSubcategory(category, subcategory)}
                        disabled={isLoading}
                      >
                        <ChevronRight className="h-4 w-4 mr-2 shrink-0" />
                        <span className="line-clamp-2">{subcategory.name}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </Card>
  );
}