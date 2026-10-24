import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Megaphone, ArrowRight } from 'lucide-react';
import { ressortissantApi } from '../../lib/ressortissantApi';
import type { CampagneRessortissant } from './types';

// Bandeau affiché en haut de l'espace consulaire tant qu'une campagne est
// ouverte et que le ressortissant n'y est pas encore inscrit.
export function CampagneBanner() {
  const { pathname } = useLocation();
  const [campagne, setCampagne] = useState<CampagneRessortissant | null>(null);

  useEffect(() => {
    let annule = false;
    ressortissantApi
      .get<{ campagnes: CampagneRessortissant[] }>('/v1/ressortissant/campagnes')
      .then((data) => !annule && setCampagne(data.campagnes.find((c) => !c.inscription) ?? null))
      .catch(() => !annule && setCampagne(null));
    return () => {
      annule = true;
    };
  }, [pathname]);

  if (!campagne || pathname.endsWith('/campagnes')) return null;

  return (
    <Link
      to="/espace-consulaire/campagnes"
      className="group mb-6 flex items-center gap-4 rounded-2xl bg-brand-green-600 text-white px-5 py-4 hover:bg-brand-green-700 transition-colors"
    >
      <Megaphone className="w-6 h-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate">{campagne.titre}</p>
        <p className="text-sm text-white/80">
          {campagne.date_fin
            ? `Inscrivez-vous avant le ${new Date(campagne.date_fin).toLocaleDateString('fr-FR', { dateStyle: 'long' })}.`
            : 'Une campagne est ouverte : inscrivez-vous.'}
        </p>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 group-hover:gap-2.5 transition-all">
        Participer <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
