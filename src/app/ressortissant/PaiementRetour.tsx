import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';

type Etat = 'verification' | 'reussi' | 'echoue' | 'en_attente';

export function PaiementRetour() {
  const [searchParams] = useSearchParams();
  const [etat, setEtat] = useState<Etat>('verification');
  const [demandeId, setDemandeId] = useState<string | null>(null);

  useEffect(() => {
    // FedaPay ajoute `id` (identifiant de la transaction) à l'URL de retour.
    const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
    if (!transactionId) {
      setEtat('echoue');
      return;
    }

    ressortissantApi
      .post<{ statut: string; demande_id?: number }>(`/v1/ressortissant/paiements/${transactionId}/verifier`)
      .then((res) => {
        if (res.demande_id) setDemandeId(String(res.demande_id));
        if (res.statut === 'reussi') setEtat('reussi');
        else if (res.statut === 'echoue') setEtat('echoue');
        else setEtat('en_attente');
      })
      .catch((err: unknown) => {
        console.error(err instanceof ApiError ? err.message : err);
        setEtat('en_attente');
      });
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-10 text-center mt-10">
      {etat === 'verification' && (
        <>
          <Loader2 className="w-10 h-10 text-brand-green-600 animate-spin mx-auto mb-4" />
          <h1 className="font-bold text-slate-900 mb-2">Vérification du paiement…</h1>
          <p className="text-sm text-slate-500">Merci de patienter, on confirme votre transaction auprès de FedaPay.</p>
        </>
      )}

      {etat === 'reussi' && (
        <>
          <CheckCircle2 className="w-10 h-10 text-brand-green-600 mx-auto mb-4" />
          <h1 className="font-bold text-slate-900 mb-2">Paiement confirmé</h1>
          <p className="text-sm text-slate-500 mb-6">Votre dossier a bien été marqué comme payé.</p>
        </>
      )}

      {etat === 'echoue' && (
        <>
          <XCircle className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
          <h1 className="font-bold text-slate-900 mb-2">Paiement non abouti</h1>
          <p className="text-sm text-slate-500 mb-6">
            La transaction n'a pas été validée. Vous pouvez réessayer depuis votre dossier.
          </p>
        </>
      )}

      {etat === 'en_attente' && (
        <>
          <Clock className="w-10 h-10 text-brand-gold-500 mx-auto mb-4" />
          <h1 className="font-bold text-slate-900 mb-2">Paiement en cours de traitement</h1>
          <p className="text-sm text-slate-500 mb-6">
            FedaPay n'a pas encore confirmé la transaction. Le statut de votre dossier se mettra à jour
            automatiquement dès réception.
          </p>
        </>
      )}

      <Link
        to={demandeId ? `/espace-consulaire/demandes/${demandeId}` : '/espace-consulaire'}
        className="inline-flex items-center gap-2 bg-brand-green-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-brand-green-700 transition-colors"
      >
        Retour à mon dossier
      </Link>
    </div>
  );
}
