import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CategoryMenu } from '@/components/category-menu';
import { getConventions, createChatPDFSource, sendChatMessage, deleteChatPDFSource } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import type { Convention, Message, Category, Subcategory } from '@/types';
import { PREDEFINED_PROMPTS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Chat({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const { data: conventions = [] } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  const convention = conventions.find(c => c.id === params.id);

  const createSourceMutation = useMutation({
    mutationFn: createChatPDFSource,
    onSuccess: (newSourceId) => {
      setSourceId(newSourceId);
      setMessages([]);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le document PDF",
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'obtenir la réponse",
      });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: deleteChatPDFSource
  });

  useEffect(() => {
    if (convention) {
      createSourceMutation.mutate(convention.url);
    }
  }, [convention]);

  const handleSelectSubcategory = async (category: Category, subcategory: Subcategory) => {
    if (!sourceId) return;

    const prompt = PREDEFINED_PROMPTS[category.id]?.[subcategory.id] || 
                  PREDEFINED_PROMPTS[category.id]?.['default'];

    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Question prédéfinie non trouvée pour cette catégorie",
      });
      return;
    }

    const response = await chatMutation.mutateAsync({
      sourceId,
      messages: [{ role: 'user', content: prompt }],
      referenceSources: false
    });

    setMessages([
      { role: 'user', content: `${category.name} > ${subcategory.name}` },
      { role: 'assistant', content: response.content }
    ]);
  };

  if (!convention) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Convention non trouvée</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <h1 className="text-2xl font-bold">
          IDCC {convention.id} - {convention.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
        <CategoryMenu 
          categories={CATEGORIES}
          onSelectSubcategory={handleSelectSubcategory}
        />

        <Card className="p-6">
          {messages.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{messages[0].content}</h3>
                <div className="mt-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>
                    {messages[1].content.replace(/\n/g, '\n\n')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Sélectionnez une catégorie pour voir les informations correspondantes
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}