import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Search, X, FileText, Users, Calendar, ArrowRight, Star } from "lucide-react";
import axios from "axios";

// Définition du type Convention
type Convention = {
  id: string;
  name: string;
  url?: string;
};

interface NafEntry {
  conventionId: string;
  conventionName: string;
  idcc: string;
  nafCodes: string[];
  sectors: string[];
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [filteredConventions, setFilteredConventions] = useState<Convention[]>([]);
  const [showNafSearch, setShowNafSearch] = useState(false);
  const [nafResults, setNafResults] = useState<NafEntry[]>([]);
  const [isSearchingNaf, setIsSearchingNaf] = useState(false);
  const [, navigate] = useLocation();

  const { data: conventions = [] as Convention[] } = useQuery<Convention[]>({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  // Effet qui s'exécute à chaque changement de recherche ou de données
  useEffect(() => {
    if (!conventions.length) {
      setFilteredConventions([]);
      return;
    }

    // Copier les conventions pour pouvoir les trier sans modifier l'original
    let results = [...conventions];
    
    // Filtrer si une recherche est active
    if (search.trim()) {
      const searchTerms = search.toLowerCase().trim().split(/\s+/);
      
      results = results.filter(conv => {
        if (!conv) return false;
        
        const id = String(conv.id || '').toLowerCase();
        const name = String(conv.name || '').toLowerCase();
        
        // Un seul terme doit correspondre pour inclure la convention
        return searchTerms.some(term => 
          id.includes(term) || name.includes(term)
        );
      });
    }
    
    // Trier : Code du travail d'abord, puis par ordre alphabétique
    results.sort((a, b) => {
      // Le Code du travail (IDCC 9999) toujours en premier
      if (a.id === '9999') return -1;
      if (b.id === '9999') return 1;
      
      // Sinon, tri alphabétique normal
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
    
    setFilteredConventions(results);
  }, [search, conventions]);

  const handleNafSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsSearchingNaf(true);
    try {
      // Essayer d'abord comme code NAF
      let response = await axios.get(`/api/naf/search?code=${encodeURIComponent(searchTerm)}`);
      
      // Si pas de résultats, essayer comme mot-clé
      if (response.data.results.length === 0) {
        response = await axios.get(`/api/naf/search?keyword=${encodeURIComponent(searchTerm)}`);
      }
      
      setNafResults(response.data.results);
      setShowNafSearch(true);
    } catch (error) {
      console.error('Erreur lors de la recherche NAF:', error);
      setNafResults([]);
    } finally {
      setIsSearchingNaf(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      handleNafSearch(search);
    }
  };

  const clearNafSearch = () => {
    setShowNafSearch(false);
    setNafResults([]);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-3">
            Recherche de Convention Collective
          </h1>
        </div>

        {/* Moteur de recherche simple */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Rechercher par IDCC, nom de convention ou code NAF..."
              className="h-12 pl-4 pr-24 text-lg w-full border-2 focus:border-green-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              {search && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearch("");
                    clearNafSearch();
                  }}
                  className="text-sm bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs gap-1"
                disabled={isSearchingNaf}
              >
                <Building2 className="h-3 w-3" />
                NAF
              </Button>
            </div>
          </form>
        </div>

        {/* Résultats de recherche NAF modernisés */}
        {showNafSearch && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Résultats par code NAF ({nafResults.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNafSearch}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-blue-700">
                Conventions correspondant à votre recherche par secteur d'activité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nafResults.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p className="text-blue-700 font-medium">Aucune convention trouvée</p>
                  <p className="text-blue-600 text-sm">Essayez avec un autre code NAF ou mot-clé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nafResults.map((entry) => (
                    <Card 
                      key={entry.conventionId}
                      className="cursor-pointer hover:shadow-md transition-all bg-white hover:bg-blue-50 border-blue-200"
                      onClick={() => navigate(`/convention/${entry.conventionId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-green-700 text-sm leading-tight">
                            {entry.conventionName}
                          </h4>
                          <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-xs text-gray-600 mb-2">IDCC {entry.idcc}</p>
                        {entry.nafCodes.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {entry.nafCodes.slice(0, 4).map((code) => (
                              <Badge key={code} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                {code}
                              </Badge>
                            ))}
                            {entry.nafCodes.length > 4 && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                +{entry.nafCodes.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                        {entry.sectors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 truncate">
                              {entry.sectors.slice(0, 2).join(", ")}
                              {entry.sectors.length > 2 && "..."}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Liste des conventions modernisée */}
        {!showNafSearch && (
          <div className="space-y-6">
            {/* Section Code du travail mise en avant */}
            {filteredConventions.some(c => c.id === '9999') && !search && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Référence légale
                </h2>
                <Card 
                  className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/convention/9999`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-green-700 group-hover:text-green-800">
                          Code du travail
                        </CardTitle>
                        <CardDescription className="text-green-600">
                          IDCC 9999 • Référence légale de base pour tous les salariés français
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Référence
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700">
                      Consultez les dispositions légales fondamentales : durée du travail, 
                      congés payés, période d'essai, délais de prévenance...
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section conventions collectives */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-700">
                  {search ? `Résultats de recherche (${filteredConventions.filter(c => c.id !== '9999').length})` : 'Conventions collectives'}
                </h2>
                {search && (
                  <Button
                    variant="outline"
                    onClick={() => setSearch("")}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Effacer la recherche
                  </Button>
                )}
              </div>

              {filteredConventions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg mb-2">
                        {search ? `Aucune convention trouvée pour "${search}"` : "Chargement des conventions..."}
                      </p>
                      <p className="text-sm">
                        {search && "Essayez avec d'autres termes ou utilisez la recherche NAF"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredConventions
                    .filter(convention => convention.id !== '9999') // Exclure le Code du travail de la liste normale
                    .map((convention, index) => (
                    <Card
                      key={`${convention.id || convention.name || index}-${index}`}
                      className="hover:shadow-lg transition-all cursor-pointer group border-green-100 hover:border-green-300"
                      onClick={() => {
                        const conventionId = convention.id || encodeURIComponent(convention.name);
                        navigate(`/convention/${conventionId}`);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base text-green-700 group-hover:text-green-800 leading-tight">
                              {convention.name}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {convention.id ? `IDCC ${convention.id}` : "Convention sans IDCC"}
                            </CardDescription>
                          </div>
                          <ArrowRight className="h-4 w-4 text-green-500 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-gray-600 mb-2">
                          Sections principales :
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/convention/${convention.id}?section=remuneration.grille`);
                            }}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors"
                          >
                            Rémunération
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/convention/${convention.id}?section=temps-travail.duree-travail`);
                            }}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors"
                          >
                            Temps de travail
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/convention/${convention.id}?section=conges.conges-payes`);
                            }}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors"
                          >
                            Congés
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/convention/${convention.id}?section=classification.classification`);
                            }}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors"
                          >
                            Classification
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}