import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CreditCard, FileText, CheckCircle2, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

interface DelaiInfo {
  delai: string;
  label: string;
}

interface TarifFourchette {
  devise: string;
  montant_min: number;
  montant_max: number;
  delais: DelaiInfo[];
}

interface PieceRequise {
  label: string;
  aide: string | null;
  obligatoire: boolean;
  nombre_requis: number;
  formats_acceptes: string[];
}

interface ServicePublic {
  type_demande: string;
  tarif: TarifFourchette | null;
  pieces_requises: PieceRequise[];
}

const LABELS_TYPE: Record<string, { titre: string; description: string; icon: React.ReactNode }> = {
  carte_consulaire: {
    titre: 'Carte consulaire',
    description:
      "Document qui atteste de votre inscription au registre consulaire et facilite vos démarches auprès des autorités béninoises.",
    icon: <CreditCard className="w-6 h-6" />,
  },
  laissez_passer: {
    titre: 'Laissez-passer',
    description:
      "Titre de voyage provisoire délivré en cas de perte, de vol ou d'expiration de votre passeport congolais.",
    icon: <FileText className="w-6 h-6" />,
  },
};

function formatMontant(montant: number, devise: string) {
  return `${Math.round(montant).toLocaleString('fr-FR')} ${devise}`;
}

export function Services() {
  const [services, setServices] = useState<ServicePublic[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    api
      .get<ServicePublic[]>('/v1/services')
      .then((data) => {
        if (!annule) setServices(data);
      })
      .catch((err: unknown) => {
        if (!annule) {
          setErreur(err instanceof ApiError ? err.message : "Impossible de charger les services pour le moment.");
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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Services consulaires</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Carte consulaire, laissez-passer : les pièces à fournir et les délais, avant de créer votre demande
            dans l'espace consulaire.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-24">
        {erreur && (
          <div className="max-w-2xl mx-auto mb-16 text-center text-slate-500">{erreur}</div>
        )}

        {!services && !erreur && (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin" />
          </div>
        )}

        {services && services.length === 0 && (
          <div className="max-w-2xl mx-auto text-center text-slate-500">
            Aucun service n'est configuré pour le moment.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 -mt-32 relative z-20">
          {services?.map((service, i) => {
            const meta = LABELS_TYPE[service.type_demande] ?? {
              titre: service.type_demande,
              description: '',
              icon: <FileText className="w-6 h-6" />,
            };

            return (
              <motion.div
                key={service.type_demande}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 md:p-10 flex flex-col"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-green-50 text-brand-green-600 flex items-center justify-center mb-6">
                  {meta.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{meta.titre}</h2>
                {meta.description && (
                  <p className="text-slate-500 mb-6 leading-relaxed">{meta.description}</p>
                )}

                {service.tarif && (
                  <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                    <div className="text-sm text-slate-400 mb-1">Tarif</div>
                    <div className="text-xl font-bold text-slate-900 mb-3">
                      {service.tarif.montant_min === service.tarif.montant_max
                        ? formatMontant(service.tarif.montant_min, service.tarif.devise)
                        : `${formatMontant(service.tarif.montant_min, service.tarif.devise)} – ${formatMontant(
                            service.tarif.montant_max,
                            service.tarif.devise
                          )}`}
                      <span className="text-sm font-normal text-slate-400"> selon délai choisi</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.tarif.delais.map((d) => (
                        <span
                          key={d.delai}
                          className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {service.pieces_requises.length > 0 && (
                  <div className="mb-8">
                    <div className="text-sm font-semibold text-slate-900 mb-3">Pièces à fournir</div>
                    <ul className="space-y-2.5">
                      {service.pieces_requises.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0 mt-0.5" />
                          <span>
                            {p.label}
                            {p.nombre_requis > 1 && ` (x${p.nombre_requis})`}
                            {!p.obligatoire && <span className="text-slate-400"> — optionnel</span>}
                            {p.aide && <span className="block text-xs text-slate-400 mt-0.5">{p.aide}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  to="/espace-consulaire/login"
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-brand-green-600 text-white font-bold py-4 rounded-2xl hover:bg-brand-green-700 transition-colors"
                >
                  Faire ma demande
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto text-center mt-20">
          <p className="text-slate-500">
            Vous n'êtes pas encore inscrit au registre consulaire ? L'inscription est gratuite et se fait en
            quelques minutes depuis l'espace consulaire, avant toute demande.
          </p>
        </div>
      </div>
    </div>
  );
}
