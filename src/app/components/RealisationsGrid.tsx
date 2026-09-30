import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

interface Realisation {
  id: number;
  titre: string;
  description: string | null;
  photo_url: string | null;
  date_realisation: string | null;
}

interface RealisationsGridProps {
  rubrique: 'communaute' | 'culture_patrimoine';
  titre: string;
  intro?: string;
}

function formatDate(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// Section publique alimentée depuis l'admin (page Réalisations). Rien
// n'est affiché tant qu'aucune entrée n'est publiée pour la rubrique.
export function RealisationsGrid({ rubrique, titre, intro }: RealisationsGridProps) {
  const [items, setItems] = useState<Realisation[] | null>(null);

  useEffect(() => {
    let annule = false;
    api
      .get<Realisation[]>(`/v1/realisations?rubrique=${rubrique}`)
      .then((data) => !annule && setItems(data))
      .catch(() => !annule && setItems([]));
    return () => {
      annule = true;
    };
  }, [rubrique]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{titre}</h2>
        {intro && <p className="text-slate-500">{intro}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((r, i) => {
          const date = formatDate(r.date_realisation);
          return (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden"
            >
             <Link to={`/realisations/${r.id}`} className="group flex flex-col h-full">
              {r.photo_url && (
                <img src={r.photo_url} alt={r.titre} loading="lazy" className="w-full h-56 object-cover" />
              )}
              <div className="p-6 flex flex-col flex-1">
                {date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 capitalize">
                    <Calendar className="w-3.5 h-3.5" /> {date}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{r.titre}</h3>
                {r.description && (
                  <p className="text-slate-500 leading-relaxed whitespace-pre-line line-clamp-3">{r.description}</p>
                )}
                <span className="mt-auto pt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-green-600 group-hover:gap-3 transition-all">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </span>
              </div>
             </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
