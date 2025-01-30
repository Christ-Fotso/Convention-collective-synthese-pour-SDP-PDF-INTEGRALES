import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getConventions } from '@/lib/api';
import { Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: conventions = [] } = useQuery({
    queryKey: ['/api/conventions'],
    queryFn: getConventions,
  });

  const filteredConventions = conventions.filter(
    conv => 
      conv.id.toLowerCase().includes(search.toLowerCase()) ||
      conv.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Assistant Conventions Collectives
      </h1>

      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Rechercher une convention collective</h2>
        </div>

        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Rechercher par IDCC ou nom..." 
            value={search}
            onValueChange={setSearch}
            className="h-10"
          />

          <ScrollArea className="h-[600px]">
            <CommandEmpty>Aucune convention trouvée.</CommandEmpty>
            <CommandGroup>
              {filteredConventions.map((convention) => (
                <CommandItem
                  key={convention.id}
                  onSelect={() => navigate(`/chat/${convention.id}`)}
                  className="cursor-pointer hover:bg-muted py-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-medium">
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
      </Card>
    </div>
  );
}