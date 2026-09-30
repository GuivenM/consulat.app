import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
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

// Quartiers par commune, mis en cache le temps de la session. Une liste vide
// signifie « pas de liste pour cette commune » : on retombe sur une saisie libre.
const quartiersCache = new Map<string, string[]>();

interface QuartierSelectProps {
  ville: string | null;
  value: string | null;
  onChange: (quartier: string) => void;
  required?: boolean;
}

export function QuartierSelect({ ville, value, onChange, required }: QuartierSelectProps) {
  const [quartiers, setQuartiers] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saisieLibre, setSaisieLibre] = useState(false);

  useEffect(() => {
    setSaisieLibre(false);
    if (!ville) {
      setQuartiers(null);
      return;
    }
    const enCache = quartiersCache.get(ville);
    if (enCache) {
      setQuartiers(enCache);
      return;
    }
    let annule = false;
    setQuartiers(null);
    api
      .get<string[]>(`/v1/quartiers?ville=${encodeURIComponent(ville)}`)
      .then((data) => {
        quartiersCache.set(ville, data);
        if (!annule) setQuartiers(data);
      })
      .catch(() => !annule && setQuartiers([]));
    return () => {
      annule = true;
    };
  }, [ville]);

  if (!ville) {
    return <Input disabled placeholder="Choisissez d'abord une ville" />;
  }

  if (quartiers === null) {
    return <Input disabled placeholder="Chargement des quartiers…" />;
  }

  // Commune sans liste, « Autre quartier » choisi, ou valeur historique hors liste.
  const horsListe = !!value && !quartiers.includes(value);
  if (quartiers.length === 0 || saisieLibre || horsListe) {
    return (
      <div>
        <Input required={required} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Nom du quartier" />
        {quartiers.length > 0 && (
          <button
            type="button"
            className="text-xs text-brand-green-600 hover:underline mt-1"
            onClick={() => {
              setSaisieLibre(false);
              onChange('');
            }}
          >
            Revenir à la liste des quartiers
          </button>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            {value || 'Sélectionner un quartier…'}
          </span>
          <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un quartier…" />
          <CommandList>
            <CommandEmpty>Aucun quartier trouvé.</CommandEmpty>
            <CommandGroup>
              {quartiers.map((q) => (
                <CommandItem
                  key={q}
                  value={q}
                  onSelect={() => {
                    onChange(q);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === q ? 'opacity-100' : 'opacity-0')} />
                  {q}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="autre quartier non liste"
                onSelect={() => {
                  onChange('');
                  setSaisieLibre(true);
                  setOpen(false);
                }}
              >
                Autre quartier (non listé)…
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
