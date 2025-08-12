import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, MessageSquare, ChevronUp, ChevronDown, ChevronRight, Search } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CATEGORIES } from "@/lib/categories";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";
import { HtmlTestViewer } from "@/components/html-test-viewer";
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
          {getSectionName()}
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs flex items-center"
          onClick={() => window.open(`/convention/${conventionId}/section/${section.sectionType}`, '_blank')}
        >
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          Page complète
        </Button>
      </div>
      
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
          <HtmlTestViewer 
            conventionId={conventionId}
            sectionType={section.sectionType}
          />
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
    <div className="w-full space-y-6">
      <div className="px-4 lg:px-0 py-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux conventions
        </Button>
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
          {/* Barre de chat IA en haut */}
          <div className="mb-4">
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Assistant IA spécialisé</h3>
                      <p className="text-sm text-green-600">Posez vos questions sur cette convention collective</p>
                    </div>
                  </div>
                  {convention && (
                    <Button 
                      onClick={() => setIsChatDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      Démarrer une conversation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre de navigation avec nom de convention et navigation */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b shadow-sm">
            <div className="px-6 py-4 space-y-3">
              {/* Première ligne: Nom de la convention et recherche */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {isLoadingConvention ? (
                      <Skeleton className="h-6 w-64" />
                    ) : convention ? (
                      convention.name
                    ) : (
                      "Convention non trouvée"
                    )}
                  </h1>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans cette convention..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Deuxième ligne: Navigation par onglets */}
              <div className="flex justify-center">
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {isLoadingSections ? (
                    <>
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </>
                  ) : sectionTypes && sectionTypes.length > 0 ? (
                    <>
                      {CATEGORIES.map((categoryDefinition, categoryIndex) => {
                        const category = categoryDefinition.id;
                        
                        const categorySections = sectionTypes.filter((section: SectionType) => 
                          section.category === category
                        );
                        
                        if (categorySections.length === 0) return null;
                        
                        const isCategoryVisible = categorySections.some((section: SectionType) => 
                          visibleSection === section.sectionType
                        );
                        
                        return (
                          <Button
                            key={categoryIndex}
                            variant={isCategoryVisible ? "default" : "ghost"}
                            size="sm"
                            className={`whitespace-nowrap transition-all duration-200 border-0 ${
                              isCategoryVisible 
                                ? "bg-green-600 text-white hover:bg-green-700 shadow-sm" 
                                : "bg-white text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            onClick={() => {
                              // Aller directement à la première section de cette catégorie
                              const firstSection = categorySections[0];
                              if (firstSection) {
                                scrollToSectionTitle(firstSection.sectionType);
                              }
                            }}
                          >
                            {categoryDefinition.name}
                          </Button>
                        );
                      })}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
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