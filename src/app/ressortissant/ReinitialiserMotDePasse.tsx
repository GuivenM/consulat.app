import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { reinitialiserMotDePasse } = useRessortissantAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
          <XCircle className="w-14 h-14 text-brand-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lien invalide</h1>
          <Link to="/espace-consulaire/mot-de-passe-oublie" className="text-brand-green-600 hover:underline text-sm">
            Refaire une demande
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await reinitialiserMotDePasse(token as string, password, confirmation);
      setSucces(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ce lien a expiré ou est invalide.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 p-2 shadow-sm">
            <img src="/logo-consulat-mark.png" alt="Consulat" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-2xl font-bold text-center">Nouveau mot de passe</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          {succes ? (
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-brand-green-600 mx-auto mb-4" />
              <p className="text-slate-700 mb-6">Mot de passe réinitialisé avec succès.</p>
              <Button onClick={() => navigate('/espace-consulaire/login')} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
                Se connecter
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Réinitialiser'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
