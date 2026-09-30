import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Realisation } from '../admin/types';
import { Galerie, Lightbox } from './NewsDetail';

export function RealisationDetail() {
  const { id } = useParams<{ id: string }>();
  const [realisation, setRealisation] = useState<Realisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<Realisation>(`/v1/realisations/${id}`)
      .then(setRealisation)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  const retour =
    realisation?.rubrique === 'culture_patrimoine'
      ? { to: '/culture', label: 'Retour à Culture & Patrimoine' }
      : { to: '/communaute', label: 'Retour à la Communauté' };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-32 pb-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !realisation) {
    return (
      <div className="bg-slate-50 min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-slate-500 mb-6">{error || "Cette réalisation n'existe pas ou plus."}</p>
          <Link to="/communaute" className="text-slate-900 font-semibold hover:underline">
            &larr; Retour à la Communauté
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <Link to={retour.to} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={18} />
          {retour.label}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {realisation.photos_urls.length > 0 && (
            <Galerie photos={realisation.photos_urls} titre={realisation.titre} onOpen={setLightboxIndex} />
          )}

          <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
            {realisation.rubrique_label}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4 mb-4">{realisation.titre}</h1>

          {realisation.date_realisation && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-8">
              <Calendar size={16} />
              {new Date(realisation.date_realisation).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </div>
          )}

          {realisation.description && (
            <p className="text-xl text-slate-600 mb-8 leading-relaxed whitespace-pre-line">{realisation.description}</p>
          )}

          {realisation.contenu && (
            <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
              {realisation.contenu}
            </div>
          )}
        </motion.div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={realisation.photos_urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
