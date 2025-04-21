import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Convention } from "../types";

// Types pour l'administration
interface ConventionSection {
  id: string;
  conventionId: string;
  sectionType: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiMetric {
  id: string;
  apiName: string;
  endpoint: string;
  conventionId?: string;
  tokensIn: number;
  tokensOut: number;
  estimatedCost: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface ApiUsageStats {
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  successRate: number;
}

// Fonction pour formater le coût
const formatCost = (cost: number) => {
  return (cost / 100).toFixed(2) + " €";
};

// Définir les différents types de sections disponibles
const SECTION_TYPES = [
  { id: 'classification', name: 'Classification' },
  { id: 'salaires', name: 'Salaires' },
  { id: 'conges', name: 'Congés' },
  { id: 'temps-travail', name: 'Temps de travail' },
  { id: 'rupture', name: 'Rupture' },
  { id: 'embauche', name: 'Embauche' },
  { id: 'informations-generales', name: 'Informations générales' },
];

export default function AdminPage() {
  const { toast } = useToast();
  
  // États
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [selectedConventionId, setSelectedConventionId] = useState<string>("");
  const [sections, setSections] = useState<ConventionSection[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [apiUsageStats, setApiUsageStats] = useState<ApiUsageStats | null>(null);
  
  // État pour le dialogue d'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ConventionSection | null>(null);
  const [editedContent, setEditedContent] = useState("");
  
  // État pour la création de section
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  
  // Chargement initial des conventions
  useEffect(() => {
    const fetchConventions = async () => {
      try {
        const response = await fetch('/api/conventions');
        const data = await response.json();
        setConventions(data);
      } catch (error) {
        console.error('Erreur lors du chargement des conventions:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les conventions",
          variant: "destructive"
        });
      }
    };
    
    fetchConventions();
  }, [toast]);
  
  // Chargement des sections pour une convention sélectionnée
  useEffect(() => {
    if (!selectedConventionId) return;
    
    const fetchSections = async () => {
      try {
        const response = await fetch(`/api/admin/sections/${selectedConventionId}`);
        const data = await response.json();
        setSections(data);
      } catch (error) {
        console.error('Erreur lors du chargement des sections:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les sections pour cette convention",
          variant: "destructive"
        });
      }
    };
    
    fetchSections();
  }, [selectedConventionId, toast]);
  
  // Chargement des métriques API
  useEffect(() => {
    const fetchApiMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        const data = await response.json();
        setApiUsageStats(data);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques API:', error);
      }
    };
    
    fetchApiMetrics();
  }, []);
  
  // Gestionnaires d'événements
  const handleConventionChange = (conventionId: string) => {
    setSelectedConventionId(conventionId);
  };
  
  const handleEditSection = (section: ConventionSection) => {
    setSelectedSection(section);
    setEditedContent(section.content);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveSection = async () => {
    if (!selectedSection) return;
    
    try {
      const response = await fetch(`/api/admin/sections/${selectedSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedSection,
          content: editedContent
        })
      });
      
      if (response.ok) {
        // Mettre à jour localement la section modifiée
        setSections(prev => 
          prev.map(section => 
            section.id === selectedSection.id 
              ? { ...section, content: editedContent } 
              : section
          )
        );
        
        toast({
          title: "Succès",
          description: "Section mise à jour avec succès"
        });
        
        setIsEditDialogOpen(false);
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la section",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateNewSection = async () => {
    if (!selectedConventionId || !newSectionType || !newSectionContent) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conventionId: selectedConventionId,
          sectionType: newSectionType,
          content: newSectionContent,
          status: 'complete'
        })
      });
      
      if (response.ok) {
        const newSection = await response.json();
        
        // Ajouter la nouvelle section à la liste
        setSections(prev => [...prev, newSection]);
        
        toast({
          title: "Succès",
          description: "Section créée avec succès"
        });
        
        // Réinitialiser le formulaire
        setNewSectionType("");
        setNewSectionContent("");
        setIsNewSectionDialogOpen(false);
      } else {
        throw new Error("Erreur lors de la création");
      }
    } catch (error) {
      console.error('Erreur lors de la création de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la section",
        variant: "destructive"
      });
    }
  };
  
  const handleGenerateSection = async (conventionId: string, sectionType: string) => {
    try {
      toast({
        title: "Génération en cours",
        description: "La section est en cours de génération, cela peut prendre quelques minutes..."
      });
      
      const response = await fetch('/api/admin/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conventionId,
          sectionType
        })
      });
      
      if (response.ok) {
        toast({
          title: "Génération lancée",
          description: "La section sera générée en arrière-plan"
        });
      } else {
        throw new Error("Erreur lors du lancement de la génération");
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la section",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) return;
    
    try {
      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Retirer la section supprimée de la liste
        setSections(prev => prev.filter(section => section.id !== sectionId));
        
        toast({
          title: "Succès",
          description: "Section supprimée avec succès"
        });
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la section",
        variant: "destructive"
      });
    }
  };
  
  // Formatage du statut pour l'affichage
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Complété</span>;
      case 'pending':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
      case 'error':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Erreur</span>;
      default:
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inconnu</span>;
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Administration ConventionsAI</h1>
      
      <Tabs defaultValue="sections">
        <TabsList className="mb-4">
          <TabsTrigger value="sections">Sections des conventions</TabsTrigger>
          <TabsTrigger value="metrics">Métriques d'API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des sections extraites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label htmlFor="convention-select">Sélectionner une convention</Label>
                <Select 
                  value={selectedConventionId} 
                  onValueChange={handleConventionChange}
                >
                  <SelectTrigger id="convention-select" className="w-full">
                    <SelectValue placeholder="Choisir une convention" />
                  </SelectTrigger>
                  <SelectContent>
                    {conventions.map(convention => (
                      <SelectItem key={convention.id} value={convention.id}>
                        {convention.name} (IDCC {convention.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedConventionId && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium">Sections disponibles</h3>
                    <Button onClick={() => setIsNewSectionDialogOpen(true)}>
                      Nouvelle section
                    </Button>
                  </div>
                  
                  {sections.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Dernière mise à jour</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections.map(section => (
                          <TableRow key={section.id}>
                            <TableCell>
                              {SECTION_TYPES.find(t => t.id === section.sectionType)?.name || section.sectionType}
                            </TableCell>
                            <TableCell>{getStatusBadge(section.status)}</TableCell>
                            <TableCell>{new Date(section.updatedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditSection(section)}
                                >
                                  Éditer
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteSection(section.id)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-md">
                      <p className="mb-4">Aucune section disponible pour cette convention.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {SECTION_TYPES.map(type => (
                          <Button 
                            key={type.id}
                            variant="outline"
                            onClick={() => handleGenerateSection(selectedConventionId, type.id)}
                          >
                            Générer {type.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métriques d'utilisation API</CardTitle>
            </CardHeader>
            <CardContent>
              {apiUsageStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Requêtes totales</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{apiUsageStats.totalRequests}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Tokens consommés</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{apiUsageStats.totalTokensIn + apiUsageStats.totalTokensOut}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Coût total estimé</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{formatCost(apiUsageStats.totalCost)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{apiUsageStats.successRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p>Chargement des métriques...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialogue d'édition de section */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Éditer la section {SECTION_TYPES.find(t => t.id === selectedSection?.sectionType)?.name || selectedSection?.sectionType}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[300px] font-mono"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSection}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de création de section */}
      <Dialog open={isNewSectionDialogOpen} onOpenChange={setIsNewSectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle section</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="section-type">Type de section</Label>
              <Select 
                value={newSectionType} 
                onValueChange={setNewSectionType}
              >
                <SelectTrigger id="section-type">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="section-content">Contenu</Label>
              <Textarea
                id="section-content"
                value={newSectionContent}
                onChange={(e) => setNewSectionContent(e.target.value)}
                className="min-h-[300px] font-mono"
                placeholder="Contenu de la section..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSectionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateNewSection}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}