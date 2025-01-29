import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Message } from '@/types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onReset: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onReset,
  isLoading,
  error
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={onReset}
          className="flex items-center gap-2"
          disabled={isLoading || messages.length === 0}
        >
          <RefreshCw className="h-4 w-4" />
          Réinitialiser la conversation
        </Button>
      </div>

      <Card className="flex-1 mb-4">
        <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === "user" 
                  ? "text-right" 
                  : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-left">
              <div className="inline-block bg-muted px-4 py-2 rounded-lg">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
          disabled={isLoading || messages.length >= 6}
        />
        <Button type="submit" disabled={isLoading || messages.length >= 6}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {messages.length >= 6 && (
        <p className="text-sm text-muted-foreground mt-2">
          Limite de 6 messages atteinte. Veuillez réinitialiser la conversation.
        </p>
      )}
    </div>
  );
}