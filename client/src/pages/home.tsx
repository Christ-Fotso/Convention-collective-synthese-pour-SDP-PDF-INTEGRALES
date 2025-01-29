import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ConventionSelect } from '@/components/convention-select';
import { ChatInterface } from '@/components/chat-interface';
import { getConventions, createChatPDFSource, sendChatMessage, deleteChatPDFSource } from '@/lib/api';
import type { Convention, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const { data: conventions = [] } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

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

  const handleConventionSelect = async (convention: Convention) => {
    if (sourceId) {
      await deleteSourceMutation.mutateAsync(sourceId);
    }
    setSelectedConvention(convention);
    createSourceMutation.mutate(convention.url);
  };

  const handleSendMessage = async (content: string) => {
    if (!sourceId) return;

    const newUserMessage: Message = { role: 'user', content };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);

    const response = await chatMutation.mutateAsync({
      sourceId,
      messages: newMessages,
      referenceSources: true
    });

    const assistantMessage: Message = { role: 'assistant', content: response.content };
    setMessages([...newMessages, assistantMessage]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Assistant Conventions Collectives
      </h1>

      <div className="mb-8">
        <ConventionSelect
          conventions={conventions}
          selectedConvention={selectedConvention}
          onSelect={handleConventionSelect}
        />
      </div>

      {selectedConvention && (
        <div className="mt-8">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            error={chatMutation.error?.message}
          />
        </div>
      )}
    </div>
  );
}