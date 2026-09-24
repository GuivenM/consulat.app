import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Zoomable } from '../components/Zoomable';

interface Actualite {
  id: number;
  titre: string;
  description: string | null;
  image_url: string | null;
  photos_urls?: string[];
  type: string;
  type_label: string;
  date: string; // created_at formaté d/m/Y par l'API
  created_at: string;
}

const FILTRES = [
  { label: 'Tous', value: null },
  { label: 'Événements', value: 'evenement' },
  { label: 'Éducation', value: 'education' },
  { label: 'Culture', value: 'culture' },
  { label: 'Médiathèque', value: 'media' },
];

export function News() {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Actualite[]>('/v1/actualites')
      .then(setActualites)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const items = filtre && filtre !== 'media' ? actualites.filter((a) => a.type === filtre) : actualites;

  // Médiathèque : agrège la photo de couverture + les photos jointes de
  // chaque actualité, chacune reliée à son actualité d'origine.
  const photosMedia = actualites.flatMap((a) => {
    const urls = [a.image_url, ...(a.photos_urls ?? [])].filter((u): u is string => !!u);
    return Array.from(new Set(urls)).map((url) => ({ url, actualite: a }));
  });

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Journal</h1>
            <p className="text-xl text-slate-500">L'actualité du consulat et de la communauté.</p>
          </div>

          <div className="flex gap-2 mt-6 md:mt-0 flex-wrap">
            {FILTRES.map((f) => (
              <button
                key={f.label}
                onClick={() => setFiltre(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filtre === f.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20 text-slate-500">{error}</div>
        )}

        {!loading && !error && filtre !== 'media' && items.length === 0 && (
          <div className="text-center py-20 text-slate-500">Aucune actualité pour le moment.</div>
        )}

        {!loading && !error && filtre === 'media' && photosMedia.length === 0 && (
          <div className="text-center py-20 text-slate-500">Aucune photo pour le moment.</div>
        )}

        {!loading && !error && filtre === 'media' ? (
          /* Médiathèque : grille photo, chaque vignette renvoie vers l'actualité d'origine */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photosMedia.map((p, i) => (
              <Link
                key={`${p.actualite.id}-${i}`}
                to={`/news/${p.actualite.id}`}
                className="group relative aspect-square rounded-2xl overflow-hidden block bg-slate-100"
              >
                <Zoomable
                  src={p.url}
                  alt={p.actualite.titre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-semibold line-clamp-2">{p.actualite.titre}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
        /* Bento Grid Layout for News */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[300px]">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={index === 0 ? 'md:col-span-2 md:row-span-2' : ''}
            >
            <Link
              to={`/news/${item.id}`}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer block h-full bg-white`}
            >
              {item.image_url ? (
                <Zoomable
                  src={item.image_url}
                  alt={item.titre}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white uppercase tracking-wider">
                      {item.type_label}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="text-white" size={20} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs mb-2">
                    <Calendar size={14} />
                    {item.date}
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">{item.titre}</h3>
                  {item.description && (
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </Link>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
