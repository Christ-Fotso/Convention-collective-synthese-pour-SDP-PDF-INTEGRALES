import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GLOBAL_CONFIG } from "@/lib/constants";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { hasDispositifLegal, getDispositifLegal } from "@/data/dispositifs-legaux";

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

export default function ConventionViewer() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  
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
  
  // Convertir les données en tableau si nécessaire et vérifier que ce sont des chaînes
  const processedSectionTypes = sectionTypes ? 
    (Array.isArray(sectionTypes) ? sectionTypes : []) : [];
    
  console.log("Types de sections traités:", processedSectionTypes);
  
  // Grouper les types de sections par catégorie
  const groupedSections = processedSectionTypes.length > 0 ? 
    groupSectionTypes(processedSectionTypes) : [];
  
  return (
    <div className="iframe-optimized">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col gap-6">
          <div className="nav-compact">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="p-1">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold flex-1">
                {isLoadingConvention ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  convention ? `${convention.name}` : "Convention non trouvée"
                )}
              </h1>
              {convention && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLegalDialogOpen(true)}
                  className="text-xs"
                >
                  <BookOpen className="mr-1 h-3 w-3" />
                  Valeurs légales
                </Button>
              )}
            </div>
            {convention && (
              <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="font-medium">MAJ : {GLOBAL_CONFIG.LAST_UPDATE_DATE}</span>
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
                <CardTitle className="text-base">IDCC {convention.id} - Sections disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSections ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <ScrollArea className="scroll-area">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {groupedSections.map((section, index) => (
                        <Link 
                          key={index} 
                          href={`/convention/${id}/section/${section.category}/${section.subcategory}`}
                        >
                          <div className="cursor-pointer rounded border p-3 hover:bg-slate-100 dark:hover:bg-slate-900/20 transition-colors">
                            <h3 className="text-sm font-medium">{section.label}</h3>
                          </div>
                        </Link>
                      ))}
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
    </div>
  );
}