import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, Calendar, BookOpen, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GLOBAL_CONFIG } from "@/lib/constants";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";
import { useToast } from "@/hooks/use-toast";

interface Convention {
  id: string;
  name: string;
  url: string;
}

interface SectionType {
  category: string;
  subcategory?: string;
  label: string;
}

// Fonction pour transformer les types de section en structure hiérarchique
function groupSectionTypes(sectionTypes: string[]): SectionType[] {
  const result: SectionType[] = [];
  
  sectionTypes.forEach(type => {
    const [category, subcategory] = type.split(".");
    
    if (category && subcategory) {
      result.push({
        category,
        subcategory,
        label: getCategoryLabel(category, subcategory)
      });
    }
  });
  
  // Trier par catégorie puis sous-catégorie
  return result.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return (a.subcategory || "").localeCompare(b.subcategory || "");
  });
}

// Fonction pour obtenir un libellé lisible pour les catégories/sous-catégories
function getCategoryLabel(category: string, subcategory: string): string {
  // Transformation de "temps-travail" en "Temps de travail"
  const formatLabel = (str: string) => {
    return str
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const categoryLabel = formatLabel(category);
  const subcategoryLabel = formatLabel(subcategory);
  
  return `${categoryLabel} - ${subcategoryLabel}`;
}

export default function AdminConventionViewer() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    queryKey: ["sectionTypes", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await axios.get(`/api/convention/${id}/section-types`);
      console.log("Types de sections reçus:", response.data);
      return response.data;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Mutation pour régénérer une section
  const regenerateMutation = useMutation({
    mutationFn: async ({ conventionId, category, subcategory }: { 
      conventionId: string, 
      category: string, 
      subcategory: string 
    }) => {
      const sectionKey = `${category}.${subcategory}`;
      setRegeneratingSection(sectionKey);
      
      // 1. Vider le cache pour cette section
      await axios.delete(`/api/admin/cache/clear`, {
        data: { 
          conventionId, 
          sectionType: sectionKey 
        }
      });
      
      // 2. Forcer une nouvelle génération
      const response = await axios.post('/api/chat/message', {
        sourceId: `admin_regen_${Date.now()}`,
        messages: [{ role: "user", content: "Régénérer la section" }],
        category,
        subcategory,
        conventionId,
        forceRegenerate: true
      });
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      const sectionKey = `${variables.category}.${variables.subcategory}`;
      
      toast({
        title: "Régénération réussie",
        description: `La section "${getCategoryLabel(variables.category, variables.subcategory)}" a été régénérée avec succès.`,
        variant: "default"
      });
      
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['section', variables.conventionId, sectionKey] });
      queryClient.invalidateQueries({ queryKey: ['sectionTypes', variables.conventionId] });
      
      setRegeneratingSection(null);
    },
    onError: (error, variables) => {
      console.error("Erreur lors de la régénération:", error);
      
      toast({
        title: "Erreur de régénération",
        description: `Impossible de régénérer la section "${getCategoryLabel(variables.category, variables.subcategory)}".`,
        variant: "destructive"
      });
      
      setRegeneratingSection(null);
    }
  });
  
  // Convertir les données en tableau si nécessaire et vérifier que ce sont des chaînes
  const processedSectionTypes = sectionTypes ? 
    (Array.isArray(sectionTypes) ? sectionTypes : []) : [];
    
  console.log("Types de sections traités:", processedSectionTypes);
  
  // Grouper les types de sections par catégorie
  const groupedSections = processedSectionTypes.length > 0 ? 
    groupSectionTypes(processedSectionTypes) : [];
  
  // Fonction pour gérer la régénération
  const handleRegenerate = (section: SectionType) => {
    if (!id || !section.subcategory) return;
    
    regenerateMutation.mutate({
      conventionId: id,
      category: section.category,
      subcategory: section.subcategory
    });
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-orange-600">
              {isLoadingConvention ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                convention ? `[ADMIN] Convention: ${convention.name}` : "Convention non trouvée"
              )}
            </h1>
          </div>
          {convention && (
            <div className="ml-12 flex items-center gap-2 text-sm text-muted-foreground bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-orange-700 font-medium">Mode Administration - Dernière mise à jour : {GLOBAL_CONFIG.LAST_UPDATE_DATE}</span>
            </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">IDCC {convention.id} - Mode Administration</CardTitle>
              <CardDescription className="flex flex-col gap-2">
                <span>Sélectionnez une section à consulter ou à régénérer</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Dernière mise à jour : {GLOBAL_CONFIG.LAST_UPDATE_DATE}</span>
                </div>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsLegalDialogOpen(true)}
                    className="w-fit"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Informations légales
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSections ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="grid grid-cols-1 gap-4">
                    {groupedSections.map((section, index) => {
                      const sectionKey = `${section.category}.${section.subcategory}`;
                      const isRegenerating = regeneratingSection === sectionKey;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                          <div className="flex-1">
                            <Link href={`/convention/${id}/section/${section.category}/${section.subcategory}`}>
                              <div className="cursor-pointer">
                                <h3 className="font-medium hover:text-blue-600">{section.label}</h3>
                                <p className="text-sm text-muted-foreground">Cliquer pour consulter</p>
                              </div>
                            </Link>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerate(section)}
                            disabled={isRegenerating || regenerateMutation.isPending}
                            className="min-w-[120px]"
                          >
                            {isRegenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Régénération...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Régénérer
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Dialog des informations légales */}
      <DispositifLegalDialog
        isOpen={isLegalDialogOpen}
        setIsOpen={setIsLegalDialogOpen}
        title={convention ? `Convention ${convention.name}` : "Convention"}
        content={`## Informations légales générales

Cette convention collective s'applique aux entreprises et salariés du secteur concerné.

### Dispositions légales
Les dispositions de cette convention collective complètent et ne peuvent déroger aux dispositions légales d'ordre public.

### Sources légales de référence
- Code du travail
- Conventions collectives nationales
- Accords de branche
- Jurisprudence sociale

### Application territoriale
Cette convention s'applique sur l'ensemble du territoire français, y compris dans les départements et territoires d'outre-mer, sauf dispositions spécifiques contraires.`}
      />
    </div>
  );
}