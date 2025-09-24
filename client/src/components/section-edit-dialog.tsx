import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, Save, X, AlertCircle } from 'lucide-react';
import { MarkdownTableRendererEnhanced } from '@/components/markdown-table-renderer-enhanced';
import { getSectionPrompt, getSystemPrompt } from '@/lib/section-prompt-mapping';
import axios from 'axios';

interface SectionEditDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  conventionId: string;
  sectionType: string;
  currentContent: string;
  sectionTitle: string;
}

export function SectionEditDialog({
  isOpen,
  setIsOpen,
  conventionId,
  sectionType,
  currentContent,
  sectionTitle
}: SectionEditDialogProps) {
  const [regeneratedContent, setRegeneratedContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const queryClient = useQueryClient();

  // Mutation pour régénérer le contenu
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      try {
        // Récupérer les prompts
        const [systemPrompt, userPrompt] = await Promise.all([
          getSystemPrompt(),
          getSectionPrompt(sectionType)
        ]);

        // Appeler l'API de régénération
        const response = await axios.post(`/api/convention/${conventionId}/section/${sectionType}/regenerate`, {
          systemPrompt,
          userPrompt
        });

        return response.data.content;
      } catch (error) {
        console.error('Erreur lors de la régénération:', error);
        throw new Error('Impossible de régénérer le contenu. Veuillez réessayer.');
      }
    },
    onSuccess: (content) => {
      setRegeneratedContent(content);
      setIsPreviewMode(true);
    }
  });

  // Mutation pour sauvegarder les modifications
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await axios.put(`/api/convention/${conventionId}/section/${sectionType}`, {
        content: newContent
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalider le cache pour rafraîchir le contenu
      queryClient.invalidateQueries({
        queryKey: [`/api/convention/${conventionId}/section/${sectionType}`]
      });
      
      // Fermer la modal et réinitialiser
      handleClose();
    }
  });

  const handleClose = () => {
    setIsOpen(false);
    setRegeneratedContent('');
    setIsPreviewMode(false);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  const handleSave = () => {
    if (regeneratedContent) {
      saveMutation.mutate(regeneratedContent);
    }
  };

  const handleCancel = () => {
    setIsPreviewMode(false);
    setRegeneratedContent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Édition de section - {sectionTitle}
          </DialogTitle>
          <DialogDescription>
            {!isPreviewMode ? (
              "Cliquez sur 'Régénérer' pour créer une nouvelle version de cette section avec l'IA."
            ) : (
              "Prévisualisation du contenu régénéré. Vous pouvez valider ou annuler ces modifications."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Affichage des erreurs */}
          {regenerateMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {regenerateMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {saveMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erreur lors de la sauvegarde. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          )}

          {!isPreviewMode ? (
            /* Mode initial - affichage du contenu actuel */
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contenu actuel :</h3>
                <div className="border rounded-md p-4 bg-muted/50 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MarkdownTableRendererEnhanced content={currentContent} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleRegenerate}
                  disabled={regenerateMutation.isPending}
                >
                  {regenerateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    'Régénérer'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Mode prévisualisation - comparaison ancien/nouveau */
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contenu actuel */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-600">Contenu actuel :</h3>
                  <div className="border rounded-md p-4 bg-muted/50 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownTableRendererEnhanced content={currentContent} />
                    </div>
                  </div>
                </div>
                
                {/* Nouveau contenu */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600">Nouveau contenu :</h3>
                  <div className="border-2 border-green-200 rounded-md p-4 bg-green-50/50 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownTableRendererEnhanced content={regeneratedContent} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button variant="outline" onClick={handleRegenerate} disabled={regenerateMutation.isPending}>
                  {regenerateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Régénération...
                    </>
                  ) : (
                    'Régénérer encore'
                  )}
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Valider et sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}