import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
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
    id: 'informations-generales', 
    name: 'Informations Générales',
    subcategories: [
      { id: 'informations-generales.generale', name: 'Informations Générales' }
    ] 
  },
  { 
    id: 'embauche', 
    name: 'Embauche',
    subcategories: [
      { id: 'embauche.delai-prevenance', name: 'Délai de prévenance' },
      { id: 'embauche.periode-essai', name: 'Période d\'essai' }
    ] 
  },
  { 
    id: 'temps-travail', 
    name: 'Temps de travail',
    subcategories: [
      { id: 'temps-travail.duree-travail', name: 'Durées du travail' },
      { id: 'temps-travail.amenagement-temps', name: 'Aménagement du temps de travail' },
      { id: 'temps-travail.heures-sup', name: 'Heures supplémentaires' },
      { id: 'temps-travail.temps-partiel', name: 'Temps partiel' },
      { id: 'temps-travail.forfait-jours', name: 'Forfait jours' },
      { id: 'temps-travail.travail-nuit', name: 'Travail de nuit' },
      { id: 'temps-travail.astreintes', name: 'Astreintes' },
      { id: 'temps-travail.jours-feries', name: 'Jours fériés' },
      { id: 'temps-travail.repos-hebdomadaire', name: 'Repos hebdomadaire' },
      { id: 'temps-travail.travail-dimanche', name: 'Travail du dimanche' }
    ] 
  },
  { 
    id: 'conges', 
    name: 'Congés',
    subcategories: [
      { id: 'conges.cet', name: 'CET' },
      { id: 'conges.conges-payes', name: 'Congés payés' },
      { id: 'conges.evenement-familial', name: 'Evènement familial' },
      { id: 'conges.anciennete', name: 'Congés d\'ancienneté' },
      { id: 'conges.conges-exceptionnels', name: 'Congés exceptionnels' },
      { id: 'conges.jours-supplementaires', name: 'Jours supplémentaires' },
      { id: 'conges.fractionnement', name: 'Fractionnement des congés' },
      { id: 'conges.sans-solde', name: 'Congés sans solde' },
      { id: 'conges.deces', name: 'Congés pour décès' },
      { id: 'conges.enfant-malade', name: 'Congés enfant malade' }
    ] 
  },
  { 
    id: 'classification', 
    name: 'Classification',
    subcategories: [
      { id: 'classification.classification', name: 'Classification Con + Détails' },
      { id: 'classification.grille', name: 'Grille de classification' },
      { id: 'classification.evolution', name: 'Évolution professionnelle' },
      { id: 'classification.emplois-reperes', name: 'Emplois repères' },
      { id: 'classification.coefficients', name: 'Coefficients hiérarchiques' }
    ] 
  },
  { 
    id: 'remuneration', 
    name: 'Rémunération',
    subcategories: [
      { id: 'remuneration.apprenti', name: 'Apprenti' },
      { id: 'remuneration.contrat-pro', name: 'Contrat de professionalisation' },
      { id: 'remuneration.stagiaire', name: 'Stagiaire' },
      { id: 'remuneration.prime', name: 'Prime' },
      { id: 'remuneration.grille', name: 'Grille de Rémunération' },
      { id: 'remuneration.13eme-mois', name: '13ème mois' },
      { id: 'remuneration.anciennete', name: 'Prime d\'ancienneté' },
      { id: 'remuneration.transport', name: 'Frais de transport' },
      { id: 'remuneration.repas', name: 'Indemnité de repas' },
      { id: 'remuneration.astreinte', name: 'Indemnité d\'astreinte' },
      { id: 'remuneration.majoration-dimanche', name: 'Majoration Dimanche' },
      { id: 'remuneration.majoration-ferie', name: 'Majoration Férié' },
      { id: 'remuneration.majoration-nuit', name: 'Majoration Nuit' }
    ] 
  },
  { 
    id: 'depart', 
    name: 'Départ',
    subcategories: [
      { id: 'depart.licenciement', name: 'Indemnité de Licenciement' },
      { id: 'depart.mise-retraite', name: 'Indemnité de Mise a la Retraite' },
      { id: 'depart.depart-retraite', name: 'Indemnité de Départ a la Retraite' },
      { id: 'depart.rupture-conventionnelle', name: 'Indemnité de Rupture conventionnelle' },
      { id: 'depart.preavis', name: 'Préavis' },
      { id: 'depart.precarite', name: 'Indemnité de précarité' }
    ] 
  },
  {
    id: 'cotisations',
    name: 'Cotisations',
    subcategories: [
      { id: 'cotisations.prevoyance', name: 'Cotisation prévoyance' },
      { id: 'cotisations.retraite', name: 'Cotisation retraite' },
      { id: 'cotisations.mutuelle', name: 'Cotisation mutuelle' }
    ]
  },
  {
    id: 'maintien-salaire',
    name: 'Maintien de salaire',
    subcategories: [
      { id: 'maintien-salaire.accident-travail', name: 'Accident de travail' },
      { id: 'maintien-salaire.maladie', name: 'Maladie' },
      { id: 'maintien-salaire.maternite-paternite', name: 'Maternité / Paternité' }
    ]
  }
];

export default function AdminPage() {
  const { toast } = useToast();
  
  // États
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [conventionSearchQuery, setConventionSearchQuery] = useState<string>("");
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
  
  // État pour le tri et filtrage du tableur
  const [tableSectionFilter, setTableSectionFilter] = useState<string>("");
  const [tableSortField, setTableSortField] = useState<string>("convention");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  
  // État pour le dialogue d'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ConventionSection | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [batchUpdates, setBatchUpdates] = useState<string>("");
  
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
  
  // Filtrer les conventions en fonction de la recherche
  const filteredConventions = useMemo(() => {
    if (!conventionSearchQuery.trim()) {
      return conventions;
    }
    
    const searchTerm = conventionSearchQuery.toLowerCase().trim();
    return conventions.filter(convention => 
      convention.id.toLowerCase().includes(searchTerm) || 
      convention.name.toLowerCase().includes(searchTerm)
    );
  }, [conventions, conventionSearchQuery]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Administration ConventionsAI</h1>
      
      <Tabs defaultValue="sections">
        <TabsList className="mb-4">
          <TabsTrigger value="sections">Sections des conventions</TabsTrigger>
          <TabsTrigger value="spreadsheet">Vue Tableur</TabsTrigger>
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
                  onClick={() => {
                    setIsBatchMode(false);
                    setConventionSearchQuery("");
                  }}
                >
                  Mode individuel
                </Button>
                <Button 
                  variant={isBatchMode ? "default" : "outline"}
                  onClick={() => {
                    setIsBatchMode(true);
                    setConventionSearchQuery("");
                  }}
                >
                  Mode traitement par lot
                </Button>
              </div>
              
              {!isBatchMode ? (
                // Mode individuel
                <>
                  <div className="mb-6 space-y-4">
                    <div>
                      <Label htmlFor="convention-search">Rechercher une convention (IDCC ou nom)</Label>
                      <Input
                        id="convention-search"
                        placeholder="Rechercher une convention par IDCC ou nom..."
                        value={conventionSearchQuery}
                        onChange={(e) => setConventionSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="convention-select">Sélectionner une convention</Label>
                      <Select 
                        value={selectedConventionId} 
                        onValueChange={handleConventionChange}
                      >
                        <SelectTrigger id="convention-select" className="w-full">
                          <SelectValue placeholder="Choisir une convention" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredConventions.map(convention => (
                            <SelectItem key={convention.id} value={convention.id}>
                              {convention.name} (IDCC {convention.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Input
                        placeholder="Rechercher une convention par IDCC ou nom..."
                        value={conventionSearchQuery}
                        onChange={(e) => setConventionSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
                        {filteredConventions.map(convention => (
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
                        {filteredConventions.length === 0 && (
                          <div className="py-4 text-center text-gray-500">
                            Aucune convention ne correspond à votre recherche
                          </div>
                        )}
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
        
        <TabsContent value="spreadsheet">
          <Card>
            <CardHeader>
              <CardTitle>Vue Tableur des données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="spreadsheet-search">Rechercher une convention (IDCC ou nom)</Label>
                    <Input
                      id="spreadsheet-search"
                      placeholder="Rechercher une convention..."
                      value={conventionSearchQuery}
                      onChange={(e) => setConventionSearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button 
                      onClick={async () => {
                        // Charger toutes les sections pour toutes les conventions filtrées
                        const allSectionsData: Record<string, ConventionSection[]> = {};
                        
                        // Utiliser les conventions filtrées
                        for (const convention of filteredConventions) {
                          try {
                            const response = await fetch(`/api/admin/sections/${convention.id}`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.length > 0) {
                                allSectionsData[convention.id] = data;
                              }
                            }
                          } catch (error) {
                            console.error(`Erreur lors du chargement des sections pour ${convention.id}:`, error);
                          }
                        }
                        
                        setAllSections(allSectionsData);
                        
                        toast({
                          title: "Sections chargées",
                          description: `${Object.keys(allSectionsData).length} conventions chargées.`,
                        });
                      }}
                    >
                      Charger toutes les sections
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 flex justify-between">
                <div>
                  <Label htmlFor="section-type-filter">Filtrer par type de section</Label>
                  <Select 
                    value={tableSectionFilter} 
                    onValueChange={setTableSectionFilter}
                  >
                    <SelectTrigger id="section-type-filter" className="w-[250px]">
                      <SelectValue placeholder="Tous les types de section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les types</SelectItem>
                      {SECTION_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="default"
                  onClick={() => {
                    if (selectedSections.size === 0) {
                      toast({
                        title: "Aucune section sélectionnée",
                        description: "Veuillez sélectionner au moins une section à modifier",
                      });
                      return;
                    }
                    
                    // Préparer le contenu d'édition par lot avec des commentaires pour chaque section
                    let content = "";
                    let sectionsByType: Record<string, { section: ConventionSection; convention: Convention }[]> = {};
                    
                    // Regrouper les sections par type
                    Object.entries(allSections).forEach(([conventionId, sections]) => {
                      const convention = conventions.find(c => c.id === conventionId);
                      if (!convention) return;
                      
                      sections.forEach(section => {
                        if (selectedSections.has(section.id)) {
                          const sectionType = section.sectionType;
                          if (!sectionsByType[sectionType]) {
                            sectionsByType[sectionType] = [];
                          }
                          sectionsByType[sectionType].push({ section, convention });
                        }
                      });
                    });
                    
                    // Construire le contenu par type de section
                    Object.entries(sectionsByType).forEach(([sectionType, items]) => {
                      const typeName = SECTION_TYPES.find(t => t.id === sectionType.split('.')[0])?.name || sectionType;
                      content += `\n\n/* ======== SECTION: ${typeName} ======== */\n\n`;
                      
                      items.forEach(({ section, convention }) => {
                        content += `/* CONVENTION: ${convention.name} (${convention.id}) */\n`;
                        content += `/* ID: ${section.id} */\n`;
                        content += `${section.content}\n\n`;
                        content += `/* ---------------------------------------- */\n\n`;
                      });
                    });
                    
                    setBatchUpdates(content);
                    setIsBatchEditDialogOpen(true);
                  }}
                  disabled={selectedSections.size === 0}
                >
                  Édition groupée ({selectedSections.size})
                </Button>
              </div>
              
              {Object.keys(allSections).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Sélectionner toutes les sections visibles
                                const newSet = new Set<string>();
                                Object.values(allSections).flat().forEach(section => {
                                  if (!tableSectionFilter || section.sectionType.startsWith(tableSectionFilter)) {
                                    newSet.add(section.id);
                                  }
                                });
                                setSelectedSections(newSet);
                              } else {
                                // Désélectionner tout
                                setSelectedSections(new Set());
                              }
                            }}
                            checked={
                              selectedSections.size > 0 && 
                              selectedSections.size === Object.values(allSections)
                                .flat()
                                .filter(s => !tableSectionFilter || s.sectionType.startsWith(tableSectionFilter))
                                .length
                            }
                          />
                        </TableHead>
                        <TableHead className="w-[180px]">
                          <div className="flex items-center space-x-1 cursor-pointer" 
                               onClick={() => {
                                 if (tableSortField === "convention") {
                                   setTableSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                 } else {
                                   setTableSortField("convention");
                                   setTableSortDirection("asc");
                                 }
                               }}
                          >
                            <span>Convention</span>
                            {tableSortField === "convention" && (
                              <span>{tableSortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="w-[150px]">
                          <div className="flex items-center space-x-1 cursor-pointer"
                               onClick={() => {
                                 if (tableSortField === "sectionType") {
                                   setTableSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                 } else {
                                   setTableSortField("sectionType");
                                   setTableSortDirection("asc");
                                 }
                               }}
                          >
                            <span>Type de section</span>
                            {tableSortField === "sectionType" && (
                              <span>{tableSortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                        <TableHead className="w-[150px]">
                          <div className="flex items-center space-x-1 cursor-pointer"
                               onClick={() => {
                                 if (tableSortField === "updatedAt") {
                                   setTableSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                 } else {
                                   setTableSortField("updatedAt");
                                   setTableSortDirection("desc"); // Par défaut du plus récent au plus ancien
                                 }
                               }}
                          >
                            <span>Dernière mise à jour</span>
                            {tableSortField === "updatedAt" && (
                              <span>{tableSortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Contenu</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(allSections)
                        .flatMap(([conventionId, sections]) => {
                          const convention = conventions.find(c => c.id === conventionId);
                          return sections
                            .filter(section => !tableSectionFilter || section.sectionType.startsWith(tableSectionFilter))
                            .map(section => ({
                              section,
                              conventionId,
                              conventionName: convention?.name || conventionId
                            }));
                        })
                        .sort((a, b) => {
                          if (tableSortField === "convention") {
                            return tableSortDirection === "asc" 
                              ? a.conventionName.localeCompare(b.conventionName)
                              : b.conventionName.localeCompare(a.conventionName);
                          } else if (tableSortField === "sectionType") {
                            return tableSortDirection === "asc"
                              ? a.section.sectionType.localeCompare(b.section.sectionType)
                              : b.section.sectionType.localeCompare(a.section.sectionType);
                          } else if (tableSortField === "updatedAt") {
                            const dateA = new Date(a.section.updatedAt).getTime();
                            const dateB = new Date(b.section.updatedAt).getTime();
                            return tableSortDirection === "asc" ? dateA - dateB : dateB - dateA;
                          }
                          return 0;
                        })
                        .map(({ section, conventionId, conventionName }) => (
                          <TableRow key={section.id} className={selectedSections.has(section.id) ? "bg-muted/30" : ""}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedSections.has(section.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedSections(prev => {
                                    const newSet = new Set(prev);
                                    if (checked) {
                                      newSet.add(section.id);
                                    } else {
                                      newSet.delete(section.id);
                                    }
                                    return newSet;
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {conventionName} (IDCC {conventionId})
                            </TableCell>
                            <TableCell>
                              {SECTION_TYPES.find(t => t.id === section.sectionType.split('.')[0])?.name || section.sectionType}
                              {section.sectionType.includes('.') && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {section.sectionType.split('.')[1]}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(section.status)}</TableCell>
                            <TableCell>{new Date(section.updatedAt).toLocaleString()}</TableCell>
                            <TableCell className="max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {section.content.length > 100
                                ? section.content.substring(0, 100) + "..."
                                : section.content}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSection(section)}
                              >
                                Éditer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p>Utilisez la recherche ci-dessus puis cliquez sur "Charger toutes les sections" pour afficher les données.</p>
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
      
      {/* Dialogue d'édition par lot */}
      <Dialog open={isBatchEditDialogOpen} onOpenChange={setIsBatchEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Édition groupée de {selectedSections.size} section(s)
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 flex flex-col h-full">
            <p className="text-sm text-muted-foreground mb-2">
              Les sections sont regroupées par type. Les commentaires (lignes commençant par /* */) sont pour vous aider à identifier les sections, ne les modifiez pas.
            </p>
            
            <div className="flex-1 min-h-[300px] overflow-y-auto border rounded-md">
              <Textarea
                value={batchUpdates}
                onChange={(e) => setBatchUpdates(e.target.value)}
                className="min-h-[500px] w-full font-mono"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                const sectionUpdates: Map<string, string> = new Map();
                const sections = batchUpdates.split("/* ID: ");
                
                // Ignorer la première partie (avant le premier ID)
                for (let i = 1; i < sections.length; i++) {
                  const section = sections[i];
                  const idEndIndex = section.indexOf(" */");
                  if (idEndIndex === -1) continue;
                  
                  const sectionId = section.substring(0, idEndIndex);
                  
                  // Trouver où commence et se termine le contenu réel de la section
                  const contentStartIndex = section.indexOf(" */") + 3;
                  const contentEndIndex = section.indexOf("/* ---------------------------------------- */");
                  
                  if (contentEndIndex === -1) continue;
                  
                  const content = section.substring(contentStartIndex, contentEndIndex).trim();
                  sectionUpdates.set(sectionId, content);
                }
                
                // Mettre à jour chaque section
                let successCount = 0;
                let errorCount = 0;
                
                for (const [sectionId, content] of sectionUpdates.entries()) {
                  try {
                    // Trouver la section dans allSections
                    let sectionToUpdate: ConventionSection | null = null;
                    let conventionIdForSection = "";
                    
                    for (const [conventionId, sections] of Object.entries(allSections)) {
                      const found = sections.find(s => s.id === sectionId);
                      if (found) {
                        sectionToUpdate = found;
                        conventionIdForSection = conventionId;
                        break;
                      }
                    }
                    
                    if (!sectionToUpdate) continue;
                    
                    const response = await fetch(`/api/admin/sections/${sectionId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...sectionToUpdate,
                        content: content
                      })
                    });
                    
                    if (response.ok) {
                      // Mettre à jour localement
                      setAllSections(prev => {
                        const newSections = { ...prev };
                        if (newSections[conventionIdForSection]) {
                          newSections[conventionIdForSection] = newSections[conventionIdForSection].map(s => 
                            s.id === sectionId ? { ...s, content } : s
                          );
                        }
                        return newSections;
                      });
                      
                      // Si la section est aussi dans la liste des sections de la convention sélectionnée
                      if (selectedConventionId === conventionIdForSection) {
                        setSections(prev => 
                          prev.map(s => s.id === sectionId ? { ...s, content } : s)
                        );
                      }
                      
                      successCount++;
                    } else {
                      errorCount++;
                    }
                  } catch (error) {
                    console.error(`Erreur lors de la mise à jour de la section ${sectionId}:`, error);
                    errorCount++;
                  }
                }
                
                toast({
                  title: "Mise à jour par lot terminée",
                  description: `${successCount} section(s) mise(s) à jour avec succès, ${errorCount} échec(s).`,
                  variant: errorCount > 0 ? "destructive" : "default"
                });
                
                setIsBatchEditDialogOpen(false);
                setSelectedSections(new Set());
              }}
            >
              Enregistrer toutes les modifications
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