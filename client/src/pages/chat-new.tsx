import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CATEGORIES } from "@/lib/categories";
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

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState<boolean>(false);
  
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
          displaySubcategory = backendSubcategory;
        }
        
        return {
          sectionType: type,
          category: displayCategory,
          subcategory: displaySubcategory,
          label: `${displayCategory}.${displaySubcategory}`
        };
      });
    },
    staleTime: 1000 * 60 * 5
  });

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
      
      {/* Navigation hiérarchique par catégories */}
      {convention && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-center text-slate-700">
            Sections disponibles
          </h3>
          {isLoadingSections ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                // Grouper les sections par catégorie
                const groupedSections: Record<string, SectionType[]> = {};
                sectionTypes?.forEach((section: SectionType) => {
                  if (!groupedSections[section.category]) {
                    groupedSections[section.category] = [];
                  }
                  groupedSections[section.category].push(section);
                });

                return Object.entries(groupedSections).map(([categoryId, sections]) => {
                  const categoryData = CATEGORIES.find(cat => cat.id === categoryId);
                  const isExpanded = expandedCategory === categoryId;
                  
                  return (
                    <div key={categoryId} className="border border-gray-200 rounded-lg">
                      {/* En-tête de catégorie */}
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-green-600">
                          {categoryData?.name || categoryId}
                        </span>
                        <ChevronRight 
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* Sous-sections */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {sections.map((section, index) => {
                            const subcategoryData = categoryData?.subcategories.find(sub => sub.id === section.subcategory);
                            
                            return (
                              <div
                                key={index}
                                className="px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                {subcategoryData?.name || section.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
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