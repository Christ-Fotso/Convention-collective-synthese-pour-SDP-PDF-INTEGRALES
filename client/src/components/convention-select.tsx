import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Convention } from '@/types';

interface ConventionSelectProps {
  conventions: Convention[];
  selectedConvention?: Convention | null;
  onSelect: (convention: Convention) => void;
}

export function ConventionSelect({ 
  conventions, 
  selectedConvention, 
  onSelect 
}: ConventionSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredConventions = useMemo(() => {
    const searchLower = search.toLowerCase();
    return conventions.filter(
      conv => 
        conv.id.toLowerCase().includes(searchLower) ||
        conv.name.toLowerCase().includes(searchLower)
    );
  }, [conventions, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedConvention ? 
            `${selectedConvention.id} - ${selectedConvention.name}` : 
            "Sélectionner une convention..."
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Rechercher par IDCC ou nom..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Aucune convention trouvée.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredConventions.map((convention) => (
              <CommandItem
                key={convention.id}
                value={`${convention.id}-${convention.name}`}
                onSelect={() => {
                  onSelect(convention);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedConvention?.id === convention.id 
                      ? "opacity-100" 
                      : "opacity-0"
                  )}
                />
                <span className="font-medium">{convention.id}</span>
                <span className="ml-2 text-muted-foreground">{convention.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
