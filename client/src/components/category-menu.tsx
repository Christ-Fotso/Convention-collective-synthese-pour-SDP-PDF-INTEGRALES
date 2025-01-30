import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { type Category, type Subcategory } from '@/types';
import { Button } from '@/components/ui/button';
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
}

export function CategoryMenu({ categories, onSelectSubcategory }: CategoryMenuProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Catégories</h2>
      <ScrollArea className="h-[600px] pr-4">
        <Accordion type="multiple" value={expandedCategories}>
          {categories.map(category => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger 
                onClick={() => toggleCategory(category.id)}
                className="hover:no-underline"
              >
                <span className="text-base font-medium">{category.name}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 pl-4">
                  {category.subcategories.map(subcategory => (
                    <Button
                      key={subcategory.id}
                      variant="ghost"
                      className="justify-start h-auto py-2 px-4 text-sm font-normal"
                      onClick={() => onSelectSubcategory(category, subcategory)}
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
      </ScrollArea>
    </Card>
  );
}
