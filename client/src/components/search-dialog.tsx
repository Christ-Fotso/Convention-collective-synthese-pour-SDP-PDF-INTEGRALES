import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
// Fonction debounce simple pour éviter la dépendance lodash
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

interface SearchResult {
  sectionType: string;
  sectionName: string;
  category: string;
  subcategory: string;
  content: string;
  matches: string[];
  score: number;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conventionId: string;
  conventionName: string;
  onResultClick: (sectionType: string) => void;
}

export function SearchDialog({ 
  open, 
  onOpenChange, 
  conventionId, 
  conventionName,
  onResultClick 
}: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fonction de recherche avec debounce
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.post(`/api/search/convention/${conventionId}`, {
          query: query.trim(),
          limit: 20
        });
        
        setSearchResults(response.data.results || []);
        setHasSearched(true);
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [conventionId]
  );

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  // Reset lors de l'ouverture/fermeture
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [open]);

  const highlightMatches = (text: string, matches: string[]) => {
    if (!matches || matches.length === 0) return text;
    
    let highlightedText = text;
    matches.forEach(match => {
      const regex = new RegExp(`(${match})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    return highlightedText;
  };

  const getCategoryName = (category: string, subcategory: string) => {
    const categoryMap: { [key: string]: string } = {
      'informations-generales': 'Informations générales',
      'embauche': 'Embauche',
      'temps-travail': 'Temps de travail', 
      'conges': 'Congés',
      'classification': 'Classification',
      'protection-sociale': 'Protection sociale',
      'remuneration': 'Rémunération',
      'depart': 'Fin de contrat'
    };

    const subcategoryMap: { [key: string]: string } = {
      'generale': 'Générale',
      'delai-prevenance': 'Délai de prévenance',
      'periode-essai': 'Période d\'essai',
      'duree-travail': 'Durée du travail',
      'amenagement-temps': 'Aménagement du temps',
      'heures-sup': 'Heures supplémentaires',
      'temps-partiel': 'Temps partiel',
      'forfait-jours': 'Forfait jours',
      'cet': 'CET',
      'conges-payes': 'Congés payés',
      'evenement-familial': 'Événement familial',
      'classification': 'Classification',
      'prevoyance': 'Prévoyance',
      'retraite': 'Retraite',
      'mutuelle': 'Mutuelle',
      'apprenti': 'Apprenti',
      'stagiaire': 'Stagiaire',
      'contrat-pro': 'Contrat pro',
      'grille': 'Grille salariale',
      'prime': 'Primes',
      'licenciement': 'Licenciement',
      'depart-retraite': 'Départ retraite',
      'mise-retraite': 'Mise à la retraite',
      'rupture-conventionnelle': 'Rupture conventionnelle',
      'preavis': 'Préavis',
      'precarite': 'Précarité'
    };

    const categoryName = categoryMap[category] || category;
    const subcategoryName = subcategoryMap[subcategory] || subcategory;
    
    return `${categoryName} → ${subcategoryName}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Search className="h-5 w-5" />
            Recherche dans {conventionName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {/* Champ de recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher des mots-clés, montants, durées..."
              className="pl-10 pr-4 py-3 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Résultats */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-4 w-4 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && hasSearched && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg mb-2">Aucun résultat trouvé</p>
                <p className="text-sm">Essayez avec d'autres mots-clés ou termes plus généraux</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                </div>
                
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => onResultClick(result.sectionType)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          {getCategoryName(result.category, result.subcategory)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div 
                      className="text-sm text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatches(
                          result.content.length > 200 
                            ? result.content.substring(0, 200) + "..." 
                            : result.content,
                          result.matches
                        )
                      }}
                    />
                    
                    {result.score && (
                      <div className="mt-2 text-xs text-gray-500">
                        Score de pertinence: {Math.round(result.score * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {!hasSearched && !isSearching && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3" />
                <p>Tapez au moins 2 caractères pour rechercher</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}