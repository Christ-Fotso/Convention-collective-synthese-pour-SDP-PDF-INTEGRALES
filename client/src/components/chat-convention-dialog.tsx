import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, RotateCcw, Loader2, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";

interface ChatConventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conventionId: string;
  conventionName: string;
}

// Interface pour les messages du chat
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export function ChatConventionDialog({
  open,
  onOpenChange,
  conventionId,
  conventionName,
}: ChatConventionDialogProps) {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Limiter le nombre de messages à 23 maximum (comme demandé)
  const MAX_MESSAGES = 23;

  // Effet pour faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Effet pour mettre le focus sur le champ de texte quand le dialogue s'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Générer un ID unique pour chaque message
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSubmit = async () => {
    if (!currentQuestion.trim()) return;
    
    const userMessage: ChatMessage = {
      id: generateId(),
      content: currentQuestion.trim(),
      role: "user",
      timestamp: new Date()
    };
    
    // Ajouter le message de l'utilisateur à la liste
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentQuestion("");
    setIsLoading(true);
    setError("");
    
    try {
      const { data } = await axios.post(`/api/convention/${conventionId}/ask`, {
        question: userMessage.content
      });
      
      // Ajouter la réponse du système
      const botMessage: ChatMessage = {
        id: generateId(),
        content: data.response,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Mettre à jour la liste des messages
      const newMessages = [...updatedMessages, botMessage];
      
      // Conserver seulement les MAX_MESSAGES derniers messages si nécessaire
      if (newMessages.length > MAX_MESSAGES) {
        setMessages(newMessages.slice(newMessages.length - MAX_MESSAGES));
      } else {
        setMessages(newMessages);
      }
    } catch (err: any) {
      console.error("Erreur lors de l'envoi de la question:", err);
      setError(
        err.response?.data?.error || 
        "Une erreur est survenue lors du traitement de votre question."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Envoyer le message avec Entrée (sauf si Shift est pressé pour permettre les sauts de ligne)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentQuestion("");
    setError("");

    // Mettre le focus sur le champ de texte après la réinitialisation
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Réinitialiser l'état après la fermeture de la boîte de dialogue
    setTimeout(handleReset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Chat avec la convention "{conventionName}"
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Posez des questions sur cette convention collective.
            Le système analysera le document complet pour vous répondre.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-[300px] mt-4 space-y-4">
          {/* Zone de chat avec les messages */}
          <ScrollArea className="flex-1 pr-4 min-h-[300px] max-h-[50vh]" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Posez votre première question sur la convention collective.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-4",
                      msg.role === "user" 
                        ? "bg-muted/50 ml-12" 
                        : "bg-primary/10 mr-12"
                    )}
                  >
                    <div className={cn(
                      "rounded-full p-2 h-8 w-8 flex items-center justify-center",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-green-600 text-white"
                    )}>
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none break-words">
                        {msg.role === "assistant" ? (
                          <MarkdownTableRendererEnhanced content={msg.content} />
                        ) : (
                          msg.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line || <br />}</p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    L'assistant analyse la convention...
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Zone d'input pour les questions */}
          <div className="space-y-4 sticky bottom-0 bg-background pt-2">
            {error && (
              <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur la convention..."
                className="flex-1 min-h-[80px] resize-none"
                disabled={isLoading}
              />
              
              <div className="flex flex-col gap-2 mb-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!currentQuestion.trim() || isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white h-10 px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    title="Effacer l'historique"
                    className="h-10 w-10"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}