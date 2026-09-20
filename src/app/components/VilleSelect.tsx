import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { api } from '../../lib/api';

// Les 77 communes du Bénin viennent de l'API (source unique de vérité côté
// backend, voir Ressortissant::VILLES_BENIN) — mises en cache en mémoire le
// temps de la session pour éviter de rappeler l'endpoint à chaque champ affiché.
let villesCache: string[] | null = null;

interface VilleSelectProps {
  value: string | null;
  onChange: (ville: string | null) => void;
  placeholder?: string;
  /** Ajoute une option "Toutes les villes" en tête (utile pour un filtre). */
  allowClear?: boolean;
  clearLabel?: string;
}

export function VilleSelect({
  value,
  onChange,
  placeholder = 'Sélectionner une ville…',
  allowClear = false,
  clearLabel = 'Toutes les villes',
}: VilleSelectProps) {
  const [villes, setVilles] = useState<string[]>(villesCache ?? []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (villesCache) return;
    api
      .get<string[]>('/v1/communes-benin')
      .then((data) => {
        villesCache = data;
        setVilles(data);
      })
      .catch(() => {
        /* le champ reste vide si l'appel échoue — pas bloquant pour le reste du formulaire */
      });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            {value || (allowClear ? clearLabel : placeholder)}
          </span>
          <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une ville…" />
          <CommandList>
            <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value={clearLabel}
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                  {clearLabel}
                </CommandItem>
              )}
              {villes.map((ville) => (
                <CommandItem
                  key={ville}
                  value={ville}
                  onSelect={() => {
                    onChange(ville);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === ville ? 'opacity-100' : 'opacity-0')} />
                  {ville}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
