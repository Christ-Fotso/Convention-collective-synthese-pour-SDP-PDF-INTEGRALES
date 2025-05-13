
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    
    // Toujours trier par ordre alphabétique du nom
    results.sort((a, b) => {
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
    
    setFilteredConventions(results);
  }, [search, conventions]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Conventions Collectives
        </h1>
        
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Rechercher par IDCC ou nom de convention..."
            className="h-12 pl-4 pr-10 text-lg w-full border-2 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-3 top-3 text-gray-400">
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
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-3 bg-gray-50 border-b text-sm font-medium">
            {filteredConventions.length} conventions trouvées
          </div>
          
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {filteredConventions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune convention trouvée.
              </div>
            ) : (
              <div className="divide-y">
                {filteredConventions.map((convention, index) => (
                  <div
                    key={`${convention.id || index}-${index}`}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => convention.id ? navigate(`/chat/${convention.id}`) : alert("Cette convention n'a pas d'IDCC et ne peut pas être consultée pour le moment.")}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-medium text-green-600">
                        {convention.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {convention.id ? `IDCC ${convention.id}` : "Sans IDCC"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
