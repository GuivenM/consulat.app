import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, Handshake, ShieldCheck, ArrowRight } from 'lucide-react';

// Portrait et biographie détaillée à compléter avec les éléments validés par
// le Consulat (parcours, date de nomination, etc.) — non inventés ici.
const CONSUL = {
  nom: 'Dr. Fidèle Elenga',
  titre: 'Consul Honoraire de la République du Congo au Bénin',
  citation:
    "Notre mission est de contribuer à rapprocher la République du Congo de la République du Bénin, tout en restant au plus près de nos compatriotes et de leurs préoccupations.",
  photo: null as string | null,
};

export function ConsulHonoraire() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Le Consul Honoraire</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Représentant de la République du Congo au Bénin, au service de la communauté congolaise et des
            relations bilatérales entre les deux pays.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        {/* Portrait + présentation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-24 -mt-32 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center"
          >
            <div className="w-32 h-32 rounded-full bg-slate-100 mb-6 flex items-center justify-center overflow-hidden">
              {CONSUL.photo ? (
                <img src={CONSUL.photo} alt={CONSUL.nom} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{CONSUL.nom}</h2>
            <p className="text-sm text-brand-green-600 font-semibold uppercase tracking-wide mt-1">{CONSUL.titre}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-brand-green-600 text-white rounded-3xl shadow-xl p-10 flex items-center"
          >
            <p className="text-xl md:text-2xl font-light leading-relaxed">"{CONSUL.citation}"</p>
          </motion.div>
        </div>

        {/* Rôle d'un Consul Honoraire */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Le rôle du Consul Honoraire</h2>
          <p className="text-slate-500">
            Nommé par la République du Congo, le Consul Honoraire assure une présence consulaire de proximité au
            Bénin, sans être un agent diplomatique de carrière.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <Users className="w-7 h-7" />,
              title: 'Assistance aux ressortissants',
              desc: "Accompagner les Congolais établis au Bénin dans leurs démarches consulaires et les orienter en cas de difficulté.",
            },
            {
              icon: <Handshake className="w-7 h-7" />,
              title: 'Relations bilatérales',
              desc: "Contribuer au rapprochement entre la République du Congo et la République du Bénin, notamment sur le plan économique.",
            },
            {
              icon: <ShieldCheck className="w-7 h-7" />,
              title: 'Représentation',
              desc: "Représenter les intérêts de la République du Congo auprès des autorités et institutions béninoises.",
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

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Besoin d'une démarche consulaire ?</h2>
          <p className="text-slate-500 mb-6">
            Le Consulat reste à la disposition de la communauté congolaise pour toute question.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 bg-brand-green-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-brand-green-700 transition-colors"
          >
            Voir les services consulaires
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
