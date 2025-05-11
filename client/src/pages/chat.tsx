import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
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
      
      <Card className="w-full">
        <CardHeader>
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
            <ScrollArea className="h-[calc(100vh-220px)]">
              {sectionTypes && sectionTypes.length > 0 ? (
                <div className="space-y-6">
                  {/* Grouper les sections par catégorie */}
                  {Object.entries(
                    // Grouper les sections par catégorie
                    sectionTypes.reduce((acc: Record<string, SectionType[]>, section: SectionType) => {
                      if (!acc[section.category]) {
                        acc[section.category] = [];
                      }
                      acc[section.category].push(section);
                      return acc;
                    }, {})
                  ).map(([category, sections]: [string, SectionType[]], categoryIndex: number) => (
                    <div key={categoryIndex} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400 border-b pb-2">
                        {category.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sections.map((section: SectionType, sectionIndex: number) => (
                          <Link
                            key={`${categoryIndex}-${sectionIndex}`}
                            href={`/convention/${id}/section/${section.category}/${section.subcategory}`}
                          >
                            <div className="p-4 border rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                              {section.subcategory.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}