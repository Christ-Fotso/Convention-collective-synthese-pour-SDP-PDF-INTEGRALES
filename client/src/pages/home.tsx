import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Search, X, FileText, Users, Calendar, ArrowRight, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { GLOBAL_CONFIG } from "@/lib/constants";

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
  const [showNafSearch, setShowNafSearch] = useState(false);
  const [nafResults, setNafResults] = useState<NafEntry[]>([]);
  const [isSearchingNaf, setIsSearchingNaf] = useState(false);
  const [showNafModal, setShowNafModal] = useState(false);
  const [nafSearchTerm, setNafSearchTerm] = useState("");
  const [location, navigate] = useLocation();
  
  // Détecter si on est en mode admin
  const isAdminMode = location === '/admin' || location.startsWith('/admin/');

  const { data: conventions = [] as Convention[] } = useQuery<Convention[]>({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  // Calculer les conventions filtrées directement sans useEffect pour éviter les boucles
  const filteredConventions = useMemo(() => {
    if (!conventions.length) {
      return [];
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
        
        // Recherche améliorée : correspondance exacte IDCC ou inclusion dans le nom
        return searchTerms.some(term => {
          // Recherche exacte pour les codes IDCC
          if (term.match(/^\d+$/) && id === term) {
            return true;
          }
          // Recherche par inclusion pour les noms
          if (name.includes(term)) {
            return true;
          }
          // Recherche par IDCC avec préfixe
          if (term.startsWith('idcc') && id === term.replace('idcc', '').trim()) {
            return true;
          }
          return false;
        });
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
    
    return results;
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
    } catch (error) {
      console.error('Erreur lors de la recherche NAF:', error);
      setNafResults([]);
    } finally {
      setIsSearchingNaf(false);
    }
  };

  const handleNafModalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (nafSearchTerm.trim()) {
      handleNafSearch(nafSearchTerm);
    }
  };

  // Recherche automatique NAF avec debounce
  React.useEffect(() => {
    if (nafSearchTerm.trim() && nafSearchTerm.length >= 2) {
      const timer = setTimeout(() => {
        handleNafSearch(nafSearchTerm);
      }, 500); // Délai de 500ms après la dernière frappe

      return () => clearTimeout(timer);
    } else if (!nafSearchTerm.trim()) {
      setNafResults([]);
    }
  }, [nafSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pas besoin de faire une recherche NAF séparée, la recherche se fait automatiquement
  };

  const clearNafSearch = () => {
    setShowNafSearch(false);
    setNafResults([]);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">


        {/* Moteur de recherche simple */}
        <div className="mb-8">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Input
                type="text"
                placeholder="Tapez le nom de la convention ou l'IDCC (ex: 1486, boulangerie...)..."
                className="h-10 pl-4 pr-12 text-sm w-full border focus:border-green-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearch("");
                    clearNafSearch();
                  }}
                  className="absolute right-3 top-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-full h-6 w-6 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>
            <Button
              type="button"
              onClick={() => setShowNafModal(true)}
              className="h-10 px-4 bg-orange-300 hover:bg-orange-400 text-white flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Code NAF
            </Button>
          </div>
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
                      onClick={() => navigate(isAdminMode ? `/admin/convention/${entry.conventionId}` : `/convention/${entry.conventionId}`)}
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
            {/* Section conventions collectives */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-700">
                  {search ? `Résultats de recherche (${filteredConventions.length})` : 'Synthèse conventions collectives'}
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
                  {filteredConventions.map((convention, index) => (
                    <Card
                      key={`${convention.id || convention.name || index}-${index}`}
                      className="hover:shadow-lg transition-all cursor-pointer group border-green-100 hover:border-green-300"
                      onClick={() => {
                        const conventionId = convention.id || encodeURIComponent(convention.name);
                        navigate(isAdminMode ? `/admin/convention/${conventionId}` : `/convention/${conventionId}`);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-base text-green-700 group-hover:text-green-800 leading-tight">
                          {convention.name}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {convention.id ? `IDCC ${convention.id}` : "Convention sans IDCC"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de recherche NAF */}
        <Dialog open={showNafModal} onOpenChange={setShowNafModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden pt-6">
            <DialogHeader className="sr-only">
              <DialogTitle>Recherche NAF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Formulaire de recherche NAF */}
              <form onSubmit={handleNafModalSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Tapez un code NAF (ex: 4711F) ou un secteur d'activité (ex: commerce, restauration...)..."
                  className="h-10 pl-4 pr-32 w-full border-2 focus:border-orange-500"
                  value={nafSearchTerm}
                  onChange={(e) => setNafSearchTerm(e.target.value)}
                />
                <div className="absolute right-2 top-1 flex items-center gap-1">
                  {nafSearchTerm && (
                    <button 
                      type="button"
                      onClick={() => {
                        setNafSearchTerm("");
                        setNafResults([]);
                      }}
                      className="text-sm bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 bg-orange-400 hover:bg-orange-500"
                    disabled={isSearchingNaf}
                  >
                    {isSearchingNaf ? "..." : "Rechercher"}
                  </Button>
                </div>
              </form>

              {/* Résultats NAF */}
              <ScrollArea className="h-96">
                {nafResults.length === 0 && !isSearchingNaf && nafSearchTerm ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <div className="text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg mb-2">Aucun résultat trouvé</p>
                        <p className="text-sm">
                          Essayez avec un autre code NAF ou secteur d'activité
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : nafResults.length > 0 ? (
                  <div className="space-y-3">
                    {nafResults.map((result, index) => (
                      <Card 
                        key={`naf-${result.conventionId}-${index}`}
                        className="hover:shadow-md transition-shadow cursor-pointer border-orange-100 hover:border-orange-300"
                        onClick={() => {
                          const conventionId = result.conventionId || result.idcc;
                          navigate(isAdminMode ? `/admin/convention/${conventionId}` : `/convention/${conventionId}`);
                          setShowNafModal(false);
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-base text-orange-700 leading-tight">
                                {result.conventionName}
                              </CardTitle>
                              <CardDescription className="text-sm mt-1">
                                IDCC {result.idcc}
                              </CardDescription>
                            </div>
                            <ArrowRight className="h-4 w-4 text-orange-500 flex-shrink-0 mt-1" />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Codes NAF :</div>
                              <div className="flex flex-wrap gap-1">
                                {result.nafCodes.slice(0, 6).map((code, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {code}
                                  </Badge>
                                ))}
                                {result.nafCodes.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{result.nafCodes.length - 6} autres
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Secteurs :</div>
                              <div className="flex flex-wrap gap-1">
                                {result.sectors.slice(0, 3).map((sector, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {sector}
                                  </Badge>
                                ))}
                                {result.sectors.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{result.sectors.length - 3} autres
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  !isSearchingNaf && (
                    <Card className="text-center py-8">
                      <CardContent>
                        <div className="text-gray-500">
                          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg mb-2">Recherche par Code NAF</p>
                          <p className="text-sm">
                            Tapez un code NAF ou un secteur d'activité pour trouver les conventions correspondantes
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}