import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CategoryMenu } from '@/components/category-menu';
import { LegalComparison } from '@/components/legal-comparison';
import { ChatInterface } from '@/components/chat-interface';
import { getConventions, createChatPDFSource, sendChatMessage, type CreateSourceParams } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import type { Convention, Message, Category, Subcategory } from '@/types';
import { PREDEFINED_PROMPTS, SYSTEM_PROMPT } from '@/types';
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
import { LoadingAnimation } from '@/components/loading-animation';

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
    onMutate: () => {
      // Afficher un indicateur de chargement plus visible
      toast({
        title: "Chargement en cours",
        description: "Préparation de la convention collective...",
        duration: 0 // Le toast restera jusqu'à ce que l'opération soit terminée
      });
    },
    onSuccess: (newSourceId) => {
      setSourceId(newSourceId);
      setMessages([]);
      setChatMessages([]);
      toast({
        title: "Convention chargée",
        description: "Vous pouvez maintenant explorer les différentes sections.",
        duration: 3000
      });
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
    onMutate: (variables) => {
      const newMessage: Message = { role: 'user', content: variables.messages[variables.messages.length - 1].content };
      setChatMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      setChatMessages(prev => prev.slice(0, -1));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
      });
    },
    onSuccess: (response) => {
      if (!response || !response.content) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La réponse est invalide. Veuillez réessayer.",
        });
        return;
      }
      const assistantMessage: Message = { role: 'assistant', content: response.content };
      setChatMessages(prev => [...prev, assistantMessage]);
    }
  });

  useEffect(() => {
    if (convention) {
      createSourceMutation.mutate({ url: convention.url, conventionId: convention.id });
    }
  }, [convention]);

  const handleSelectSubcategory = async (category: Category, subcategory: Subcategory) => {
    if (!sourceId || !convention) return;

    setCurrentCategory(category);
    setCurrentSubcategory(subcategory);

    // Plus de traitement spécial pour la grille salariale, on utilise l'API
    // Tout le traitement est géré côté serveur

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
      
      // Cas où la réponse n'a pas de contenu
      if (!response || !response.content) {
        setMessages([]);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La réponse est invalide. Veuillez réessayer.",
        });
        return;
      }
      
      // Cas où la requête est en cours de traitement (code 202)
      if (response.inProgress) {
        console.log("Traitement en cours, affichage du message d'attente...");
        setMessages([
          { role: 'user', content: `${category.name} > ${subcategory.name}` },
          { role: 'assistant', content: response.content }
        ]);
        
        // On pourrait mettre en place une logique de polling ici pour réessayer
        // la requête après quelques secondes...
        return;
      }
      
      // Cas où la requête a réussi
      // Application des améliorations de formatage : 
      // 1. Convertir en Markdown si c'est du JSON
      // 2. Supprimer les introductions superflues
      // 3. Améliorer le formatage Markdown
      let formattedContent = convertJsonToMarkdown(response.content);
      
      // Pour les sections comme classification ou grille salariale, le formatage est crucial
      const isImportantSection = 
        (category.id === 'classification' && subcategory.id === 'classification') ||
        (category.id === 'remuneration' && subcategory.id === 'grille');
      
      console.log(`Mise en forme de la réponse pour: ${category.id} > ${subcategory.id}, formatage avancé: ${isImportantSection}`);
      
      setMessages([
        { role: 'user', content: `${category.name} > ${subcategory.name}` },
        { role: 'assistant', content: formattedContent }
      ]);
    } catch (error) {
      console.error("Erreur lors de la requête:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des informations",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sourceId || !convention) return;

    const chatParams: ChatMessageParams = {
      sourceId,
      messages: [...chatMessages, { role: 'user', content }],
      category: 'chat',
      conventionId: convention.id
    };

    try {
      await chatMutation.mutateAsync(chatParams);
    } catch (error) {
      console.error('Chat error:', error);
    }
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

  const shouldShowComparison = !(currentCategory?.id === 'remuneration' && currentSubcategory?.id === 'grille');

  return (
    <div className="container mx-auto py-8 px-4">
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
              <div className="py-12">
                <LoadingAnimation 
                  message="Analyse juridique en cours..." 
                  subMessage="Extraction des dispositions de la convention collective" 
                />
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