import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat-interface';
import { getConventions, createChatPDFSource, sendChatMessage, deleteChatPDFSource } from '@/lib/api';
import type { Convention, Message } from '@/types';
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
        description: "Impossible d'envoyer le message",
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

  const handleSendMessage = async (content: string) => {
    if (!sourceId) return;

    const newUserMessage: Message = { role: 'user', content };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);

    const response = await chatMutation.mutateAsync({
      sourceId,
      messages: newMessages,
      referenceSources: false
    });

    const assistantMessage: Message = { role: 'assistant', content: response.content };
    setMessages([...newMessages, assistantMessage]);
  };

  const handleReset = async () => {
    if (sourceId) {
      await deleteSourceMutation.mutateAsync(sourceId);
    }
    if (convention) {
      createSourceMutation.mutate(convention.url);
    }
    setMessages([]);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          <h1 className="text-2xl font-bold">
            IDCC {convention.id} - {convention.name}
          </h1>
        </div>

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onReset={handleReset}
          isLoading={chatMutation.isPending}
          error={chatMutation.error?.message}
        />
      </div>
    </div>
  );
}
