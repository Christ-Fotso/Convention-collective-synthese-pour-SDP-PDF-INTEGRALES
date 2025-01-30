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
      <Card className="max-w-6xl mx-auto p-8">
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Rechercher par IDCC ou nom..." 
            value={search}
            onValueChange={setSearch}
            className="h-10"
          />

          <ScrollArea>
            <CommandEmpty>Aucune convention trouvée.</CommandEmpty>
            <CommandGroup>
              {filteredConventions.map((convention) => (
                <CommandItem
                  key={convention.id}
                  onSelect={() => navigate(`/chat/${convention.id}`)}
                  className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 bg-green-50/50 dark:bg-green-900/10 my-1 rounded-md py-3"
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