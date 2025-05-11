import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CATEGORIES } from "@/lib/categories";
import { MarkdownTableWrapper } from "@/components/markdown-table-wrapper";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";

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
  
  // Requête pour obtenir les informations sur la convention
  const { data: convention, isLoading: isLoadingConvention } = useQuery({
    queryKey: ["convention", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/api/conventions`);
      const conventions = response.data;
      return conventions.find((c: Convention) => c.id === id) || null;
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
  
  return (
    <div className="container mx-auto py-6 space-y-6">
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
      
      {!isLoadingConvention && !convention && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            La convention collective demandée n'a pas été trouvée.
          </AlertDescription>
        </Alert>
      )}
      
      {convention && (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Colonne de gauche: Navigation par sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sections disponibles</CardTitle>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Rechercher une section..."
                  className="w-full p-2 pr-8 text-sm border rounded-md"
                  onChange={(e) => {
                    // Stocker la valeur de recherche dans un état local
                    setSearchTerm(e.target.value);
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
            </CardHeader>
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
                      {/* Créer un objet pour regrouper les sections par catégorie */}
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
                        
                        // Utiliser l'ordre des catégories défini dans CATEGORIES
                        CATEGORIES.forEach((categoryDefinition, categoryIndex) => {
                          const category = categoryDefinition.id;
                          
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
                            categoryElements.push(
                              <div key={categoryIndex} className="mb-3">
                                <h3 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400 border-b pb-1">
                                  {categoryDefinition.name}
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {sectionElements}
                                </div>
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
                    >
                      Voir complet <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  "Aperçu du contenu"
                )}
              </CardTitle>
              {!selectedSection && (
                <CardDescription>
                  Sélectionnez une section pour afficher son contenu
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-260px)]">
                {!selectedSection ? (
                  <div className="text-center py-6 text-gray-500">
                    Aucune section sélectionnée
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
                  <div className="prose dark:prose-invert max-w-none prose-sm" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
                    {/* Afficher la réponse brute en cas de problème */}
                    {sectionContent ? (
                      <>
                        {hasDispositifLegal(selectedSection?.sectionType || "") && (
                          <div className="mb-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs flex items-center text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800"
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
                        <MarkdownTableWrapper 
                          content={sectionContent.content || "*Aucun contenu disponible pour cette section*"} 
                        />
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
    </div>
  );
}