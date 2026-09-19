import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, CalendarDays, Wallet, ArrowRight, Calendar } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { membreApi } from '../../lib/memberApi';
import { useMemberAuth } from '../context/MemberAuthContext';
import { CotisationHistoriqueEntry } from '../admin/types';

interface Actualite {
  id: number;
  titre: string;
  description: string | null;
  image_url: string | null;
  type: string;
  type_label: string;
  date: string;
}

interface HistoriqueResponse {
  historique: CotisationHistoriqueEntry[];
}

interface EvenementApercu {
  id: number;
  titre: string;
  periode: string;
  lieu: string | null;
}

export function MemberDashboard() {
  const { membre } = useMemberAuth();
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [errorFeed, setErrorFeed] = useState<string | null>(null);

  const [moisCourant, setMoisCourant] = useState<CotisationHistoriqueEntry | null>(null);
  const [prochainEvenement, setProchainEvenement] = useState<EvenementApercu | null>(null);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  useEffect(() => {
    api
      .get<Actualite[]>('/v1/actualites')
      .then(setActualites)
      .catch((err) => setErrorFeed(err instanceof ApiError ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoadingFeed(false));

    Promise.all([
      membreApi.get<HistoriqueResponse>('/v1/membre/mes-cotisations'),
      membreApi.get<EvenementApercu[]>('/v1/membre/evenements'),
    ])
      .then(([cotisations, evenements]) => {
        setMoisCourant(cotisations.historique[0] || null);
        setProchainEvenement(evenements[0] || null);
      })
      .catch(() => {
        // le fil reste utilisable même si les widgets échouent
      })
      .finally(() => setLoadingWidgets(false));
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
      {/* Fil d'actualité */}
      <div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <h1 className="text-lg font-bold text-slate-900">Bonjour {membre?.prenom} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Voici les dernières actualités du consulat.</p>
        </div>

        {loadingFeed && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {errorFeed && !loadingFeed && <p className="text-slate-500 text-center py-10">{errorFeed}</p>}

        {!loadingFeed && !errorFeed && actualites.length === 0 && (
          <p className="text-slate-400 text-center py-10 text-sm">Aucune actualité pour le moment.</p>
        )}

        <div className="space-y-5">
          {actualites.map((a) => (
            <Link
              key={a.id}
              to={`/news/${a.id}`}
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {a.image_url && (
                <img src={a.image_url} alt={a.titre} className="w-full h-56 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="bg-brand-green-50 text-brand-green-700 px-2 py-0.5 rounded-full font-medium">
                    {a.type_label}
                  </span>
                  <span>{a.date}</span>
                </div>
                <h2 className="font-bold text-slate-900 mb-1.5">{a.titre}</h2>
                {a.description && (
                  <p className="text-sm text-slate-600 line-clamp-3">{a.description}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-brand-green-700 font-medium mt-3">
                  Lire l'article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Widgets */}
      <div className="space-y-4">
        {loadingWidgets ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <Link
              to="/membre/cotisations"
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                <Wallet className="w-3.5 h-3.5" /> Cotisation du mois
              </div>
              {moisCourant?.statut === 'payee' ? (
                <p className="flex items-center gap-2 text-brand-green-700 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> À jour
                </p>
              ) : (
                <p className="flex items-center gap-2 text-brand-red-600 font-semibold text-sm">
                  <XCircle className="w-4 h-4" /> Impayée
                </p>
              )}
            </Link>

            <Link
              to="/membre/evenements"
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                <CalendarDays className="w-3.5 h-3.5" /> Prochain événement
              </div>
              {prochainEvenement ? (
                <>
                  <p className="font-semibold text-sm text-slate-900">{prochainEvenement.titre}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" /> {prochainEvenement.periode}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">Aucun événement à venir</p>
              )}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
