import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Handshake, Building2, Landmark, Globe2, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

interface PartenairePublic {
  id: number;
  nom: string;
  description: string | null;
  logo_url: string | null;
  site_web: string | null;
  type: string | null;
  type_label: string;
  secteur_activite: string | null;
  pays: string | null;
  ville: string | null;
}

export function CongoBenin() {
  const [partenaires, setPartenaires] = useState<PartenairePublic[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    api
      .get<PartenairePublic[]>('/v1/partenaires')
      .then((data) => {
        if (!annule) setPartenaires(data);
      })
      .catch((err: unknown) => {
        if (!annule) {
          setErreur(err instanceof ApiError ? err.message : 'Impossible de charger les partenaires pour le moment.');
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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Congo–Bénin</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Diplomatie économique : coopération bilatérale, partenaires institutionnels et opportunités d'affaires
            entre la République du Congo et la République du Bénin.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        {/* Piliers de la coopération */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 -mt-32 relative z-20">
          {[
            {
              icon: <Landmark className="w-7 h-7" />,
              title: 'Relations institutionnelles',
              desc: "Le Consulat contribue à entretenir le dialogue entre les institutions congolaises et béninoises.",
            },
            {
              icon: <Handshake className="w-7 h-7" />,
              title: 'Coopération économique',
              desc: "Faciliter la mise en relation entre acteurs économiques des deux pays, dans les secteurs porteurs.",
            },
            {
              icon: <Globe2 className="w-7 h-7" />,
              title: "Opportunités d'affaires",
              desc: "Accompagner les initiatives commerciales et les projets d'investissement entre le Congo et le Bénin.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-green-50 text-brand-green-600 flex items-center justify-center mb-5">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
              <p className="text-slate-500 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Partenaires */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Nos partenaires</h2>
          <p className="text-slate-500">
            Institutions, entreprises et organisations qui accompagnent cette coopération.
          </p>
        </div>

        {erreur && <div className="text-center text-slate-500 mb-16">{erreur}</div>}

        {!partenaires && !erreur && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin" />
          </div>
        )}

        {partenaires && partenaires.length === 0 && (
          <div className="text-center text-slate-500 mb-16">
            Aucun partenaire répertorié pour le moment.
          </div>
        )}

        {partenaires && partenaires.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {partenaires.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.05 }}
                className="border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.nom} className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1.5" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{p.nom}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">{p.type_label}</div>
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{p.description}</p>
                )}
                {p.site_web && (
                  <a
                    href={p.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:underline"
                  >
                    Visiter le site
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA partenariat */}
        <div className="max-w-3xl mx-auto text-center border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Vous portez un projet Congo–Bénin ?</h2>
          <p className="text-slate-500 mb-6">
            Le Consulat est à l'écoute des initiatives économiques et institutionnelles entre les deux pays.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-brand-green-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-brand-green-700 transition-colors"
          >
            Nous contacter
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
