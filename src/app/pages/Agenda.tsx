import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MapPin, Loader2, CalendarDays } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Actualite } from '../admin/types';

export function Agenda() {
  const [evenements, setEvenements] = useState<Actualite[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    api
      .get<Actualite[]>('/v1/actualites/type/evenement')
      .then((items) => {
        if (annule || !Array.isArray(items)) return;
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        setEvenements(
          items
            .filter((e) => e.date_evenement && new Date(e.date_evenement) >= aujourdhui)
            .sort((a, b) => new Date(a.date_evenement!).getTime() - new Date(b.date_evenement!).getTime())
        );
      })
      .catch((err: unknown) => {
        if (!annule) {
          setErreur(err instanceof ApiError ? err.message : "Impossible de charger l'agenda pour le moment.");
        }
      });
    return () => {
      annule = true;
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Agenda</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Les prochains rendez-vous et évènements organisés ou relayés par le Consulat.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24 -mt-16 relative z-20">
        {erreur && <div className="text-center text-slate-500">{erreur}</div>}

        {!evenements && !erreur && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin" />
          </div>
        )}

        {evenements && evenements.length === 0 && (
          <div className="max-w-md mx-auto text-center bg-slate-50 rounded-3xl p-12">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun évènement à venir pour le moment.</p>
          </div>
        )}

        {evenements && evenements.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {evenements.map((ev, i) => {
              const date = new Date(ev.date_evenement as string);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.05 }}
                >
                  <Link
                    to={`/news/${ev.id}`}
                    className="group flex gap-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="shrink-0 w-16 h-16 rounded-xl bg-brand-green-600 text-white flex flex-col items-center justify-center leading-none">
                      <span className="text-2xl font-bold">{date.getDate()}</span>
                      <span className="text-xs uppercase tracking-wider mt-1">
                        {date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-snug mb-2 group-hover:text-brand-green-700 transition-colors">
                        {ev.titre}
                      </h3>
                      {ev.lieu_evenement && (
                        <p className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin size={14} /> {ev.lieu_evenement}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
