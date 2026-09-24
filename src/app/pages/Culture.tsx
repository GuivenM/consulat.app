import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Music, Palette, UtensilsCrossed } from 'lucide-react';

export function CulturePatrimoine() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Culture & Patrimoine</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            La richesse culturelle de la République du Congo, ses expressions artistiques et ses liens de longue
            date avec le Bénin.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 -mt-32 relative z-20">
          {[
            {
              icon: <Music className="w-7 h-7" />,
              title: 'Musique & Arts',
              desc: "La rumba congolaise et les musiques du Congo rayonnent bien au-delà de ses frontières, portées par la diaspora établie au Bénin.",
            },
            {
              icon: <Palette className="w-7 h-7" />,
              title: 'Patrimoine',
              desc: "Un patrimoine culturel et historique varié, que la communauté congolaise du Bénin s'attache à transmettre et à faire connaître.",
            },
            {
              icon: <UtensilsCrossed className="w-7 h-7" />,
              title: 'Gastronomie',
              desc: "Un pont supplémentaire entre les deux communautés : la cuisine congolaise trouve naturellement sa place au Bénin.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-gold-50 text-brand-gold-500 flex items-center justify-center mb-5">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
              <p className="text-slate-500 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Un évènement culturel à proposer ?</h2>
          <p className="text-slate-500 mb-6">
            Le Consulat relaie volontiers les initiatives culturelles portées par la communauté congolaise au Bénin.
          </p>
          <Link to="/contact" className="text-brand-green-600 font-bold hover:underline">
            Nous contacter →
          </Link>
        </div>
      </div>
    </div>
  );
}
