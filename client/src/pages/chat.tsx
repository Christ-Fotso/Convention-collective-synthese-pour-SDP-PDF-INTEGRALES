import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, MessageSquare, ChevronUp, Search, X, Calendar } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CATEGORIES } from "@/lib/categories";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { MarkdownTableRendererEnhanced } from "@/components/markdown-table-renderer-enhanced";
import { HtmlTestViewer } from "@/components/html-test-viewer";
import { ChatAssistantPanel } from "@/components/chat-assistant-panel";
import { SearchDialog } from "@/components/search-dialog";
import { GLOBAL_CONFIG } from "@/lib/constants";

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
      className={`border rounded-lg p-1 transition-all duration-300 ${
        isActive 
          ? "border-green-500 border-2 shadow-lg" 
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="mb-1 flex justify-between items-start gap-2">
        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex-1">
          {getSectionName()}
        </h3>
        {hasDispositifLegal(section.sectionType) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsLegalDialogOpen(true)}
            className="flex items-center gap-2 orange-button flex-shrink-0"
          >
            <BookOpen className="h-4 w-4" />
            Voir le dispositif légal
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : sectionContent ? (
        <>

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
      
      {/* Modale du dispositif légal */}
      {hasDispositifLegal(section.sectionType) && (
        <DispositifLegalDialog
          isOpen={isLegalDialogOpen}
          setIsOpen={setIsLegalDialogOpen}
          title={`Dispositif légal - ${getSectionName()}`}
          content={getDispositifLegal(section.sectionType)}
        />
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
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
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
        } else if (backendCategory === "protection-sociale" && ["accident-travail", "maladie", "maternite-paternite"].includes(backendSubcategory)) {
          displayCategory = "maintien-salaire";
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
    <div className="w-full space-y-1">

      
      {!isLoadingConvention && !convention && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            La convention collective demandée n'a pas été trouvée.
          </AlertDescription>
        </Alert>
      )}
      
      {convention && (
        <div className="flex">
          {/* Sidebar gauche responsive pour les sous-sections */}
          {expandedCategory && expandedCategory !== "informations-generales" && (
            <>
              {/* Overlay pour mobile */}
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                onClick={() => setExpandedCategory(null)}
              />
              
              {/* Sidebar */}
              <div className="w-64 md:w-56 bg-gray-50 border-r border-gray-200 min-h-screen fixed left-0 top-0 z-40 md:z-20 pt-4 transform md:transform-none transition-transform duration-300 ease-in-out">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-700 text-sm">
                      {CATEGORIES.find(cat => cat.id === expandedCategory)?.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      onClick={() => setExpandedCategory(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-screen overflow-y-auto pb-20">
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
                          <button
                            key={section.sectionType}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                              visibleSection === section.sectionType 
                                ? "bg-green-600 text-white shadow-sm" 
                                : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                            }`}
                            onClick={() => {
                              scrollToSectionTitle(section.sectionType);
                              // Fermer la sidebar sur mobile après sélection
                              if (window.innerWidth < 768) {
                                setExpandedCategory(null);
                              }
                            }}
                          >
                            {subcategoryDef.name}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Contenu principal avec marge gauche conditionnelle et responsive */}
          <div className={`flex-1 space-y-1 transition-all duration-300 ${
            expandedCategory && expandedCategory !== "informations-generales" ? "md:ml-56" : ""
          }`}>

          {/* Barre de navigation avec nom de convention et navigation */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b shadow-sm">
            <div className="px-2 py-2 space-y-2">
              {/* Première ligne: Nom de la convention et assistant IA */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {isLoadingConvention ? (
                      <Skeleton className="h-6 w-64" />
                    ) : convention ? (
                      convention.name
                    ) : (
                      "Convention non trouvée"
                    )}
                  </h1>
                  {convention && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Dernière mise à jour : {GLOBAL_CONFIG.LAST_UPDATE_DATE}</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => setIsChatDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  size="default"
                >
                  <MessageSquare className="h-4 w-4" />
                  Poser une question à l'assistant IA
                </Button>
              </div>
              
              {/* Deuxième ligne: Retour + Recherche + Navigation par onglets */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors px-3 py-2 border-blue-300 bg-blue-50/50"
                  title="Retour à la liste des conventions"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Retour conv.</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors px-3 py-2"
                  title="Rechercher par mots-clés"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Rechercher</span>
                </Button>
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
                        
                        const isCategoryExpanded = expandedCategory === category;
                        
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
                              if (isCategoryExpanded) {
                                setExpandedCategory(null);
                              } else {
                                setExpandedCategory(category);
                                // Aller automatiquement à la première section
                                const firstSection = categorySections[0];
                                if (firstSection) {
                                  setTimeout(() => {
                                    scrollToSectionTitle(firstSection.sectionType);
                                  }, 50);
                                }
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
                      <div className="border-t pt-1">
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {categoryDefinition.name}
                        </h2>
                      </div>
                      
                      {/* Sous-sections dans l'ordre défini */}
                      <div className="space-y-1">
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
              <div className="text-center py-1 text-gray-500">
                Aucune section disponible
              </div>
            )}
          </div>
          </div>
        </div>
      )}
      
      {/* Bouton "Retour en haut" fixe */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-2 right-2 z-20 rounded-full w-12 h-12 shadow-lg bg-green-600 hover:bg-green-700 text-white"
          size="icon"
          title="Retour en haut"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
      
      {/* Panneau de chat */}
      {convention && (
        <ChatAssistantPanel
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          conventionId={id || ""}
          conventionName={convention.name}
        />
      )}
      
      {/* Dialog de recherche */}
      {convention && (
        <SearchDialog
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          conventionId={id || ""}
          conventionName={convention.name}
          onResultClick={(sectionType: string) => {
            scrollToSectionTitle(sectionType);
            setIsSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}