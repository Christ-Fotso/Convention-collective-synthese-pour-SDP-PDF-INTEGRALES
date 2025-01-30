import { useState } from 'react';
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

  return (
    <Card className={`shadow-md ${isLoading ? 'opacity-50' : ''}`}>
      <div className="p-4 border-b bg-secondary">
        <h2 className="text-lg font-semibold">Catégories</h2>
      </div>
      <ScrollArea className="h-[600px]">
        <div className="p-4">
          <Accordion type="multiple" value={expandedCategories}>
            {categories.map(category => (
              <AccordionItem 
                key={category.id} 
                value={category.id}
                className="border rounded-md mb-2 overflow-hidden"
              >
                <AccordionTrigger 
                  onClick={() => toggleCategory(category.id)}
                  className="hover:no-underline px-4 py-2 bg-accent hover:bg-muted"
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
                        className="justify-start h-auto py-2 px-4 text-sm font-normal hover:bg-primary hover:text-primary-foreground"
                        onClick={() => onSelectSubcategory(category, subcategory)}
                        disabled={isLoading}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        {subcategory.name}
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