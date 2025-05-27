import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, BookOpen, MessageSquare } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CATEGORIES } from "@/lib/categories";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { MarkdownTableWrapper } from "@/components/markdown-table-wrapper";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";
import { ChatConventionDialog } from "@/components/chat-convention-dialog";

// Mapping entre les catégories backend et catégories d'affichage
const CATEGORY_MAPPING: Record<string, string> = {
  "protection-sociale": "cotisations",
  "protection-sociale.prevoyance": "cotisations.prevoyance",
  "protection-sociale.retraite": "cotisations.retraite", 
  "protection-sociale.mutuelle": "cotisations.mutuelle",
  "formation.contributions": "cotisations.formation",
  "divers.paritarisme": "cotisations.paritarisme"
};

// Types simplifiés
interface Convention {
  id: string;
  name: string;
}

interface SectionType {
  sectionType: string;
  label: string;
  category: string;
  subcategory: string;
}

// Fonction utilitaire pour convertir "category.subcategory" en label lisible
function getSectionLabel(sectionType: string): string {
  const [category, subcategory] = sectionType.split(".");
  
  if (!category || !subcategory) {
    return sectionType;
  }
  
  // Formatage simple du texte
  const formatCategory = (text: string) => {
    return text
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  return `${formatCategory(category)} - ${formatCategory(subcategory)}`;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState<boolean>(false);
  
  // Requête pour obtenir les informations sur la convention
  const { data: convention, isLoading: isLoadingConvention } = useQuery({
    queryKey: ["convention", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/api/conventions`);
      const conventions = response.data;
      
      // Chercher d'abord par IDCC
      let foundConvention = conventions.find((c: Convention) => c.id === id);
      
      // Si pas trouvé et que l'id semble être un nom encodé (contient des %)
      if (!foundConvention && id.includes('%')) {
        try {
          const decodedName = decodeURIComponent(id);
          console.log("Recherche par nom décodé:", decodedName);
          foundConvention = conventions.find((c: Convention) => c.name === decodedName);
        } catch (e) {
          console.error("Erreur lors du décodage du nom de convention:", e);
        }
      }
      
      // Pour les conventions sans IDCC explicite (id="")
      if (!foundConvention && !id.includes('%')) {
        foundConvention = conventions.find((c: Convention) => !c.id && c.name === id);
      }
      
      return foundConvention || null;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Requête pour obtenir les types de sections disponibles
  const { data: sectionTypes, isLoading: isLoadingSections } = useQuery({
    queryKey: ["section-types", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await axios.get(`/api/convention/${id}/section-types`);
      return response.data.map((type: string) => {
        // Vérifier si on doit remapper cette section
        let mappedType = type;
        if (CATEGORY_MAPPING[type]) {
          mappedType = CATEGORY_MAPPING[type];
        }
        
        const [backendCategory, backendSubcategory] = type.split(".");
        
        // Définir la catégorie et sous-catégorie d'affichage
        let displayCategory = backendCategory;
        let displaySubcategory = backendSubcategory;
        
        // Appliquer le mapping spécifique pour les sections de protection sociale à cotisations
        if (backendCategory === "protection-sociale" && ["prevoyance", "retraite", "mutuelle"].includes(backendSubcategory)) {
          displayCategory = "cotisations";
          displaySubcategory = backendSubcategory;
        }
        // Appliquer le mapping pour formation.contributions -> cotisations.formation
        else if (backendCategory === "formation" && backendSubcategory === "contributions") {
          displayCategory = "cotisations";
          displaySubcategory = "formation";
        }
        // Appliquer le mapping pour divers.paritarisme -> cotisations.paritarisme
        else if (backendCategory === "divers" && backendSubcategory === "paritarisme") {
          displayCategory = "cotisations";
          displaySubcategory = "paritarisme";
        }
        // le reste reste inchangé
        
        return {
          sectionType: type, // Type de section original pour les appels API
          label: getSectionLabel(type),
          category: displayCategory,
          subcategory: displaySubcategory
        };
      });
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Requête pour obtenir le contenu d'une section
  const { data: sectionContent, isLoading: isLoadingSectionContent } = useQuery({
    queryKey: ["section-content", id, selectedSection?.sectionType],
    queryFn: async () => {
      if (!id || !selectedSection) return null;
      
      // L'API attend le sectionType complet, pas séparé par catégorie/sous-catégorie
      const response = await axios.get(`/api/convention/${id}/section/${selectedSection.sectionType}`);
      return response.data;
    },
    enabled: !!selectedSection,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Effet pour déplier automatiquement la catégorie lorsqu'une section est sélectionnée
  useEffect(() => {
    if (selectedSection) {
      setExpandedCategory(selectedSection.category);
    }
  }, [selectedSection]);
  
  // Effet pour charger automatiquement la section "informations-generales" lorsque la page est chargée
  useEffect(() => {
    if (sectionTypes && sectionTypes.length > 0 && !selectedSection) {
      // Chercher la section d'informations générales
      const generalInfoSection = sectionTypes.find((section: SectionType) => 
        section.sectionType === "informations-generales.generale");
      
      if (generalInfoSection) {
        console.log("Sélection automatique de la section Informations générales");
        setSelectedSection(generalInfoSection);
      }
    }
  }, [sectionTypes, selectedSection]);
  
  return (
    <div className="max-w-7xl mx-auto p-5">
      {/* En-tête de la convention avec style moderne */}
      {convention && (
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-8 rounded-xl mb-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20"
                title="Retour à la liste des conventions"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-semibold">
                {isLoadingConvention ? (
                  <Skeleton className="h-8 w-64 bg-white/20" />
                ) : (
                  convention.name
                )}
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setIsChatDialogOpen(true)}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Poser une question
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <div className="bg-white/20 px-4 py-2 rounded-lg text-sm">
              Code IDCC: <span className="font-medium">{convention.id}</span>
              <span className="opacity-80 text-xs ml-4">MAJ : 26 mai 2025</span>
            </div>
          </div>
        </header>
      )}

      {!isLoadingConvention && !convention && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            La convention collective demandée n'a pas été trouvée.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Navigation par sections avec style moderne */}
      {convention && (
        <nav className="bg-white rounded-xl p-4 mb-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-center text-slate-700">
            Sections disponibles
          </h3>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {isLoadingSections ? (
              <div className="flex gap-3 flex-wrap justify-center">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
              </div>
            ) : (
              sectionTypes?.map((section: SectionType, index: number) => {
                const categoryData = CATEGORIES.find(cat => cat.id === section.category);
                const subcategoryData = categoryData?.subcategories.find(sub => sub.id === section.subcategory);
                const displayLabel = subcategoryData ? `${categoryData?.name} - ${subcategoryData.name}` : section.label;
                
                return (
                  <button 
                    key={index}
                    onClick={() => setSelectedSection(section)}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center text-sm font-medium min-w-40 border-2 ${
                      selectedSection?.sectionType === section.sectionType
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg transform -translate-y-0.5'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-lg'
                    }`}
                  >
                    {displayLabel}
                  </button>
                );
              })
            )}
          </div>
        </nav>
      )}

      {convention && (
        <div className="grid grid-cols-1 gap-6">
          {/* Zone de contenu principal */}
          <Card>
            <CardContent>
              {isLoadingSections ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-260px)]">
                  {sectionTypes && sectionTypes.length > 0 ? (
                    <div className="space-y-6">
                      {(() => {
                        // On regroupe d'abord les sections par catégorie
                        const groupedSections: Record<string, SectionType[]> = {};
                        
                        // Filtrer les sections selon le terme de recherche (si présent)
                        const filteredSections = searchTerm.trim() !== '' 
                          ? sectionTypes.filter((section: SectionType) => {
                              // Trouver le nom de la catégorie et de la sous-catégorie
                              const categoryDef = CATEGORIES.find(cat => cat.id === section.category);
                              if (!categoryDef) return false;
                              
                              const subcategoryDef = categoryDef.subcategories.find(sub => sub.id === section.subcategory);
                              if (!subcategoryDef) return false;
                              
                              // Rechercher dans les noms de catégorie et sous-catégorie
                              const searchLower = searchTerm.toLowerCase();
                              return categoryDef.name.toLowerCase().includes(searchLower) || 
                                     subcategoryDef.name.toLowerCase().includes(searchLower);
                            })
                          : sectionTypes;
                        
                        // Parcours de toutes les sections filtrées pour les regrouper
                        filteredSections.forEach((section: SectionType) => {
                          if (!groupedSections[section.category]) {
                            groupedSections[section.category] = [];
                          }
                          groupedSections[section.category].push(section);
                        });
                        
                        // Créer les éléments JSX pour chaque catégorie, dans l'ordre défini par CATEGORIES
                        const categoryElements: JSX.Element[] = [];
                        
                        // D'abord, gérer séparément la section "Informations générales" si elle existe
                        const infoGenerales = filteredSections.find(section => 
                          section.category === "informations-generales" && section.subcategory === "generale"
                        );
                        
                        if (infoGenerales) {
                          // Ajouter la section Informations générales avec le même format qu'une catégorie
                          categoryElements.push(
                            <div key="info-gen" className="mb-3">
                              <h3 
                                className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400 border-b pb-1 flex justify-between items-center"
                              >
                                <span>Informations générales</span>
                              </h3>
                              <div 
                                className={`p-2 border rounded-md cursor-pointer text-sm ${
                                  selectedSection?.sectionType === infoGenerales.sectionType
                                    ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600 font-medium"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-900/20"
                                }`}
                                onClick={() => setSelectedSection(infoGenerales)}
                              >
                                Présentation de la convention
                              </div>
                            </div>
                          );
                        }
                        
                        // Utiliser l'ordre des catégories défini dans CATEGORIES pour les autres
                        CATEGORIES.forEach((categoryDefinition, categoryIndex) => {
                          const category = categoryDefinition.id;
                          
                          // Ignorer la catégorie informations-generales car déjà traitée séparément
                          if (category === "informations-generales") {
                            return;
                          }
                          
                          // Vérifier si la catégorie existe dans les données
                          if (!groupedSections[category]) {
                            return; // Passer à la catégorie suivante
                          }
                          
                          const sections = groupedSections[category];
                          const sectionElements: JSX.Element[] = [];
                          
                          // Pour chaque sous-catégorie dans l'ordre défini
                          categoryDefinition.subcategories.forEach((subcategoryDefinition, subcategoryIndex) => {
                            // Trouver la section correspondante
                            const section = sections.find(s => s.subcategory === subcategoryDefinition.id);
                            
                            if (section) {
                              sectionElements.push(
                                <div
                                  key={`${categoryIndex}-${subcategoryIndex}`}
                                  className={`p-2 border rounded-md cursor-pointer text-xs ${
                                    selectedSection?.sectionType === section.sectionType
                                      ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-900/20"
                                  }`}
                                  onClick={() => setSelectedSection(section)}
                                >
                                  {subcategoryDefinition.name}
                                </div>
                              );
                            }
                          });
                          
                          // N'ajouter la catégorie que si elle contient des sections
                          if (sectionElements.length > 0) {
                            const isCategoryExpanded = expandedCategory === category;
                            categoryElements.push(
                              <div key={categoryIndex} className="mb-3">
                                <h3 
                                  className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400 border-b pb-1 flex justify-between items-center cursor-pointer"
                                  onClick={() => setExpandedCategory(isCategoryExpanded ? null : category)}
                                >
                                  <span>{categoryDefinition.name}</span>
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </h3>
                                {isCategoryExpanded && (
                                  <div className="grid grid-cols-1 gap-2 animate-in fade-in-50 duration-150 pr-2">
                                    {sectionElements}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        });
                        
                        return categoryElements;
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Aucune section disponible
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Colonne de droite: Aperçu du contenu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {selectedSection ? (
                  <div className="flex justify-between items-center">
                    <span>
                      {(() => {
                        // Récupérer des noms formatés à partir de CATEGORIES
                        const categoryData = CATEGORIES.find(cat => cat.id === selectedSection.category);
                        if (categoryData) {
                          const subcategoryData = categoryData.subcategories.find(subcat => subcat.id === selectedSection.subcategory);
                          if (subcategoryData) {
                            return `${categoryData.name} - ${subcategoryData.name}`;
                          }
                        }
                        return selectedSection.label;
                      })()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Route pour la page complète
                        const [category, subcategory] = selectedSection.sectionType.split(".");
                        navigate(`/convention/${id}/section/${category}/${subcategory}`);
                      }}
                      className="orange-button"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M9 8h7" />
                          <path d="M8 12h8" />
                          <path d="M11 16h5" />
                        </svg>
                        Affichage plein écran <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Aperçu du contenu
                  </div>
                )}
              </CardTitle>
              {!selectedSection && (
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Sélectionnez une section dans le menu de gauche
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-260px)]">
                {!selectedSection ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                        <line x1="20" x2="10" y1="12" y2="12"></line>
                        <line x1="20" x2="20" y1="12" y2="20"></line>
                        <line x1="20" x2="20" y1="12" y2="4"></line>
                        <polyline points="10 18 4 12 10 6"></polyline>
                      </svg>
                    </div>
                    <div className="font-medium text-lg">Aucune section sélectionnée</div>
                    <p className="text-sm max-w-md text-center">
                      Veuillez sélectionner une section dans le menu à gauche pour afficher son contenu
                    </p>
                  </div>
                ) : isLoadingSectionContent ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none prose-sm enhanced-table-container" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
                    {/* Afficher la réponse brute en cas de problème */}
                    {sectionContent ? (
                      <>
                        {hasDispositifLegal(selectedSection?.sectionType || "") && (
                          <div className="mb-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs flex items-center orange-button hover:bg-orange-100 hover:text-orange-800"
                              onClick={() => setIsLegalDialogOpen(true)}
                            >
                              <BookOpen className="h-3.5 w-3.5 mr-1" />
                              Voir le dispositif légal
                            </Button>
                            
                            <DispositifLegalDialog 
                              isOpen={isLegalDialogOpen}
                              setIsOpen={setIsLegalDialogOpen}
                              title={selectedSection?.label || "Dispositif légal"}
                              content={getDispositifLegal(selectedSection?.sectionType || "")}
                            />
                          </div>
                        )}
                        {/* Ajout d'une classe pour le défilement avec barre orange */}
                        <div className="enhanced-table-container relative">
                          <MarkdownTableRendererEnhanced 
                            content={sectionContent.content || "*Aucun contenu disponible pour cette section*"} 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-red-500">
                        <p>Aucune donnée reçue de l'API.</p>
                        <p>Vérifiez les paramètres de la requête ou consultez les logs serveur.</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Dialog de chat */}
      {convention && (
        <ChatConventionDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          conventionId={id || ""}
          conventionName={convention.name}
        />
      )}
    </div>
  );
}