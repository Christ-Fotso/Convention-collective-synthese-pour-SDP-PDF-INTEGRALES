import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChatInterface } from '@/components/chat-interface';
import { getConventions, createChatPDFSource, sendChatMessage, deleteChatPDFSource } from '@/lib/api';
import type { Convention, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: conventions = [] } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  const filteredConventions = conventions.filter(
    conv => 
      conv.id.toLowerCase().includes(search.toLowerCase()) ||
      conv.name.toLowerCase().includes(search.toLowerCase())
  );

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
      referenceSources: false
    });

    const assistantMessage: Message = { role: 'assistant', content: response.content };
    setMessages([...newMessages, assistantMessage]);
  };

  const handleReset = async () => {
    if (sourceId) {
      await deleteSourceMutation.mutateAsync(sourceId);
    }
    if (selectedConvention) {
      createSourceMutation.mutate(selectedConvention.url);
    }
    setMessages([]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Assistant Conventions Collectives
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Rechercher une convention</h2>
            </div>

            <Command className="rounded-lg border shadow-md">
              <CommandInput 
                placeholder="Rechercher par IDCC ou nom..." 
                value={search}
                onValueChange={setSearch}
              />

              <ScrollArea className="h-[500px]">
                <CommandEmpty>Aucune convention trouvée.</CommandEmpty>
                <CommandGroup>
                  {filteredConventions.map((convention) => (
                    <CommandItem
                      key={convention.id}
                      onSelect={() => handleConventionSelect(convention)}
                      className="cursor-pointer hover:bg-muted"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">
                          IDCC {convention.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {convention.name}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </Card>
        </div>

        <div>
          {selectedConvention ? (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">
                  Convention sélectionnée
                </h2>
                <p className="text-muted-foreground">
                  IDCC {selectedConvention.id} - {selectedConvention.name}
                </p>
              </div>

              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onReset={handleReset}
                isLoading={chatMutation.isPending}
                error={chatMutation.error?.message}
              />
            </div>
          ) : (
            <Card className="p-6 flex items-center justify-center h-[200px] text-muted-foreground">
              Sélectionnez une convention pour commencer la conversation
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}