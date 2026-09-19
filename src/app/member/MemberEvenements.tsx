import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { membreApi, ApiError } from '../../lib/memberApi';
import { useMemberAuth } from '../context/MemberAuthContext';
import { FedaPayButton } from '../components/FedaPayButton';
import { Button } from '../components/ui/button';
import { Evenement } from '../admin/types';

interface EvenementMembre extends Evenement {
  places_restantes: number | null;
  est_complet: boolean;
  mon_inscription: 'inscrit' | 'confirme' | 'present' | 'absent' | 'annule' | null;
}

export function MemberEvenements() {
  const { membre } = useMemberAuth();
  const [evenements, setEvenements] = useState<EvenementMembre[]>([]);
  const [loading, setLoading] = useState(true);
  const [enCours, setEnCours] = useState<number | null>(null);

  function charger() {
    return membreApi
      .get<EvenementMembre[]>('/v1/membre/evenements')
      .then(setEvenements)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Erreur de chargement.'));
  }

  useEffect(() => {
    charger().finally(() => setLoading(false));
  }, []);

  async function handleInscription(id: number) {
    setEnCours(id);
    try {
      await membreApi.post(`/v1/membre/evenements/${id}/inscription`);
      toast.success('Inscription confirmée');
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setEnCours(null);
    }
  }

  async function handleDesinscription(id: number) {
    setEnCours(id);
    try {
      await membreApi.delete(`/v1/membre/evenements/${id}/inscription`);
      toast.success('Inscription annulée');
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'annulation.");
    } finally {
      setEnCours(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Événements</h1>
      <p className="text-slate-500 mb-6">Événements à venir du consulat.</p>

      {evenements.length === 0 && (
        <p className="text-slate-400 text-sm">Aucun événement à venir pour le moment.</p>
      )}

      <div className="space-y-4">
        {evenements.map((ev) => {
          const estPayant = !!ev.prix && ev.prix > 0;
          const estInscrit = ev.mon_inscription === 'inscrit' || ev.mon_inscription === 'confirme';

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4"
            >
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt={ev.titre}
                  className="w-full sm:w-32 h-32 object-cover rounded-xl shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900">{ev.titre}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {ev.periode}
                  </span>
                  {ev.lieu && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {ev.lieu}
                    </span>
                  )}
                  {ev.capacite_max && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {ev.est_complet ? 'Complet' : `${ev.places_restantes} places restantes`}
                    </span>
                  )}
                </div>
                {ev.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ev.description}</p>
                )}

                {estInscrit ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-sm text-brand-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Vous êtes inscrit(e)
                    </span>
                    {!estPayant && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={enCours === ev.id}
                        onClick={() => handleDesinscription(ev.id)}
                        className="text-slate-500"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                ) : ev.est_complet ? (
                  <span className="text-sm text-slate-400">Complet</span>
                ) : estPayant ? (
                  membre && (
                    <FedaPayButton
                      endpoint={`/v1/paiements/evenements/${ev.id}`}
                      extraPayload={{ membre_id: membre.id }}
                      montant={ev.prix as number}
                      devise={ev.devise || 'XOF'}
                      label="Réserver ma place"
                      payeur={{
                        nom_payeur: membre.nom_complet,
                        telephone_payeur: membre.whatsapp || '',
                      }}
                    />
                  )
                ) : (
                  <Button
                    size="sm"
                    disabled={enCours === ev.id}
                    onClick={() => handleInscription(ev.id)}
                    className="bg-brand-green-600 hover:bg-brand-green-700"
                  >
                    {enCours === ev.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
