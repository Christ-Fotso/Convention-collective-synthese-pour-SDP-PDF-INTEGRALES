
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NafSearch } from "@/components/naf-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Building2 } from "lucide-react";

// Définition du type Convention
type Convention = {
  id: string;
  name: string;
  url?: string;
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [filteredConventions, setFilteredConventions] = useState<Convention[]>([]);
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

  const handleConventionSelect = (conventionId: string) => {
    navigate(`/convention/${conventionId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div className="mb-6 p-4">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Liste des conventions
              </TabsTrigger>
              <TabsTrigger value="naf" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Recherche par NAF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher par IDCC ou nom de convention..."
                  className="h-12 pl-4 pr-10 text-lg w-full border-2 focus:border-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="absolute right-7 top-7 text-gray-400">
                  {search && (
                    <button 
                      onClick={() => setSearch("")}
                      className="text-sm bg-gray-200 hover:bg-gray-300 rounded-full h-6 w-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-white shadow-md rounded-lg">
                <ScrollArea className="h-[calc(100vh-20rem)]">
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
            </TabsContent>

            <TabsContent value="naf">
              <NafSearch onConventionSelect={handleConventionSelect} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
