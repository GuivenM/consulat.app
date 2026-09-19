import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Membre } from '../admin/types';
import { Zoomable } from '../components/Zoomable';

export function About() {
  const [bureau, setBureau] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Membre[]>('/v1/membres/bureau')
      .then(setBureau)
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Le bureau renvoyé par l'API est déjà trié par rang (Président en premier,
  // etc.) — utilisé plus bas pour la liste de l'équipe.

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
           <img src="/logo-consulat-mark.png" alt="Consulat Honoraire du Congo au Bénin" className="w-24 h-24 mx-auto mb-4" />
           <div className="inline-block h-12 mb-6">
             <img src="/logo-consulat-texte-blanc.png" alt="Le Consulat Honoraire de la République du Congo au Bénin" className="h-full w-auto object-contain" />
           </div>
           <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Le Consulat</h1>
           <p className="text-xl text-slate-300 max-w-2xl mx-auto">
             Découvrez les missions et l'organisation du Consulat Honoraire de la République du Congo au Bénin,
             au service de la communauté congolaise au Bénin.
           </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        {/* Mission Vision Values - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 -mt-32 relative z-20">
          {[
            { title: "Vision", desc: "Faire du Consulat un pont de confiance entre la République du Congo et sa diaspora, au service d'une communauté congolaise unie et bien intégrée au Bénin.", color: "bg-brand-green-600", text: "text-white" },
            { title: "Mission", desc: "Accompagner les ressortissants congolais du Bénin dans leurs démarches consulaires et représenter les intérêts de la République du Congo.", color: "bg-white", text: "text-slate-900" },
            { title: "Valeurs", desc: "Service, Intégrité, Proximité et Solidarité.", color: "bg-brand-gold-400", text: "text-brand-green-950" }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${card.color} ${card.text} p-10 rounded-3xl shadow-xl flex flex-col justify-between h-80 hover:transform hover:-translate-y-2 transition-transform duration-300`}
            >
              <h3 className="text-3xl font-bold">{card.title}</h3>
              <p className="text-lg opacity-90 font-medium leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Statement Section */}
        <div className="max-w-4xl mx-auto mb-32 text-center">
          <p className="text-2xl md:text-3xl font-light text-slate-800 leading-relaxed mb-8">
            Une conviction guide son action : <span className="font-bold text-brand-green-600">une communauté organisée</span> et bien accompagnée est une force pour ses membres comme pour ses deux pays.
          </p>
          <div>
            <div className="font-bold text-slate-900">Dr. Fidèle Elenga</div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">Consul Honoraire de la République du Congo au Bénin</div>
          </div>
        </div>

        {/* Team Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">L'équipe du Consulat</h2>

          {loading && (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {!loading && bureau.length === 0 && (
            <div className="text-center py-12 text-slate-500">Composition du bureau à venir.</div>
          )}

          {/* flex-wrap plutôt qu'une grille stricte : le nombre de membres du
              bureau varie (ajouts/retraits en admin), ça reste centré et propre
              que ce soit 2, 5 ou 9 cartes. */}
          <div className="flex flex-wrap justify-center gap-6">
            {bureau.map((member) => (
              <div
                key={member.id}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] bg-slate-50 p-6 rounded-2xl text-center hover:bg-white hover:shadow-lg transition-all border border-slate-100"
              >
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl">
                  {member.photo_url ? (
                    <Zoomable src={member.photo_url} alt={member.nom_complet} className="w-full h-full object-cover" />
                  ) : (
                    <span>{member.prenom[0]}{member.nom[0]}</span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900">{member.nom_complet}</h3>
                <p className="text-sm text-brand-green-600 font-medium">{member.poste}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
