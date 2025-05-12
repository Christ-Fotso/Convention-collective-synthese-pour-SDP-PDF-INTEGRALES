import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatConventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conventionId: string;
  conventionName: string;
}

export function ChatConventionDialog({
  open,
  onOpenChange,
  conventionId,
  conventionName,
}: ChatConventionDialogProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { data } = await axios.post(`/api/convention/${conventionId}/ask`, {
        question: question.trim()
      });
      
      setResponse(data.response);
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

  const handleReset = () => {
    setQuestion("");
    setResponse("");
    setError("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Réinitialiser l'état après une courte période pour éviter de voir la réinitialisation
    setTimeout(handleReset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Question sur la convention "{conventionName}"
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
            Posez une question spécifique sur cette convention collective.
            Le système analysera le texte intégral pour vous répondre.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {!response ? (
            // Mode question
            <div className="space-y-4">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Exemple: Quelle est la durée de la période d'essai pour un cadre ?"
                className="min-h-[100px] text-base"
                disabled={isLoading}
              />
              
              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className={cn(
                    "transition-all",
                    isLoading ? "w-[100px]" : "w-[130px]"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Mode réponse
            <div className="space-y-6">
              <div className="rounded-md border p-4 bg-muted/50">
                <h3 className="font-medium text-sm mb-1">Votre question:</h3>
                <p>{question}</p>
              </div>
              
              <div className="rounded-md border p-4">
                <h3 className="font-medium text-sm mb-2">Réponse:</h3>
                <div className="prose prose-sm max-w-none">
                  {response.split('\n').map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-[180px]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Nouvelle question
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}