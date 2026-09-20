import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { ApiError } from '../../lib/ressortissantApi';

export function VerificationEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifierEmail, isAuthenticated } = useRessortissantAuth();
  const navigate = useNavigate();
  const [statut, setStatut] = useState<'chargement' | 'ok' | 'erreur'>('chargement');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatut('erreur');
      setMessage('Lien de vérification invalide.');
      return;
    }
    verifierEmail(token)
      .then(() => setStatut('ok'))
      .catch((err) => {
        setStatut('erreur');
        setMessage(err instanceof ApiError ? err.message : 'Lien de vérification invalide ou expiré.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (isAuthenticated && statut !== 'chargement') {
    return <Navigate to="/espace-consulaire" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        {statut === 'chargement' && (
          <>
            <Loader2 className="w-12 h-12 text-brand-green-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-500">Vérification de votre email…</p>
          </>
        )}
        {statut === 'ok' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-brand-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Email vérifié</h1>
            <p className="text-slate-500 text-sm mb-6">Votre inscription est confirmée, vous êtes connecté(e).</p>
            <button
              onClick={() => navigate('/espace-consulaire', { replace: true })}
              className="text-brand-green-600 hover:underline text-sm font-medium"
            >
              Accéder à mon espace
            </button>
          </>
        )}
        {statut === 'erreur' && (
          <>
            <XCircle className="w-14 h-14 text-brand-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Vérification impossible</h1>
            <p className="text-slate-500 text-sm mb-6">{message}</p>
            <Link to="/espace-consulaire/login" className="text-brand-green-600 hover:underline text-sm">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
