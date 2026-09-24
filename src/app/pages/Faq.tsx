import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';

const FAQ_ITEMS: { question: string; reponse: React.ReactNode }[] = [
  {
    question: "Qui peut s'inscrire au registre consulaire ?",
    reponse:
      "Tout ressortissant congolais résidant au Bénin peut s'inscrire au registre consulaire, gratuitement, depuis l'espace consulaire.",
  },
  {
    question: 'Quels documents dois-je fournir pour une carte consulaire ou un laissez-passer ?',
    reponse: (
      <>
        La liste précise dépend du type de demande. Elle est détaillée sur la page{' '}
        <Link to="/services" className="text-brand-green-600 font-semibold hover:underline">
          Services consulaires
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Combien de temps prend le traitement de ma demande ?',
    reponse:
      "Le délai dépend de l'option choisie au moment du dépôt (traitement standard, 24h ou même jour). Ces délais sont indiqués sur la page Services consulaires.",
  },
  {
    question: 'Comment suivre ma demande une fois déposée ?',
    reponse:
      "Une fois connecté à l'espace consulaire, votre demande apparaît avec son statut à jour (en cours, validée, prête au retrait, etc.).",
  },
  {
    question: "Je n'ai pas reçu mon email de vérification, que faire ?",
    reponse:
      "Vérifiez vos courriers indésirables, puis utilisez l'option \"Renvoyer l'email de vérification\" sur la page de connexion à l'espace consulaire.",
  },
  {
    question: 'Comment contacter le Consulat pour une autre question ?',
    reponse: (
      <>
        Via la page{' '}
        <Link to="/contact" className="text-brand-green-600 font-semibold hover:underline">
          Contact
        </Link>
        .
      </>
    ),
  },
];

export function Faq() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 pt-32 pb-20 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-900/50 to-slate-900/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Questions fréquentes</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Les réponses aux questions les plus courantes sur les démarches consulaires.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24 -mt-16 relative z-20">
        <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-3xl shadow-xl p-4 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-lg font-bold text-slate-900">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 leading-relaxed">{item.reponse}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-16">
          <p className="text-slate-500 mb-6">Vous ne trouvez pas la réponse à votre question ?</p>
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
