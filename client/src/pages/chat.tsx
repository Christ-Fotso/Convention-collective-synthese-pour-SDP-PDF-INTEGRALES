import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader, MessageCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CategoryMenu } from '@/components/category-menu';
import { LegalComparison } from '@/components/legal-comparison';
import { ChatInterface } from '@/components/chat-interface';
import { getConventions, createChatPDFSource, sendChatMessage } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import type { Convention, Message, Category, Subcategory } from '@/types';
import { PREDEFINED_PROMPTS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { convertJsonToMarkdown } from '@/lib/markdown-converter';

interface ChatMessageParams {
  sourceId: string;
  messages: Message[];
  category: string;
  subcategory?: string;
  conventionId: string;
}

export default function Chat({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  const { data: conventions, isLoading: isLoadingConventions } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  const convention = conventions?.find(c => c.id === params.id);

  const createSourceMutation = useMutation({
    mutationFn: createChatPDFSource,
    onSuccess: (newSourceId) => {
      setSourceId(newSourceId);
      setMessages([]);
      setChatMessages([]);
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

  useEffect(() => {
    if (convention) {
      createSourceMutation.mutate(convention.url);
    }
  }, [convention]);

  const handleSelectSubcategory = async (category: Category, subcategory: Subcategory) => {
    if (!sourceId || !convention) return;

    setCurrentCategory(category);
    setCurrentSubcategory(subcategory);

    const isUnavailable = (category.id === 'remuneration' && subcategory.id === 'grille') ||
                         (category.id === 'classification' && subcategory.id === 'classification-details');

    if (isUnavailable) {
      setMessages([
        { role: 'user', content: `${category.name} > ${subcategory.name}` },
        { 
          role: 'assistant', 
          content: `⚠️ Cette information n'est pas disponible pour le moment.\n\nNotre équipe travaille à l'intégration de ces données pour vous fournir une analyse complète prochainement.`
        }
      ]);
      return;
    }

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

    setMessages([
      { role: 'user', content: `${category.name} > ${subcategory.name}` },
      { role: 'assistant', content: '' }
    ]);

    const chatParams: ChatMessageParams = {
      sourceId,
      messages: [{ role: 'user', content: prompt }],
      category: category.id,
      subcategory: subcategory.id,
      conventionId: convention.id
    };

    try {
      const response = await chatMutation.mutateAsync(chatParams);
      if (!response.content) {
        setMessages([]);
        return;
      }
      const formattedContent = convertJsonToMarkdown(response.content);
      setMessages([
        { role: 'user', content: `${category.name} > ${subcategory.name}` },
        { role: 'assistant', content: formattedContent }
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des informations",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sourceId || !convention) return;

    const newMessage: Message = { role: 'user', content };
    setChatMessages(prev => [...prev, newMessage]);

    const chatParams: ChatMessageParams = {
      sourceId,
      messages: [...chatMessages, newMessage],
      category: 'chat',
      conventionId: convention.id
    };

    const response = await chatMutation.mutateAsync(chatParams);
    setChatMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
  };

  const handleResetChat = () => {
    setChatMessages([]);
  };

  if (isLoadingConventions || createSourceMutation.isPending) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

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

  const shouldShowComparison = !(
    (currentCategory?.id === 'remuneration' && currentSubcategory?.id === 'grille') ||
    (currentCategory?.id === 'classification' && currentSubcategory?.id === 'classification-details')
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg shadow-sm dark:bg-orange-900/10 dark:border-orange-900/20">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Cette fonctionnalité est en version bêta. Certaines informations peuvent être incomplètes pendant que nous entraînons notre IA pour améliorer la qualité des réponses.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-8 bg-muted/50 p-4 rounded-lg shadow-sm">
        <Button variant="outline" onClick={() => navigate('/')} className="hover:bg-background">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <h1 className="text-2xl font-bold">
          IDCC {convention?.id} - {convention?.name}
        </h1>
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogTrigger asChild>
            <Button 
              className="ml-auto bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Poser une question sur la CCN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Chat avec la convention collective</DialogTitle>
            </DialogHeader>
            <div className="flex-1 mt-4 overflow-auto">
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onReset={handleResetChat}
                isLoading={chatMutation.isPending}
                error={chatMutation.error ? "Une erreur est survenue lors de la communication avec l'IA" : null}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:min-w-[300px] md:max-w-[400px]">
          <CategoryMenu 
            categories={CATEGORIES}
            onSelectSubcategory={handleSelectSubcategory}
            isLoading={chatMutation.isPending}
          />
        </div>

        <div className="flex-1">
          <Card className="p-6">
            {chatMutation.isPending ? (
              <div className="space-y-6">
                <Skeleton className="h-6 w-1/3" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="flex items-center justify-center mt-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Traitement en cours, veuillez patienter...</p>
                  </div>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">{messages[0].content}</h3>
                <div className="mt-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-border" {...props} />
                        </div>
                      ),
                      thead: props => <thead className="bg-muted" {...props} />,
                      th: props => <th className="border border-border p-2 text-left" {...props} />,
                      td: props => <td className="border border-border p-2" {...props} />
                    }}
                  >
                    {messages[1].content}
                  </ReactMarkdown>
                </div>
                {shouldShowComparison && currentCategory && currentSubcategory && (
                  <LegalComparison 
                    category={currentCategory} 
                    subcategory={currentSubcategory} 
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Sélectionnez une catégorie pour voir les informations correspondantes
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}