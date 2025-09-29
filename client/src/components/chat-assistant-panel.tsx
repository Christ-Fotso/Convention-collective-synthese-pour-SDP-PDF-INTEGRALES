import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw, Loader2, User, Bot, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

interface ChatAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conventionId: string;
  conventionName: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: Array<{ conventionName: string; idcc: string; filename: string }>;
  method?: 'RAG' | 'structured' | 'PDF';
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

function ChatContent({ 
  conventionId, 
  conventionName,
  onClose 
}: { 
  conventionId: string; 
  conventionName: string;
  onClose: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const MAX_MESSAGES = 23;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

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
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentQuestion("");
    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.post("/api/chat-pdf", {
        question: userMessage.content,
        conventionId: conventionId
      });
      const data = response.data;
      
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
      
      const newMessages = [...updatedMessages, botMessage];
      
      if (newMessages.length > MAX_MESSAGES) {
        setMessages(newMessages.slice(newMessages.length - MAX_MESSAGES));
      } else {
        setMessages(newMessages);
      }

      if (data.cost) {
        console.log(`Coût de la requête: $${data.cost.toFixed(6)}`);
      }

    } catch (err: any) {
      console.error("Erreur lors de l'envoi de la question:", err);
      
      let errorMessage = "Une erreur est survenue lors du traitement de votre question.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = `Le PDF de cette convention n'est pas disponible.`;
      } else if (err.response?.status === 500) {
        errorMessage = `Erreur lors de l'analyse du PDF de la convention.`;
      }
      
      setError(errorMessage);
      
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentQuestion("");
    setError("");

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
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
                    ? "bg-muted/50" 
                    : "bg-primary/10"
                )}
              >
                <div className={cn(
                  "rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0",
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
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm max-w-none break-words">
                    {msg.role === "assistant" ? (
                      <MarkdownTableRendererEnhanced content={msg.content} />
                    ) : (
                      msg.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line || <br />}</p>
                      ))
                    )}
                  </div>
                  
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
      
      {error && (
        <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded-md mb-2">
          {error}
        </div>
      )}
      
      <div className="border-t pt-3 mt-2 bg-background">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question sur la convention..."
              className="flex-1 min-h-[60px] max-h-[80px] resize-none text-sm"
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
  );
}

export function ChatAssistantPanel({
  open,
  onOpenChange,
  conventionId,
  conventionName,
}: ChatAssistantPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-green-600 font-semibold">
              Chat avec la convention
            </SheetTitle>
            <SheetDescription className="text-sm">
              {conventionName}
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-140px)]">
            <ChatContent 
              conventionId={conventionId} 
              conventionName={conventionName}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-green-600 font-semibold text-left">
            Chat avec la convention
          </DrawerTitle>
          <DrawerDescription className="text-sm text-left">
            {conventionName}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 h-[70vh]">
          <ChatContent 
            conventionId={conventionId} 
            conventionName={conventionName}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
