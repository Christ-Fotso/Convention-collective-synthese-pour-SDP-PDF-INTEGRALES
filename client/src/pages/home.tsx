import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, X } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div className="mb-6 p-4">
          {/* Moteur de recherche unique */}
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <Input
              type="text"
              placeholder="Rechercher par IDCC, nom de convention ou code NAF..."
              className="h-12 pl-4 pr-24 text-lg w-full border-2 focus:border-primary"
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
                  className="text-sm bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center"
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

          {/* Résultats de recherche NAF */}
          {showNafSearch && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Résultats NAF ({nafResults.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNafSearch}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {nafResults.length === 0 ? (
                <p className="text-blue-600 text-sm">Aucune convention trouvée pour ce code NAF</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nafResults.map((entry) => (
                    <div 
                      key={entry.conventionId}
                      className="p-2 bg-white rounded border cursor-pointer hover:bg-blue-50"
                      onClick={() => navigate(`/convention/${entry.conventionId}`)}
                    >
                      <div className="font-medium text-green-600 text-sm">
                        {entry.conventionName}
                      </div>
                      <div className="text-xs text-gray-500">IDCC {entry.idcc}</div>
                      {entry.nafCodes.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {entry.nafCodes.slice(0, 3).map((code) => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                          {entry.nafCodes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.nafCodes.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Liste des conventions classique */}
        {!showNafSearch && (
          <div className="bg-white shadow-md">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {filteredConventions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {search ? `Aucune convention trouvée pour "${search}"` : "Chargement des conventions..."}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConventions.map((convention, index) => (
                    <div
                      key={`${convention.id || convention.name || index}-${index}`}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const conventionId = convention.id || encodeURIComponent(convention.name);
                        navigate(`/convention/${conventionId}`);
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-base font-medium text-green-600">
                          {convention.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {convention.id ? `IDCC ${convention.id}` : "Convention sans IDCC"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}