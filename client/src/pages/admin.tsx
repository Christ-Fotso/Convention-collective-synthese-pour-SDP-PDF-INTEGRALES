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
import { Checkbox } from "@/components/ui/checkbox";
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

// Définir les différents types de sections disponibles avec leurs sous-catégories
interface SectionType {
  id: string;
  name: string;
  subcategories?: { id: string; name: string }[];
}

const SECTION_TYPES: SectionType[] = [
  { 
    id: 'classification', 
    name: 'Classification',
    subcategories: [
      { id: 'classification.definition', name: 'Définitions' },
      { id: 'classification.grille', name: 'Grille de classification' },
      { id: 'classification.evolution', name: 'Évolution professionnelle' }
    ] 
  },
  { 
    id: 'salaires', 
    name: 'Salaires',
    subcategories: [
      { id: 'salaires.grille', name: 'Grille de salaires' },
      { id: 'salaires.primes', name: 'Primes et indemnités' },
      { id: 'salaires.anciennete', name: 'Ancienneté' }
    ] 
  },
  { 
    id: 'conges', 
    name: 'Congés',
    subcategories: [
      { id: 'conges.payes', name: 'Congés payés' },
      { id: 'conges.exceptionnels', name: 'Congés exceptionnels' },
      { id: 'conges.anciennete', name: 'Congés d\'ancienneté' }
    ] 
  },
  { 
    id: 'temps-travail', 
    name: 'Temps de travail',
    subcategories: [
      { id: 'temps-travail.duree', name: 'Durée du travail' },
      { id: 'temps-travail.heures-sup', name: 'Heures supplémentaires' },
      { id: 'temps-travail.amenagement', name: 'Aménagement du temps' }
    ] 
  },
  { 
    id: 'rupture', 
    name: 'Rupture',
    subcategories: [
      { id: 'rupture.preavis', name: 'Préavis' },
      { id: 'rupture.indemnites', name: 'Indemnités' },
      { id: 'rupture.retraite', name: 'Départ en retraite' }
    ] 
  },
  { 
    id: 'embauche', 
    name: 'Embauche',
    subcategories: [
      { id: 'embauche.essai', name: 'Période d\'essai' },
      { id: 'embauche.contrat', name: 'Types de contrat' },
      { id: 'embauche.non-concurrence', name: 'Clause de non-concurrence' }
    ] 
  },
  { 
    id: 'informations-generales', 
    name: 'Informations générales',
    subcategories: [
      { id: 'informations-generales.champ-application', name: 'Champ d\'application' },
      { id: 'informations-generales.adhesion', name: 'Adhésion' },
      { id: 'informations-generales.revision', name: 'Révision et dénonciation' }
    ] 
  },
];

export default function AdminPage() {
  const { toast } = useToast();
  
  // États
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [selectedConventionId, setSelectedConventionId] = useState<string>("");
  const [selectedConventions, setSelectedConventions] = useState<Convention[]>([]);
  const [sections, setSections] = useState<ConventionSection[]>([]);
  const [allSections, setAllSections] = useState<Record<string, ConventionSection[]>>({});
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [apiUsageStats, setApiUsageStats] = useState<ApiUsageStats | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSectionTypes, setSelectedSectionTypes] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  // État pour le dialogue d'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ConventionSection | null>(null);
  const [editedContent, setEditedContent] = useState("");
  
  // État pour la création de section
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState("");
  const [newSectionSubcategory, setNewSectionSubcategory] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showSubcategoriesInForm, setShowSubcategoriesInForm] = useState(false);
  
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
    setIsBatchMode(false);
  };
  
  const toggleConventionSelection = (convention: Convention) => {
    setSelectedConventions(prev => {
      const isSelected = prev.some(c => c.id === convention.id);
      if (isSelected) {
        return prev.filter(c => c.id !== convention.id);
      } else {
        return [...prev, convention];
      }
    });
  };
  
  const loadSectionsForSelectedConventions = async () => {
    if (selectedConventions.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins une convention",
      });
      return;
    }
    
    const newAllSections: Record<string, ConventionSection[]> = {};
    let hasLoadedAny = false;
    
    for (const convention of selectedConventions) {
      try {
        const response = await fetch(`/api/admin/sections/${convention.id}`);
        if (response.ok) {
          const data = await response.json();
          newAllSections[convention.id] = data;
          hasLoadedAny = true;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des sections pour ${convention.id}:`, error);
      }
    }
    
    if (hasLoadedAny) {
      setAllSections(newAllSections);
      setIsBatchMode(true);
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sections pour les conventions sélectionnées",
        variant: "destructive"
      });
    }
  };
  
  const toggleSectionTypeSelection = (sectionType: string) => {
    setSelectedSectionTypes(prev => {
      const isSelected = prev.includes(sectionType);
      if (isSelected) {
        // Si on désélectionne une catégorie, on retire aussi toutes ses sous-catégories
        const category = SECTION_TYPES.find(t => t.id === sectionType);
        const subcategoryIds = category?.subcategories?.map(sc => sc.id) || [];
        
        setSelectedSubcategories(prevSub => 
          prevSub.filter(subId => !subcategoryIds.includes(subId))
        );
        
        return prev.filter(type => type !== sectionType);
      } else {
        return [...prev, sectionType];
      }
    });
  };
  
  const toggleSubcategorySelection = (subcategoryId: string) => {
    setSelectedSubcategories(prev => {
      const isSelected = prev.includes(subcategoryId);
      if (isSelected) {
        return prev.filter(id => id !== subcategoryId);
      } else {
        return [...prev, subcategoryId];
      }
    });
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
    // Déterminer le type de section à utiliser (catégorie ou sous-catégorie)
    const sectionTypeToUse = showSubcategoriesInForm && newSectionSubcategory 
      ? newSectionSubcategory 
      : newSectionType;
      
    if (!selectedConventionId || !sectionTypeToUse || !newSectionContent) {
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
          sectionType: sectionTypeToUse,
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
        setNewSectionSubcategory("");
        setNewSectionContent("");
        setShowSubcategoriesInForm(false);
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
  
  const handleBatchGenerate = async () => {
    if (selectedConventions.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins une convention",
      });
      return;
    }
    
    const hasSelectedSections = selectedSectionTypes.length > 0 || selectedSubcategories.length > 0;
    if (!hasSelectedSections) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins une catégorie ou sous-catégorie",
      });
      return;
    }
    
    // Déterminer les sections à générer
    const sectionsToGenerate: string[] = [];
    
    // Si on a choisi d'afficher les sous-catégories
    if (showSubcategories && selectedSubcategories.length > 0) {
      // On génère uniquement les sous-catégories sélectionnées
      sectionsToGenerate.push(...selectedSubcategories);
    } else {
      // Sinon on génère les catégories principales
      sectionsToGenerate.push(...selectedSectionTypes);
    }
    
    // Confirmer avec l'utilisateur
    const conventionCount = selectedConventions.length;
    const sectionTypeCount = sectionsToGenerate.length;
    const totalOperations = conventionCount * sectionTypeCount;
    
    if (!confirm(`Vous êtes sur le point de lancer ${totalOperations} opération(s) de génération (${conventionCount} convention(s) × ${sectionTypeCount} section(s)). Voulez-vous continuer ?`)) {
      return;
    }
    
    toast({
      title: "Génération par lot lancée",
      description: `${totalOperations} génération(s) en cours. Cela peut prendre plusieurs minutes...`
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    // Approche optimisée: un seul appel par convention avec toutes les sections
    for (const convention of selectedConventions) {
      try {
        // On utilise la nouvelle API optimisée qui fait un seul appel pour plusieurs sections
        const response = await fetch('/api/admin/generate-sections-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conventionId: convention.id,
            sectionTypes: sectionsToGenerate
          })
        });
        
        if (response.ok) {
          // Un appel réussi compte pour toutes les sections de cette convention
          successCount += sectionsToGenerate.length;
        } else {
          errorCount += sectionsToGenerate.length;
        }
      } catch (error) {
        console.error(`Erreur lors de la génération pour la convention ${convention.id}:`, error);
        errorCount += sectionsToGenerate.length;
      }
    }
    
    toast({
      title: "Résultat de la génération par lot",
      description: `${successCount} génération(s) lancée(s) avec succès, ${errorCount} échec(s). La génération continue en arrière-plan et peut prendre plusieurs minutes.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
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
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant={isBatchMode ? "outline" : "default"}
                  onClick={() => setIsBatchMode(false)}
                >
                  Mode individuel
                </Button>
                <Button 
                  variant={isBatchMode ? "default" : "outline"}
                  onClick={() => setIsBatchMode(true)}
                >
                  Mode traitement par lot
                </Button>
              </div>
              
              {!isBatchMode ? (
                // Mode individuel
                <>
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
                </>
              ) : (
                // Mode traitement par lot
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Sélection des conventions</h3>
                      <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
                        {conventions.map(convention => (
                          <div key={convention.id} className="flex items-center space-x-2 py-2">
                            <Checkbox
                              id={`convention-${convention.id}`}
                              checked={selectedConventions.some(c => c.id === convention.id)}
                              onCheckedChange={() => toggleConventionSelection(convention)}
                            />
                            <Label htmlFor={`convention-${convention.id}`} className="cursor-pointer">
                              {convention.name} (IDCC {convention.id})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Sélection des types de sections</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowSubcategories(!showSubcategories)}
                        >
                          {showSubcategories ? "Afficher catégories" : "Afficher sous-catégories"}
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        {!showSubcategories ? (
                          // Affichage des catégories principales
                          SECTION_TYPES.map(type => (
                            <div key={type.id} className="flex items-center space-x-2 py-2">
                              <Checkbox
                                id={`section-type-${type.id}`}
                                checked={selectedSectionTypes.includes(type.id)}
                                onCheckedChange={() => toggleSectionTypeSelection(type.id)}
                              />
                              <Label htmlFor={`section-type-${type.id}`} className="cursor-pointer">
                                {type.name}
                              </Label>
                            </div>
                          ))
                        ) : (
                          // Affichage des sous-catégories
                          <div className="space-y-6">
                            {SECTION_TYPES.map(category => (
                              <div key={category.id} className="space-y-2">
                                <div className="flex items-center space-x-2 py-1 font-semibold border-b">
                                  <Checkbox
                                    id={`category-${category.id}`}
                                    checked={selectedSectionTypes.includes(category.id)}
                                    onCheckedChange={() => toggleSectionTypeSelection(category.id)}
                                  />
                                  <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                                    {category.name}
                                  </Label>
                                </div>
                                
                                <div className="ml-6 space-y-1">
                                  {category.subcategories?.map(subcategory => (
                                    <div key={subcategory.id} className="flex items-center space-x-2 py-1">
                                      <Checkbox
                                        id={`subcategory-${subcategory.id}`}
                                        checked={selectedSubcategories.includes(subcategory.id)}
                                        onCheckedChange={() => toggleSubcategorySelection(subcategory.id)}
                                      />
                                      <Label htmlFor={`subcategory-${subcategory.id}`} className="cursor-pointer text-sm">
                                        {subcategory.name}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline"
                      onClick={loadSectionsForSelectedConventions}
                    >
                      Charger les sections existantes
                    </Button>
                    <Button 
                      onClick={handleBatchGenerate}
                      disabled={selectedConventions.length === 0 || 
                              (showSubcategories ? selectedSubcategories.length === 0 : selectedSectionTypes.length === 0)}
                    >
                      Générer les sections sélectionnées
                    </Button>
                  </div>
                  
                  {Object.keys(allSections).length > 0 && (
                    <div className="mt-8 space-y-6">
                      <h3 className="text-lg font-medium">Sections existantes</h3>
                      {Object.entries(allSections).map(([conventionId, sections]) => {
                        const convention = conventions.find(c => c.id === conventionId);
                        return (
                          <div key={conventionId} className="border rounded-md p-4">
                            <h4 className="text-md font-medium mb-4">{convention?.name} (IDCC {conventionId})</h4>
                            
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
                              <p className="text-center py-4">Aucune section disponible pour cette convention</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
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
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Niveau de détail</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSubcategoriesInForm(!showSubcategoriesInForm)}
              >
                {showSubcategoriesInForm ? "Utiliser catégorie" : "Utiliser sous-catégorie"}
              </Button>
            </div>
            
            {!showSubcategoriesInForm ? (
              // Sélection de la catégorie principale
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
            ) : (
              // Sélection de la catégorie puis de la sous-catégorie
              <div className="space-y-4">
                <div>
                  <Label htmlFor="section-category">Catégorie</Label>
                  <Select 
                    value={newSectionType} 
                    onValueChange={setNewSectionType}
                  >
                    <SelectTrigger id="section-category">
                      <SelectValue placeholder="Choisir une catégorie" />
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
                
                {newSectionType && (
                  <div>
                    <Label htmlFor="section-subcategory">Sous-catégorie</Label>
                    <Select 
                      value={newSectionSubcategory} 
                      onValueChange={setNewSectionSubcategory}
                    >
                      <SelectTrigger id="section-subcategory">
                        <SelectValue placeholder="Choisir une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_TYPES.find(t => t.id === newSectionType)?.subcategories?.map(subcat => (
                          <SelectItem key={subcat.id} value={subcat.id}>
                            {subcat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
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