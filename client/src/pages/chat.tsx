/**
 * Page de chat avec l'assistant IA pour les conventions collectives
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Send,
  Loader2,
  ChevronDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { generateConventionResponse } from '@/lib/gemini-service';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Convention {
  id: string;
  name: string;
}

// Styles pour les messages
const userMessageStyle = "bg-primary/10 p-3 rounded-lg self-end max-w-[80%] mb-2";
const aiMessageStyle = "bg-muted p-3 rounded-lg self-start max-w-[80%] mb-2";
const loadingDotsStyle = "flex space-x-1 mt-1 items-center self-start max-w-[80%] mb-2 ml-2";

export function ChatPage() {
  const [location, setLocation] = useLocation();
  const [selectedConvention, setSelectedConvention] = useState<string>('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Récupérer l'ID de la convention depuis les paramètres de l'URL
  const params = useParams<{ id: string }>();
  
  useEffect(() => {
    // Si l'ID est disponible dans les paramètres, utilisons-le
    if (params.id) {
      setSelectedConvention(params.id);
      console.log("ID de convention récupéré:", params.id);
    }
  }, [params.id]);

  // Récupération de la liste des conventions
  const { data: conventions, isLoading: isLoadingConventions } = useQuery<Convention[]>({
    queryKey: ['conventions'],
    queryFn: async () => {
      const response = await axios.get('/api/conventions');
      return response.data;
    }
  });

  // Mutation pour envoyer une question à l'IA
  const chatMutation = useMutation({
    mutationFn: async ({ conventionId, query }: { conventionId: string; query: string }) => {
      return await generateConventionResponse(conventionId, query);
    },
    onSuccess: (data) => {
      // Ajouter la réponse de l'IA aux messages
      setMessages(prev => [
        ...prev,
        {
          content: data.answer,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      
      // Ajouter un message d'erreur dans la conversation
      setMessages(prev => [
        ...prev,
        {
          content: "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer plus tard.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  });

  // Scroll automatique vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ajout d'un message de bienvenue initial
  useEffect(() => {
    if (selectedConvention && conventions) {
      const convention = conventions.find(c => c.id === selectedConvention);
      if (convention) {
        const welcomeMessage = `Bonjour ! Je suis votre assistant IA spécialisé dans la convention collective "${convention.name}" (IDCC: ${selectedConvention}). Comment puis-je vous aider aujourd'hui ?`;
        
        // Ne pas ajouter le message si la liste contient déjà des messages
        if (messages.length === 0) {
          setMessages([
            {
              content: welcomeMessage,
              isUser: false,
              timestamp: new Date()
            }
          ]);
        }
      }
    }
  }, [selectedConvention, conventions]);

  const handleSendMessage = () => {
    if (!input.trim() || !selectedConvention) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage = {
      content: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Envoyer la question à l'IA
    chatMutation.mutate({
      conventionId: selectedConvention,
      query: input
    });
    
    // Réinitialiser l'input
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation('/')} 
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Assistant IA - Conventions Collectives</h1>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Chat avec l'IA</CardTitle>
          <CardDescription>
            Posez des questions sur votre convention collective et obtenez des réponses précises.
          </CardDescription>
          
          <div className="mt-4">
            {conventions && selectedConvention && (
              <div className="text-sm bg-muted p-3 rounded-md">
                <span className="font-medium">Convention sélectionnée : </span>
                {conventions.find(c => c.id === selectedConvention)?.name} (IDCC: {selectedConvention})
              </div>
            )}
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-4">
          <div className="flex flex-col h-[60vh] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex flex-col">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={message.isUser ? userMessageStyle : aiMessageStyle}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      className="prose prose-sm max-w-none"
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className={loadingDotsStyle}>
                    <span className="text-sm text-muted-foreground">L'IA réfléchit</span>
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="p-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!input.trim() || chatMutation.isPending}
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t p-4 text-xs text-muted-foreground">
          <p>
            Cet assistant utilise Google Gemini 1.5 Pro pour analyser les conventions collectives.
            Les réponses se basent uniquement sur le contenu de la convention sélectionnée.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ChatPage;