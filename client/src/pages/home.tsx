
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

  const filteredConventions = conventions.filter(
    conv => {
      const searchTerm = search.toLowerCase();
      const idMatch = conv.id && typeof conv.id === 'string' ? conv.id.toLowerCase().includes(searchTerm) : false;
      const nameMatch = conv.name && typeof conv.name === 'string' ? conv.name.toLowerCase().includes(searchTerm) : false;
      return idMatch || nameMatch;
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
            {filteredConventions.map((convention) => (
              <CommandItem
                key={convention.id}
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
