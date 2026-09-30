import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Loader2, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Actualite } from '../admin/types';

export function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [actualite, setActualite] = useState<Actualite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<Actualite>(`/v1/actualites/${id}`)
      .then(setActualite)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-32 pb-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !actualite) {
    return (
      <div className="bg-slate-50 min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-slate-500 mb-6">{error || "Cette publication n'existe pas ou plus."}</p>
          <Link to="/news" className="text-slate-900 font-semibold hover:underline">
            &larr; Retour au journal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Retour au journal
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {actualite.photos_urls.length > 0 && (
            <Galerie photos={actualite.photos_urls} titre={actualite.titre} onOpen={setLightboxIndex} />
          )}

          <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
            {actualite.type_label}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4 mb-4">
            {actualite.titre}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm mb-8">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {actualite.date_evenement
                ? new Date(actualite.date_evenement).toLocaleString('fr-FR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })
                : new Date(actualite.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </div>
            {actualite.lieu_evenement && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {actualite.lieu_evenement}
              </div>
            )}
            <span>Par {actualite.auteur}</span>
          </div>

          {actualite.description && (
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">{actualite.description}</p>
          )}

          <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
            {actualite.contenu}
          </div>
        </motion.div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={actualite.photos_urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </div>
  );
}

/**
 * Grille responsive de la galerie : 1 photo → pleine largeur, 2 → côte à
 * côte, 3+ → une grande + une colonne de vignettes (avec compteur "+N" sur
 * la dernière si la galerie est plus fournie que ce qu'affiche la grille).
 */
export function Galerie({
  photos,
  titre,
  onOpen,
}: {
  photos: string[];
  titre: string;
  onOpen: (index: number) => void;
}) {
  if (photos.length === 1) {
    return (
      <button
        onClick={() => onOpen(0)}
        className="block w-full rounded-3xl overflow-hidden mb-8 aspect-video bg-slate-200"
      >
        <img src={photos[0]} alt={titre} className="w-full h-full object-cover" />
      </button>
    );
  }

  const visibles = photos.slice(0, 4);
  const restantes = photos.length - visibles.length;

    return (
    <div className="grid grid-cols-2 grid-rows-1 gap-2 mb-8 rounded-3xl overflow-hidden aspect-video">
      <button
        onClick={() => onOpen(0)}
        className="relative min-h-0 overflow-hidden bg-slate-200"
      >
        <img
          src={photos[0]}
          alt={titre}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </button>

      <div
        className={`grid gap-2 min-h-0 ${
          visibles.length === 2 ? 'grid-rows-1' : visibles.length === 3 ? 'grid-rows-2' : 'grid-rows-3'
        }`}
      >
        {visibles.slice(1).map((url, i) => {
          const index = i + 1;
          const estDerniereVisible = index === visibles.length - 1 && restantes > 0;
          return (
            <button
              key={url}
              onClick={() => onOpen(index)}
              className="relative min-h-0 overflow-hidden bg-slate-200"
            >
              <img
                src={url}
                alt={`${titre} — photo ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {estDerniereVisible && (
                <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                  +{restantes}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Lightbox({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onChange]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-6 right-6 text-white/80 hover:text-white" onClick={onClose}>
        <X size={28} />
      </button>

      {photos.length > 1 && (
        <button
          className="absolute left-4 md:left-8 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onChange((index - 1 + photos.length) % photos.length);
          }}
        >
          <ChevronLeft size={36} />
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <button
          className="absolute right-4 md:right-8 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onChange((index + 1) % photos.length);
          }}
        >
          <ChevronRight size={36} />
        </button>
      )}

      {photos.length > 1 && (
        <div className="absolute bottom-6 text-white/70 text-sm">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
