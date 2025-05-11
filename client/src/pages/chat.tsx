import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      return response.data.map((type: string) => ({
        sectionType: type,
        label: getSectionLabel(type),
        category: type.split(".")[0],
        subcategory: type.split(".")[1]
      }));
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Requête pour obtenir le contenu d'une section
  const { data: sectionContent, isLoading: isLoadingSectionContent } = useQuery({
    queryKey: ["section-content", id, selectedSection?.category, selectedSection?.subcategory],
    queryFn: async () => {
      if (!id || !selectedSection) return null;
      const response = await axios.get(`/api/convention/${id}/section/${selectedSection.category}/${selectedSection.subcategory}`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne de gauche: Navigation par sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sections disponibles</CardTitle>
              <CardDescription>
                Sélectionnez une section pour consulter son contenu
              </CardDescription>
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
                        
                        // Parcours de toutes les sections pour les regrouper
                        sectionTypes.forEach((section: SectionType) => {
                          if (!groupedSections[section.category]) {
                            groupedSections[section.category] = [];
                          }
                          groupedSections[section.category].push(section);
                        });
                        
                        // Ensuite, on crée des éléments JSX pour chaque catégorie
                        const categoryElements: JSX.Element[] = [];
                        
                        Object.keys(groupedSections).forEach((category, categoryIndex) => {
                          const sections = groupedSections[category];
                          
                          const sectionElements: JSX.Element[] = [];
                          sections.forEach((section, sectionIndex) => {
                            sectionElements.push(
                              <div
                                key={`${categoryIndex}-${sectionIndex}`}
                                className={`p-3 border rounded-md cursor-pointer ${
                                  selectedSection?.sectionType === section.sectionType
                                    ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-900/20"
                                }`}
                                onClick={() => setSelectedSection(section)}
                              >
                                {section.subcategory.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                              </div>
                            );
                          });
                          
                          categoryElements.push(
                            <div key={categoryIndex} className="mb-6">
                              <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400 border-b pb-2">
                                {category.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                {sectionElements}
                              </div>
                            </div>
                          );
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
                    <span>{selectedSection.label}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/convention/${id}/section/${selectedSection.category}/${selectedSection.subcategory}`)}
                    >
                      Voir complet <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  "Aperçu du contenu"
                )}
              </CardTitle>
              <CardDescription>
                {selectedSection ? 
                  `Section: ${selectedSection.label}` : 
                  "Sélectionnez une section pour afficher son contenu"
                }
              </CardDescription>
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
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {sectionContent?.content || "*Aucun contenu disponible pour cette section*"}
                    </ReactMarkdown>
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