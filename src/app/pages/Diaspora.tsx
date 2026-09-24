import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, HeartHandshake, Globe2, ArrowRight } from 'lucide-react';

export function Diaspora() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Diaspora</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            La communauté congolaise au Bénin : sa vie associative, ses solidarités, et les liens qu'elle entretient
            avec la République du Congo.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 -mt-32 relative z-20">
          {[
            {
              icon: <Users className="w-7 h-7" />,
              title: 'Une communauté organisée',
              desc: "Le Consulat encourage la structuration de la communauté congolaise autour d'associations et d'initiatives qui facilitent l'intégration et l'entraide au Bénin.",
            },
            {
              icon: <HeartHandshake className="w-7 h-7" />,
              title: 'Solidarité & entraide',
              desc: "En cas de difficulté, la communauté et le Consulat restent un premier point d'appui. N'hésitez pas à signaler une situation qui nécessite un accompagnement.",
            },
            {
              icon: <Globe2 className="w-7 h-7" />,
              title: 'Rester relié à la mère patrie',
              desc: "S'inscrire au registre consulaire, c'est rester joignable pour les informations importantes et faciliter toutes vos démarches futures.",
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

        {/* CTA registre */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <p className="text-2xl md:text-3xl font-light text-slate-800 leading-relaxed mb-8">
            Vous résidez au Bénin ?{' '}
            <span className="font-bold text-brand-green-600">Inscrivez-vous au registre consulaire</span> pour
            bénéficier de l'accompagnement du Consulat.
          </p>
          <Link
            to="/espace-consulaire/login"
            className="inline-flex items-center gap-2 bg-brand-green-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-brand-green-700 transition-colors"
          >
            Accéder à l'espace consulaire
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Associations */}
        <div className="max-w-3xl mx-auto text-center border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Vous portez une association ou une initiative ?</h2>
          <p className="text-slate-500 mb-6">
            Le Consulat souhaite mieux connaître les initiatives portées par la communauté. Faites-vous connaître.
          </p>
          <Link to="/contact" className="text-brand-green-600 font-bold hover:underline">
            Nous contacter →
          </Link>
        </div>
      </div>
    </div>
  );
}
