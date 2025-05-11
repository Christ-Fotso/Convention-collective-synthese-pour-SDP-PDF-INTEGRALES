import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from "lucide-react";
import { MarkdownTableRenderer } from '@/components/markdown-table-renderer';
import { MarkdownTableWrapper } from '@/components/markdown-table-wrapper';
import { hasDispositifLegal, getDispositifLegal, SECTION_TYPE_MAPPINGS } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { getConventions } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import type { Convention, ConventionSection, Category, Subcategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Fonction pour récupérer une section spécifique
async function getConventionSection(conventionId: string, sectionType: string): Promise<ConventionSection> {
  const { data } = await axios.get(`/api/convention/${conventionId}/section/${sectionType}`);
  return data;
}

// Fonction pour convertir le format des paramètres
function normalizeParams(category?: string, subcategory?: string): string {
  if (!category) return '';
  if (!subcategory) return category;
  return `${category}.${subcategory}`;
}

export default function SectionViewer() {
  const params = useParams<{ id: string, category: string, subcategory?: string }>();
  const [, navigate] = useLocation();
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState<boolean>(false);
  const conventionId = params.id;
  const sectionType = normalizeParams(params.category, params.subcategory);

  const { data: conventions, isLoading: isLoadingConventions } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  const convention = conventions?.find(c => c.id === conventionId);

  // Récupération de la section
  const { data: section, isLoading: isLoadingSection, error: sectionError } = useQuery({
    queryKey: [`/api/convention/${conventionId}/section/${sectionType}`],
    queryFn: () => getConventionSection(conventionId, sectionType),
    enabled: !!conventionId && !!sectionType,
  });

  // Trouver les métadonnées de la catégorie/sous-catégorie
  const findCategoryInfo = () => {
    const [categoryId, subcategoryId] = sectionType.split('.');
    const category = CATEGORIES.find(c => c.id === categoryId);
    const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
    
    let categoryName = categoryId.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    let subcategoryName = subcategoryId?.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "";
    
    if (category) {
      categoryName = category.name;
      if (subcategory) {
        subcategoryName = subcategory.name;
      }
    }
    
    return {
      category: categoryName,
      subcategory: subcategoryName,
    };
  };

  const { category: categoryName, subcategory: subcategoryName } = findCategoryInfo();

  // Logs de débogage pour comprendre pourquoi les dispositifs légaux ne s'affichent pas
  useEffect(() => {
    if (sectionType) {
      console.log('Section type:', sectionType);
      console.log('Has dispositif legal:', hasDispositifLegal(sectionType));
      console.log('SECTION_TYPE_MAPPINGS:', SECTION_TYPE_MAPPINGS);
      
      if (hasDispositifLegal(sectionType)) {
        console.log('Dispositif legal content:', getDispositifLegal(sectionType));
      }
    }
  }, [sectionType]);

  if (isLoadingConventions || isLoadingSection) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-8">
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!convention) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Convention non trouvée</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste des conventions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8 bg-muted/50 p-4 rounded-lg shadow-sm">
        <Button variant="outline" onClick={() => navigate(`/chat/${conventionId}`)} className="hover:bg-background">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la convention
        </Button>
        <h1 className="text-2xl font-bold">
          IDCC {convention.id} - {convention.name}
        </h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{categoryName} {subcategoryName ? `- ${subcategoryName}` : ''}</span>
            {hasDispositifLegal(sectionType) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsLegalDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Voir le dispositif légal
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sectionError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Impossible de charger cette section. Cette information n'est peut-être pas disponible pour cette convention collective.
              </AlertDescription>
            </Alert>
          ) : section ? (
            <div className="prose prose-sm max-w-none dark:prose-invert" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
              <MarkdownTableWrapper content={section.content} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Section non disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale du dispositif légal */}
      {hasDispositifLegal(sectionType) && (
        <DispositifLegalDialog
          isOpen={isLegalDialogOpen}
          setIsOpen={setIsLegalDialogOpen}
          title={`Dispositif légal - ${categoryName} ${subcategoryName ? `- ${subcategoryName}` : ''}`}
          content={getDispositifLegal(sectionType)}
        />
      )}
    </div>
  );
}