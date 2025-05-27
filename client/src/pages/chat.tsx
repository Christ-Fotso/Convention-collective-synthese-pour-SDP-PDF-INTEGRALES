import { useEffect, useState, useRef } from "react";
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

// Composant pour afficher une section individuelle
interface SectionContentProps {
  section: SectionType;
  conventionId: string;
  isActive: boolean;
}

function SectionContent({ section, conventionId, isActive }: SectionContentProps) {
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Requête pour obtenir le contenu de cette section
  const { data: sectionContent, isLoading } = useQuery({
    queryKey: ["section-content", conventionId, section.sectionType],
    queryFn: async () => {
      const response = await axios.get(`/api/convention/${conventionId}/section/${section.sectionType}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Trouver le nom de la section depuis CATEGORIES
  const getSectionName = () => {
    if (section.category === "informations-generales") {
      return "Informations générales";
    }
    
    const categoryDef = CATEGORIES.find(cat => cat.id === section.category);
    if (categoryDef) {
      const subcategoryDef = categoryDef.subcategories.find(sub => sub.id === section.subcategory);
      if (subcategoryDef) {
        return subcategoryDef.name;
      }
    }
    return section.label;
  };

  return (
    <div 
      ref={sectionRef}
      id={`section-${section.sectionType}`}
      className={`border rounded-lg p-6 transition-all duration-300 ${
        isActive 
          ? "border-green-500 bg-green-50 dark:bg-green-900/10 shadow-lg" 
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <h3 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">
        {getSectionName()}
      </h3>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : sectionContent ? (
        <>
          {hasDispositifLegal(section.sectionType) && (
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
                title={getSectionName()}
                content={getDispositifLegal(section.sectionType)}
              />
            </div>
          )}
          <div className="prose dark:prose-invert max-w-none prose-sm">
            <MarkdownTableRendererEnhanced 
              content={sectionContent.content || "*Aucun contenu disponible pour cette section*"} 
            />
          </div>
        </>
      ) : (
        <div className="text-red-500">
          <p>Aucune donnée disponible pour cette section.</p>
        </div>
      )}
    </div>
  );
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
  const [visibleSection, setVisibleSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
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
        setVisibleSection(generalInfoSection.sectionType);
      }
    }
  }, [sectionTypes, selectedSection]);

  // Effet pour détecter la section visible lors du défilement
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionTypes || !contentRef.current) return;
      
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Trouver quelle section est actuellement visible
      for (const section of sectionTypes) {
        const element = document.getElementById(`section-${section.sectionType}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrollTop;
          const elementBottom = elementTop + rect.height;
          
          // Une section est considérée comme visible si elle occupe au moins 30% de l'écran
          if (elementTop <= scrollTop + windowHeight * 0.3 && elementBottom >= scrollTop + windowHeight * 0.3) {
            if (visibleSection !== section.sectionType) {
              setVisibleSection(section.sectionType);
              setSelectedSection(section);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionTypes, visibleSection]);

  // Fonction pour faire défiler vers une section
  const scrollToSection = (sectionType: string) => {
    const element = document.getElementById(`section-${sectionType}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Retour à la liste des conventions">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isLoadingConvention ? (
              <Skeleton className="h-8 w-64" />
            ) : convention ? (
              `Convention collective: ${convention.name}`
            ) : (
              "Convention non trouvée"
            )}
          </h1>
        </div>
        
        {convention && (
          <Button 
            variant="default" 
            onClick={() => setIsChatDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquare className="h-4 w-4" />
            Poser une question
          </Button>
        )}
      </div>
      
      {!isLoadingConvention && !convention && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            La convention collective demandée n'a pas été trouvée.
          </AlertDescription>
        </Alert>
      )}
      
      {convention && (
        <div className="space-y-6">
          {/* Navigation horizontale en haut */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Sections disponibles</CardTitle>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Rechercher une section..."
                    className="w-full p-2 pr-8 text-sm border rounded-md"
                    onChange={(e) => {
                      // Stocker la valeur de recherche dans un état local
                      const value = e.target.value;
                      setSearchTerm(value);
                      
                      // Si une recherche est active, déplier toutes les catégories
                      if (value.trim() !== '') {
                        // Rechercher les catégories qui contiennent des résultats correspondant à la recherche
                        const matchingCategories = sectionTypes
                          .filter((section: SectionType) => {
                            const categoryDef = CATEGORIES.find(cat => cat.id === section.category);
                            if (!categoryDef) return false;
                            
                            const subcategoryDef = categoryDef.subcategories.find(sub => sub.id === section.subcategory);
                            if (!subcategoryDef) return false;
                            
                            const searchLower = value.toLowerCase();
                            return categoryDef.name.toLowerCase().includes(searchLower) || 
                                   subcategoryDef.name.toLowerCase().includes(searchLower);
                          })
                          .map(section => section.category);
                        
                        // Si on trouve une correspondance, définir cette catégorie comme dépliée
                        if (matchingCategories.length > 0) {
                          // Prendre uniquement la première catégorie trouvée pour ne pas tout déplier
                          setExpandedCategory(matchingCategories[0]);
                        }
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSections ? (
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionTypes && sectionTypes.length > 0 ? (
                    <div>
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
                        const infoGenerales = filteredSections.find((section: SectionType) => 
                          section.category === "informations-generales" && section.subcategory === "generale"
                        );
                        
                        // First, create horizontal navigation for "Informations générales"
                        if (infoGenerales) {
                          categoryElements.push(
                            <Button
                              key="info-gen"
                              variant={visibleSection === infoGenerales.sectionType ? "default" : "outline"}
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => scrollToSection(infoGenerales.sectionType)}
                            >
                              Informations générales
                            </Button>
                          );
                        }
                        
                        // Create horizontal navigation for categories
                        CATEGORIES.forEach((categoryDefinition, categoryIndex) => {
                          const category = categoryDefinition.id;
                          
                          // Skip informations-generales as it's handled separately
                          if (category === "informations-generales") return;
                          
                          if (!groupedSections[category]) return;
                          
                          const sections = groupedSections[category];
                          
                          // Check if any section in this category is currently visible
                          const isCategoryVisible = sections.some((section: SectionType) => 
                            visibleSection === section.sectionType
                          );
                          
                          categoryElements.push(
                            <Button
                              key={categoryIndex}
                              variant={isCategoryVisible ? "default" : "outline"}
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => {
                                // Scroll to first section of this category
                                const firstSection = sections[0];
                                if (firstSection) {
                                  scrollToSection(firstSection.sectionType);
                                }
                              }}
                            >
                              {categoryDefinition.name}
                            </Button>
                          );
                        });
                        
                        return (
                          <div className="space-y-4">
                            {/* Main category navigation */}
                            <div className="flex flex-wrap gap-2">
                              {categoryElements}
                            </div>
                            

                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Aucune section disponible
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Contenu principal en pleine largeur */}
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
              {isLoadingSections ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div ref={contentRef} className="space-y-8">
                  {sectionTypes && sectionTypes.length > 0 ? (
                    <>
                      {/* Afficher toutes les sections avec leur contenu */}
                      {/* Commencer par "Informations générales" */}
                      {(() => {
                        const infoGenerales = sectionTypes.find((section: SectionType) => 
                          section.category === "informations-generales" && section.subcategory === "generale"
                        );
                        
                        return infoGenerales ? (
                          <SectionContent 
                            key="info-gen"
                            section={infoGenerales}
                            conventionId={id || ""}
                            isActive={visibleSection === infoGenerales.sectionType}
                          />
                        ) : null;
                      })()}
                      
                      {/* Afficher les autres sections par catégorie */}
                      {CATEGORIES.map((categoryDefinition) => {
                        const category = categoryDefinition.id;
                        
                        if (category === "informations-generales") return null;
                        
                        const categorySections = sectionTypes.filter((section: SectionType) => 
                          section.category === category
                        );
                        
                        if (categorySections.length === 0) return null;
                        
                        return (
                          <div key={category}>
                            {/* Titre de catégorie */}
                            <div className="border-t pt-6">
                              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                                {categoryDefinition.name}
                              </h2>
                            </div>
                            
                            {/* Sous-sections dans l'ordre défini */}
                            <div className="space-y-6">
                              {categoryDefinition.subcategories.map((subcategoryDef) => {
                                const section = categorySections.find((s: SectionType) => s.subcategory === subcategoryDef.id);
                                if (!section) return null;
                                
                                return (
                                  <SectionContent 
                                    key={section.sectionType}
                                    section={section}
                                    conventionId={id || ""}
                                    isActive={visibleSection === section.sectionType}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Aucune section disponible
                    </div>
                  )}
                </div>
              )}
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