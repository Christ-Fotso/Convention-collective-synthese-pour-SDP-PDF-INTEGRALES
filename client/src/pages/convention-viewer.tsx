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
  // Mapping spécialisé pour certaines sections
  const sectionLabels: { [key: string]: string } = {
    'embauche.periode-essai': 'Essai et Préavis',
    'embauche.contrats-alternance': 'Contrats en alternance',
    'remuneration.maintien-salaire': 'Maintien de salaire',
    'remuneration.primes': 'Primes',
    'remuneration.majorations': 'Majorations',
    'cotisations.taux-cotisation': 'Taux de cotisation',
    'conges.conge-anciennete': "Congé d'ancienneté",
    'informations-generales.generale': 'Informations générales',
    'temps-travail.duree-travail': 'Durées du travail',
    'temps-travail.amenagement-temps': 'Aménagement du temps de travail',
    'temps-travail.heures-sup': 'Heures supplémentaires',
    'conges.conges-payes': 'Congés payés',
    'conges.cet': 'CET'
  };
  
  const fullKey = `${category}.${subcategory}`;
  if (sectionLabels[fullKey]) {
    return sectionLabels[fullKey];
  }
  
  // Transformation par défaut
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
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isLoadingConvention ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              convention ? `Convention collective: ${convention.name}` : "Convention non trouvée"
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
          <Card>
            <CardHeader>
              <CardTitle>IDCC {convention.id}</CardTitle>
              <CardDescription>
                Sélectionnez une section à consulter
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedSections.map((section, index) => (
                      <Link 
                        key={index} 
                        href={`/convention/${id}/section/${section.category}/${section.subcategory}`}
                      >
                        <div className="cursor-pointer rounded-md border p-4 hover:bg-slate-100 dark:hover:bg-slate-900/20">
                          <h3 className="font-medium">{section.label}</h3>
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
    </div>
  );
}