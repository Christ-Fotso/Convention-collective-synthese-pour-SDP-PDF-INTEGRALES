import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, FileText, Search, Edit, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";
import axios from 'axios';

interface Convention {
  id: string;
  name: string;
  sections: string[];
}

interface ConventionDetail {
  key: string;
  name: string;
  idcc: string;
  sections: {
    name: string;
    title: string;
  }[];
}

interface SectionDetail {
  conventionId: string;
  conventionName: string;
  sectionName: string;
  sectionTitle: string;
  content: string;
}

// Composant pour afficher une alerte
const StatusAlert = ({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  
  return (
    <Alert className={`${bgColor} mb-4`}>
      <AlertCircle className={`h-4 w-4 ${textColor}`} />
      <AlertTitle className={textColor}>
        {type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Information'}
      </AlertTitle>
      <AlertDescription className={textColor}>
        {message}
      </AlertDescription>
    </Alert>
  );
};

// Page d'administration
export default function AdminPage() {
  const [selectedConvention, setSelectedConvention] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const queryClient = useQueryClient();

  // Récupérer la structure JSON
  const { data: jsonStructure, isLoading: isLoadingStructure, error: structureError } = useQuery({
    queryKey: ['jsonStructure'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/json-structure');
      return response.data;
    }
  });

  // Récupérer les détails d'une convention
  const { data: conventionDetail, isLoading: isLoadingConvention } = useQuery({
    queryKey: ['conventionDetail', selectedConvention],
    queryFn: async () => {
      if (!selectedConvention) return null;
      const response = await axios.get(`/api/admin/convention/${selectedConvention}`);
      return response.data;
    },
    enabled: !!selectedConvention,
  });

  // Récupérer les détails d'une section
  const { data: sectionDetail, isLoading: isLoadingSection } = useQuery({
    queryKey: ['sectionDetail', selectedConvention, selectedSection],
    queryFn: async () => {
      if (!selectedConvention || !selectedSection) return null;
      const response = await axios.get(`/api/admin/convention/${selectedConvention}/section/${encodeURIComponent(selectedSection)}`);
      return response.data;
    },
    enabled: !!selectedConvention && !!selectedSection,
  });

  // Mutation pour mettre à jour une section
  const updateSectionMutation = useMutation({
    mutationFn: async (data: { conventionId: string, sectionName: string, content: string, sectionTitle: string }) => {
      const response = await axios.put(
        `/api/admin/convention/${data.conventionId}/section/${encodeURIComponent(data.sectionName)}`,
        { content: data.content, sectionTitle: data.sectionTitle }
      );
      return response.data;
    },
    onSuccess: () => {
      // Rafraîchir les données après la mise à jour
      queryClient.invalidateQueries({ queryKey: ['sectionDetail', selectedConvention, selectedSection] });
      setStatusMessage({ type: 'success', message: 'Section mise à jour avec succès' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        message: `Erreur lors de la mise à jour: ${error.response?.data?.error || error.message}` 
      });
    }
  });

  // Filtrer les conventions
  const filteredConventions = jsonStructure?.conventions?.filter((convention: Convention) => 
    convention.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    convention.id.includes(searchQuery)
  ) || [];

  // Démarrer l'édition
  const startEditing = () => {
    if (sectionDetail) {
      setEditedContent(sectionDetail.content);
      setEditedTitle(sectionDetail.sectionTitle);
      setIsEditing(true);
    }
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setIsEditing(false);
    setStatusMessage(null);
  };

  // Sauvegarder les modifications
  const saveChanges = () => {
    if (selectedConvention && selectedSection) {
      updateSectionMutation.mutate({
        conventionId: selectedConvention,
        sectionName: selectedSection,
        content: editedContent,
        sectionTitle: editedTitle
      });
    }
  };
  
  // Mutation pour appeler l'API OpenAI avec GPT-4o-mini
  const aiMutation = useMutation({
    mutationFn: async (data: { prompt: string, content: string }) => {
      setIsAIProcessing(true);
      try {
        // Appel à l'API OpenAI via notre backend
        const response = await axios.post('/api/openai/edit-text', {
          prompt: data.prompt,
          content: data.content,
          model: 'gpt-4o-mini'  // Utiliser spécifiquement gpt-4o-mini
        });
        return response.data;
      } catch (error) {
        throw error;
      } finally {
        setIsAIProcessing(false);
      }
    },
    onSuccess: (data) => {
      // Mettre à jour le contenu édité avec la suggestion de l'IA
      if (data.content) {
        setAiResponse(data.content);
      }
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        message: `Erreur lors de l'appel à l'IA: ${error.response?.data?.error || error.message}` 
      });
    }
  });
  
  // Fonction pour appliquer les suggestions de l'IA
  const applyAISuggestion = () => {
    if (aiResponse) {
      setEditedContent(aiResponse);
      setIsEditing(true);
      setShowAIPrompt(false);
      setAiResponse('');
      setAiPrompt('');
    }
  };

  // Réinitialiser la sélection de section lors du changement de convention
  useEffect(() => {
    setSelectedSection(null);
  }, [selectedConvention]);

  // Réinitialiser le statut après 5 secondes
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Administration des données JSON</h1>
      
      {statusMessage && (
        <StatusAlert type={statusMessage.type} message={statusMessage.message} />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar pour la sélection de convention et section */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Conventions collectives</CardTitle>
              <CardDescription>Sélectionnez une convention pour voir et éditer ses sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une convention..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {isLoadingStructure ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement des conventions...</span>
                </div>
              ) : structureError ? (
                <StatusAlert 
                  type="error" 
                  message="Erreur lors du chargement des conventions" 
                />
              ) : (
                <div className="h-[calc(100vh-350px)] overflow-y-auto pr-2 border rounded-lg bg-white shadow-sm">
                  {/* Afficher le nombre de conventions trouvées */}
                  <div className="p-2 border-b bg-gray-50 text-sm text-gray-500">
                    {filteredConventions.length} conventions trouvées
                  </div>
                  
                  {/* Liste simple pour meilleures performances */}
                  <div className="divide-y">
                    {filteredConventions.map((convention: Convention) => (
                      <div key={convention.id} className="hover:bg-gray-50">
                        <div 
                          className={`
                            p-3 cursor-pointer flex justify-between items-center
                            ${selectedConvention === convention.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}
                          `}
                          onClick={() => setSelectedConvention(convention.id)}
                        >
                          <div>
                            <div className="font-medium">{convention.name}</div>
                            <div className="text-sm text-gray-500">IDCC {convention.id}</div>
                          </div>
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {convention.sections.length} sections
                          </div>
                        </div>
                        
                        {/* Afficher les sections uniquement pour la convention sélectionnée */}
                        {selectedConvention === convention.id && (
                          <div className="bg-gray-50 px-3 py-2 border-l-4 border-blue-500">
                            {isLoadingConvention ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm">Chargement des sections...</span>
                              </div>
                            ) : (
                              <div className="max-h-60 overflow-y-auto">
                                <div className="text-xs font-medium mb-2 text-gray-500">SECTIONS DISPONIBLES:</div>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                  {conventionDetail?.sections?.map((section: { name: string, title: string }) => (
                                    <li 
                                      key={section.name} 
                                      className={`
                                        cursor-pointer text-sm py-1 px-2 rounded hover:bg-blue-100
                                        ${selectedSection === section.name ? 'bg-blue-200 font-medium' : ''}
                                      `}
                                      onClick={() => setSelectedSection(section.name)}
                                    >
                                      {section.title || section.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Section principale pour l'édition */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {sectionDetail ? (
                      <span>{sectionDetail.sectionTitle || sectionDetail.sectionName}</span>
                    ) : (
                      <span>Contenu de la section</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {sectionDetail?.conventionName} (IDCC: {sectionDetail?.conventionId})
                  </CardDescription>
                </div>
                {sectionDetail && !isEditing && (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={startEditing}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAIPrompt(true)}
                      className="bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <span className="text-xs font-bold mr-1">AI</span>
                      Aide GPT-4o-mini
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSection ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement de la section...</span>
                </div>
              ) : !selectedSection ? (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez une section pour voir son contenu</p>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="sectionTitle">
                      Titre de la section
                    </label>
                    <Input
                      id="sectionTitle"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="sectionContent">
                      Contenu (Markdown)
                    </label>
                    <Textarea
                      id="sectionContent"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full min-h-[500px] font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium mb-2">Contenu de la section (Markdown)</h3>
                  <pre className="bg-slate-50 p-4 rounded-md border text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                    {sectionDetail?.content || 'Aucun contenu disponible'}
                  </pre>
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelEditing}>
                  Annuler
                </Button>
                <Button 
                  onClick={saveChanges} 
                  disabled={updateSectionMutation.isPending}
                >
                  {updateSectionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Dialog pour l'assistance IA */}
      <Dialog open={showAIPrompt} onOpenChange={setShowAIPrompt}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
              Assistant IA GPT-4o-mini
            </DialogTitle>
            <DialogDescription>
              Décrivez les modifications que vous souhaitez apporter à cette section 
              et l'IA vous aidera à améliorer ou reformuler le contenu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="ai-prompt" className="text-sm font-medium">
                Votre instruction pour l'IA
              </label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Exemple: Reformule ce texte pour le rendre plus clair, corrige les fautes d'orthographe, améliore la structure des phrases..."
                className="min-h-[100px]"
              />
              
              <div className="text-xs text-muted-foreground mt-1">
                Soyez aussi précis que possible dans votre demande pour obtenir un meilleur résultat.
              </div>
            </div>
            
            {aiResponse && (
              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">
                  Suggestion de l'IA
                </label>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{aiResponse}</pre>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div>
              {isAIProcessing && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement en cours...
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowAIPrompt(false)}>
                Annuler
              </Button>
              {!aiResponse ? (
                <Button 
                  onClick={() => {
                    if (sectionDetail && aiPrompt) {
                      aiMutation.mutate({
                        prompt: aiPrompt,
                        content: sectionDetail.content
                      });
                    }
                  }}
                  disabled={isAIProcessing || !aiPrompt || !sectionDetail}
                >
                  {isAIProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={applyAISuggestion}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Appliquer la suggestion
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}