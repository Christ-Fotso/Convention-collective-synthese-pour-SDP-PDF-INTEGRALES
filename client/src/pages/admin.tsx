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
import { Loader2, Save, FileText, Search, Edit, Plus, Trash2, AlertCircle } from "lucide-react";
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
                <div className="h-[calc(100vh-350px)] overflow-y-auto pr-2">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredConventions.map((convention: Convention) => (
                      <AccordionItem key={convention.id} value={convention.id}>
                        <AccordionTrigger
                          onClick={() => setSelectedConvention(convention.id)}
                          className={selectedConvention === convention.id ? "font-bold" : ""}
                        >
                          {convention.name} ({convention.id})
                        </AccordionTrigger>
                        <AccordionContent>
                          {isLoadingConvention && selectedConvention === convention.id ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            <ul className="ml-2 space-y-1">
                              {conventionDetail?.sections?.map((section: { name: string, title: string }) => (
                                <li 
                                  key={section.name} 
                                  className={`
                                    cursor-pointer text-sm py-1 px-2 rounded hover:bg-slate-100
                                    ${selectedSection === section.name ? 'bg-slate-200' : ''}
                                  `}
                                  onClick={() => setSelectedSection(section.name)}
                                >
                                  {section.title || section.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                  <Button variant="outline" onClick={startEditing}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
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
    </div>
  );
}