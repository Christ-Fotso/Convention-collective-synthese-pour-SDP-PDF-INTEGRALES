
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: conventions = [] } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  // Log pour déboguer la recherche
  console.log("Nombre total de conventions:", conventions.length);
  if (search) {
    console.log("Recherche:", search);
    // Log du premier élément pour voir la structure
    if (conventions.length > 0) {
      console.log("Premier élément:", conventions[0]);
    }
  }

  const filteredConventions = conventions.filter(
    conv => {
      // Si la recherche est vide, on affiche tout
      if (!search.trim()) {
        return true;
      }
      
      const searchTerm = search.toLowerCase().trim();
      
      // Version simplifiée qui devrait fonctionner avec tous les types de données
      const id = String(conv.id || '').toLowerCase();
      const name = String(conv.name || '').toLowerCase();
      
      const idMatch = id.includes(searchTerm);
      const nameMatch = name.includes(searchTerm);
      
      // Résultat du filtre
      const isMatch = idMatch || nameMatch;
      
      // Log détaillé pour les 5 premiers éléments si on a une recherche active
      if (search && conventions.indexOf(conv) < 5) {
        console.log(`Convention ${id} - ${name}:`, { idMatch, nameMatch, isMatch });
      }
      
      return isMatch;
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Command className="rounded-none border-0">
        <CommandInput 
          placeholder="Rechercher par IDCC ou nom..." 
          value={search}
          onValueChange={setSearch}
          className="h-16 text-lg"
        />

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <CommandEmpty>Aucune convention trouvée.</CommandEmpty>
          <CommandGroup>
            {filteredConventions.map((convention, index) => (
              <CommandItem
                key={`${convention.id}-${index}`}
                onSelect={() => navigate(`/chat/${convention.id}`)}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/20 p-6 border-b"
              >
                <div className="flex flex-col gap-2">
                  <div className="text-base font-medium text-green-600 dark:text-green-400">
                    IDCC {convention.id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {convention.name}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </Command>
    </div>
  );
}
