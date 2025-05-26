import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    <div className="max-w-6xl mx-auto p-5">
      {/* En-tête de la convention avec style moderne */}
      {convention && (
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-8 rounded-xl mb-5 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
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
          <div className="flex flex-wrap justify-center gap-3">
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
              groupedSections.map((section, index) => (
                <Link 
                  key={index} 
                  href={`/convention/${id}/section/${section.category}/${section.subcategory}`}
                >
                  <button className="bg-gray-50 border-2 border-gray-200 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 text-center text-sm font-medium text-gray-600 min-w-40 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-lg">
                    {section.label}
                  </button>
                </Link>
              ))
            )}
          </div>
        </nav>
      )}

      {/* Zone de contenu */}
      {convention && (
        <div className="bg-white rounded-xl p-8 shadow-md">
          <div className="text-center text-gray-600">
            <p className="text-lg">Sélectionnez une section ci-dessus pour consulter son contenu</p>
          </div>
        </div>
      )}
    </div>
  );
}