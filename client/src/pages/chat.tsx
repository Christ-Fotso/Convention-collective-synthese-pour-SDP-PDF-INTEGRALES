import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, MessageSquare, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CATEGORIES } from "@/lib/categories";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";
import { ChatConventionDialog } from "@/components/chat-convention-dialog";

// Types
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

// Composant pour afficher une section individuelle
interface SectionContentProps {
  section: SectionType;
  conventionId: string;
  isActive: boolean;
}

function SectionContent({ section, conventionId, isActive }: SectionContentProps) {
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  
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
      id={`section-${section.sectionType}`}
      className={`border rounded-lg p-6 transition-all duration-300 ${
        isActive 
          ? "border-green-500 border-2 shadow-lg" 
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
  const [visibleSection, setVisibleSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isChatDialogOpen, setIsChatDialogOpen] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Requête pour obtenir les informations sur la convention
  const { data: convention, isLoading: isLoadingConvention } = useQuery({
    queryKey: ["convention", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/api/conventions`);
      const conventions = response.data;
      
      let foundConvention = conventions.find((c: Convention) => c.id === id);
      
      if (!foundConvention && id.includes('%')) {
        try {
          const decodedName = decodeURIComponent(id);
          foundConvention = conventions.find((c: Convention) => c.name === decodedName);
        } catch (e) {
          console.error("Erreur lors du décodage du nom de convention:", e);
        }
      }
      
      if (!foundConvention && !id.includes('%')) {
        foundConvention = conventions.find((c: Convention) => !c.id && c.name === id);
      }
      
      return foundConvention || null;
    },
    staleTime: 1000 * 60 * 5
  });
  
  // Requête pour obtenir les types de sections disponibles
  const { data: sectionTypes, isLoading: isLoadingSections } = useQuery({
    queryKey: ["section-types", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await axios.get(`/api/convention/${id}/section-types`);
      return response.data.map((type: string) => {
        const [backendCategory, backendSubcategory] = type.split(".");
        
        let displayCategory = backendCategory;
        let displaySubcategory = backendSubcategory;
        
        if (backendCategory === "protection-sociale" && ["prevoyance", "retraite", "mutuelle"].includes(backendSubcategory)) {
          displayCategory = "cotisations";
        } else if (backendCategory === "formation" && backendSubcategory === "contributions") {
          displayCategory = "cotisations";
          displaySubcategory = "formation";
        } else if (backendCategory === "divers" && backendSubcategory === "paritarisme") {
          displayCategory = "cotisations";
          displaySubcategory = "paritarisme";
        }
        
        return {
          sectionType: type,
          label: type,
          category: displayCategory,
          subcategory: displaySubcategory
        };
      });
    },
    staleTime: 1000 * 60 * 5
  });

  // Effet pour charger automatiquement la section "informations-generales"
  useEffect(() => {
    if (sectionTypes && sectionTypes.length > 0 && !visibleSection) {
      const generalInfoSection = sectionTypes.find((section: SectionType) => 
        section.sectionType === "informations-generales.generale");
      
      if (generalInfoSection) {
        console.log("Sélection automatique de la section Informations générales");
        setVisibleSection(generalInfoSection.sectionType);
      }
    }
  }, [sectionTypes, visibleSection]);

  // Effet pour détecter la section visible lors du défilement
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (!sectionTypes) return;
      
      const scrollTop = window.scrollY;
      
      // Afficher/masquer le bouton "Retour en haut"
      setShowScrollToTop(scrollTop > 300);
      
      // Délai pour éviter les conflits avec les clics manuels
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        
        for (const section of sectionTypes) {
          const element = document.getElementById(`section-${section.sectionType}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementBottom = elementTop + rect.height;
            
            if (elementTop <= scrollTop + windowHeight * 0.3 && elementBottom >= scrollTop + windowHeight * 0.3) {
              if (visibleSection !== section.sectionType) {
                setVisibleSection(section.sectionType);
              }
              break;
            }
          }
        }
      }, 100); // Délai de 100ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [sectionTypes, visibleSection]);

  // Fonction pour faire défiler vers une section
  const scrollToSection = (sectionType: string) => {
    // Définir immédiatement la section visible
    setVisibleSection(sectionType);
    
    const element = document.getElementById(`section-${sectionType}`);
    if (element) {
      // Calculer la hauteur réelle de l'en-tête fixe
      const stickyHeader = document.querySelector('.sticky');
      const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height + 30 : 170;
      
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Fonction pour faire défiler vers le titre d'une section (pour les catégories principales)
  const scrollToSectionTitle = (sectionType: string) => {
    // Définir immédiatement la section visible
    setVisibleSection(sectionType);
    
    const element = document.getElementById(`section-${sectionType}`);
    if (element) {
      // Calculer la hauteur réelle de l'en-tête fixe avec plus d'espace
      const stickyHeader = document.querySelector('.sticky');
      const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height + 80 : 220;
      
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Fonction pour retourner en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="w-full py-6 space-y-6 px-4 lg:px-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux conventions
          </Button>
          <h1 className="text-2xl font-bold">
            {isLoadingConvention ? (
              <Skeleton className="h-8 w-64" />
            ) : convention ? (
              convention.name
            ) : (
              "Convention non trouvée"
            )}
          </h1>
        </div>
        

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
          {/* Navigation horizontale fixe en haut */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b shadow-sm">
            <Card className="border-l-0 border-r-0 border-t-0 rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Sections disponibles</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Rechercher une section..."
                        className="w-full p-2 pr-8 text-sm border rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                    {convention && (
                      <Button 
                        variant="default" 
                        onClick={() => setIsChatDialogOpen(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Poser une question
                      </Button>
                    )}
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
                ) : sectionTypes && sectionTypes.length > 0 ? (
                  <div className="space-y-3">
                    {/* Navigation par catégories principales */}
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((categoryDefinition, categoryIndex) => {
                        const category = categoryDefinition.id;
                        
                        const categorySections = sectionTypes.filter((section: SectionType) => 
                          section.category === category
                        );
                        
                        if (categorySections.length === 0) return null;
                        
                        const isCategoryVisible = categorySections.some((section: SectionType) => 
                          visibleSection === section.sectionType
                        );
                        
                        const isCategoryExpanded = expandedCategory === category;
                        
                        return (
                          <Button
                            key={categoryIndex}
                            variant={isCategoryVisible ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap flex items-center gap-1"
                            onClick={() => {
                              if (isCategoryExpanded) {
                                setExpandedCategory(null);
                              } else {
                                setExpandedCategory(category);
                                // Aller automatiquement au titre de la première sous-section
                                const firstSection = categorySections[0];
                                if (firstSection) {
                                  setTimeout(() => {
                                    scrollToSectionTitle(firstSection.sectionType);
                                  }, 50); // Petit délai pour laisser le temps à l'expansion
                                }
                              }
                            }}
                          >
                            {categoryDefinition.name}
                            {isCategoryExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        );
                      })}
                    </div>
                    
                    {/* Sous-catégories étendues */}
                    {expandedCategory && expandedCategory !== "informations-generales" && (
                      <div className="border-t pt-3">
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const categoryDef = CATEGORIES.find(cat => cat.id === expandedCategory);
                            if (!categoryDef) return null;
                            
                            const categorySections = sectionTypes.filter((section: SectionType) => 
                              section.category === expandedCategory
                            );
                            
                            return categoryDef.subcategories.map((subcategoryDef) => {
                              const section = categorySections.find((s: SectionType) => s.subcategory === subcategoryDef.id);
                              if (!section) return null;
                              
                              return (
                                <Button
                                  key={section.sectionType}
                                  variant={visibleSection === section.sectionType ? "default" : "outline"}
                                  size="sm"
                                  className={`whitespace-nowrap text-xs transition-colors duration-200 ${
                                    visibleSection === section.sectionType 
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                      : "bg-orange-50 border-orange-200 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                  }`}
                                  onClick={() => scrollToSection(section.sectionType)}
                                >
                                  {subcategoryDef.name}
                                </Button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    Aucune section disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal avec défilement continu */}
          <div ref={contentRef} className="space-y-8 pt-4">
            {sectionTypes && sectionTypes.length > 0 ? (
              <>
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
        </div>
      )}
      
      {/* Bouton "Retour en haut" fixe */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-20 rounded-full w-12 h-12 shadow-lg bg-green-600 hover:bg-green-700 text-white"
          size="icon"
          title="Retour en haut"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
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