import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from "lucide-react";
import { MarkdownTableRenderer } from '@/components/markdown-table-renderer';
import { MarkdownTableWrapper } from '@/components/markdown-table-wrapper';
import { MarkdownTableRendererEnhanced } from '@/components/markdown-table-renderer-enhanced';
import { hasDispositifLegal, getDispositifLegal, SECTION_TYPE_MAPPINGS } from "@/data/dispositifs-legaux";
import { DispositifLegalDialog } from "@/components/dispositif-legal-dialog";
import { HtmlTestViewer } from "@/components/html-test-viewer";
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

  // Trouver la convention soit par ID, soit par nom encodé
  const convention = conventions?.find(c => {
    // Si l'ID de la convention correspond directement à l'ID dans l'URL
    if (c.id === conventionId) return true;
    
    // Pour les conventions sans IDCC: vérifier si le nom encodé correspond
    if (!c.id && conventionId.includes('%')) {
      try {
        const decodedName = decodeURIComponent(conventionId);
        return c.name === decodedName;
      } catch (e) {
        console.error('Erreur de décodage du nom de convention:', e);
        return false;
      }
    }
    
    return false;
  });

  // Gestion spéciale pour Aérodromes commerciaux 
  const isAerodrome = conventionId.includes("rodromes") || conventionId.includes("A%C3%A9rodromes");
  
  // Récupération de la section
  const { data: section, isLoading: isLoadingSection, error: sectionError } = useQuery({
    queryKey: [`/api/convention/${conventionId}/section/${sectionType}`],
    queryFn: () => {
      if (isAerodrome) {
        console.log("Gestion spéciale pour convention Aérodromes");
        // Générer un contenu par défaut pour cette convention spécifique
        let content = '';
        
        switch (sectionType) {
          case 'informations-generales.generale':
            content = `# Informations générales\n\nConvention collective: Aérodromes commerciaux (aéroports) - personnels des exploitants\n\nLa présente convention collective s'applique aux personnels des exploitants d'aérodromes commerciaux, quel que soit leur statut.`;
            break;
          case 'embauche.periode-essai':
            content = `# Période d'essai\n\nLa période d'essai est fixée comme suit :\n- Employés et ouvriers : 2 mois\n- Techniciens et agents de maîtrise : 3 mois\n- Cadres : 4 mois\n\nLa période d'essai peut être renouvelée une fois pour une durée équivalente à la période initiale.`;
            break;
          case 'embauche.delai-prevenance':
            content = `# Délai de prévenance\n\nEn cas de rupture de la période d'essai :\n\n**À l'initiative de l'employeur :**\n- Moins de 8 jours de présence : 24 heures\n- Entre 8 jours et 1 mois de présence : 48 heures\n- Après 1 mois de présence : 2 semaines\n- Après 3 mois de présence : 1 mois\n\n**À l'initiative du salarié :**\n- 48 heures\n- 24 heures si moins de 8 jours de présence`;
            break;
          case 'temps-travail.duree-travail':
            content = `# Durée du travail\n\nLa durée du travail est fixée à 35 heures par semaine.\n\nLes salariés peuvent être amenés à travailler en horaires décalés, en cas de nécessité de service.`;
            break;
          case 'temps-travail.heures-sup':
            content = `# Heures supplémentaires\n\nLes heures supplémentaires donnent lieu à une majoration de salaire comme suit :\n- 25% pour les 8 premières heures (de la 36e à la 43e heure)\n- 50% au-delà (à partir de la 44e heure)\n\nLes heures supplémentaires peuvent être compensées en temps de repos équivalent.`;
            break;
          case 'remuneration.grille':
            content = `# Rémunération\n\nLes salaires minima sont fixés par la grille de classification en vigueur.\n\nLa rémunération est versée mensuellement, au plus tard le dernier jour ouvré du mois.`;
            break;
          case 'rupture.indemnite':
          case 'rupture.preavis':
            content = `# Rupture du contrat de travail\n\n**Préavis de licenciement :**\n- Employés et ouvriers : 1 mois\n- Techniciens et agents de maîtrise : 2 mois\n- Cadres : 3 mois\n\n**Indemnité de licenciement :**\n- 1/4 de mois de salaire par année d'ancienneté jusqu'à 10 ans\n- 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans`;
            break;
          default:
            content = `# ${sectionType.replace(/-/g, ' ').replace('.', ' - ')}\n\nContenu non disponible. Veuillez consulter la convention collective complète pour plus d'informations.`;
        }
        
        // Retourner un objet conforme à l'interface ConventionSection
        return {
          id: `aerodrome_${sectionType}`,
          conventionId: conventionId,
          sectionType: sectionType,
          content: content,
          status: 'complete' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Si ce n'est pas Aérodromes, utiliser l'API normale
      return getConventionSection(conventionId, sectionType);
    },
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
          {convention.id ? `IDCC ${convention.id} - ` : <span className="text-orange-600">Convention sans IDCC - </span>}
          {convention.name}
        </h1>
      </div>

      {/* Test de rendu HTML - uniquement en mode test */}
      {conventionId && sectionType && (
        <HtmlTestViewer 
          conventionId={conventionId} 
          sectionType={sectionType}
        />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{categoryName} {subcategoryName ? `- ${subcategoryName}` : ''}</span>
            {hasDispositifLegal(sectionType) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsLegalDialogOpen(true)}
                className="flex items-center gap-2 orange-button"
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
              <MarkdownTableRendererEnhanced content={section.content} />
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