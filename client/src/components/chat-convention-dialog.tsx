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
import { X, Send, RotateCcw, Loader2, User, Bot, FileText } from "lucide-react";
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
  sources?: Array<{ conventionName: string; idcc: string; filename: string }>;
  method?: 'RAG' | 'structured' | 'PDF';
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
  const useRAG = true; // RAG uniquement
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
      // Utiliser la nouvelle API PDF avec GPT-4o Mini (économique et rapide)
      const response = await axios.post("/api/chat-pdf", {
        question: userMessage.content,
        conventionId: conventionId
      });
      const data = response.data;
      
      // Ajouter la réponse du système
      const botMessage: ChatMessage = {
        id: generateId(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
        sources: data.source ? [{ 
          conventionName: conventionName, 
          idcc: conventionId, 
          filename: data.source 
        }] : [],
        method: 'PDF' as any
      };
      
      // Mettre à jour la liste des messages
      const newMessages = [...updatedMessages, botMessage];
      
      // Conserver seulement les MAX_MESSAGES derniers messages si nécessaire
      if (newMessages.length > MAX_MESSAGES) {
        setMessages(newMessages.slice(newMessages.length - MAX_MESSAGES));
      } else {
        setMessages(newMessages);
      }

      // Afficher le coût dans la console (pour monitoring)
      if (data.cost) {
        console.log(`Coût de la requête: $${data.cost.toFixed(6)}`);
      }

    } catch (err: any) {
      console.error("Erreur lors de l'envoi de la question:", err);
      
      // Message d'erreur plus précis basé sur la réponse du serveur
      let errorMessage = "Une erreur est survenue lors du traitement de votre question.";
      
      if (err.response?.data?.message) {
        // Utiliser le message d'erreur détaillé du serveur s'il existe
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = `Le PDF de cette convention n'est pas disponible.`;
      } else if (err.response?.status === 500) {
        errorMessage = `Erreur lors de l'analyse du PDF de la convention.`;
      }
      
      setError(errorMessage);
      
      // Ajouter un message d'erreur comme "message de l'assistant" pour une meilleure visibilité
      if (err.response?.status >= 500) {
        const errorBotMessage: ChatMessage = {
          id: generateId(),
          content: `**Erreur**: ${errorMessage}\n\nVeuillez réessayer ultérieurement.`,
          role: "assistant",
          timestamp: new Date()
        };
        
        setMessages(messages => [...messages, errorBotMessage]);
      }
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-green-600 font-semibold">
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
            Posez des questions précises sur cette convention collective.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh] mt-4">
          {/* Zone de chat avec les messages */}
          <ScrollArea className="flex-1 pr-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Posez votre question sur la convention collective.</p>
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
                      <div className="prose prose-sm max-w-none break-words enhanced-table-container">
                        {msg.role === "assistant" ? (
                          <MarkdownTableRendererEnhanced content={msg.content} />
                        ) : (
                          msg.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line || <br />}</p>
                          ))
                        )}
                      </div>
                      
                      {/* Afficher les sources si RAG */}
                      {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sources consultées :
                            </span>
                          </div>
                          <div className="space-y-1">
                            {msg.sources.map((source, idx) => (
                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                • {source.conventionName} (IDCC {source.idcc})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      

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
          
          {/* Barre d'information d'erreur */}
          {error && (
            <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded-md mb-2">
              {error}
            </div>
          )}
          
          {/* Zone d'input pour les questions - fixée en bas */}
          <div className="border-t pt-3 mt-2 bg-background">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question sur la convention..."
                  className="flex-1 min-h-[60px] max-h-[80px] resize-none"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex flex-col gap-2 justify-end">
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