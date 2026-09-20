import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function RessortissantLogin() {
  const { login, renvoyerVerification, isAuthenticated } = useRessortissantAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNonVerifie, setEmailNonVerifie] = useState(false);
  const [renvoiMessage, setRenvoiMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from || '/espace-consulaire';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailNonVerifie(false);
    setRenvoiMessage(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      const from = (location.state as { from?: string })?.from || '/espace-consulaire';
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setEmailNonVerifie(!!(err as ApiError & { emailNonVerifie?: boolean }).emailNonVerifie);
      } else {
        setError('Connexion impossible. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRenvoyer() {
    setRenvoiMessage(await renvoyerVerification(email));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 p-2 shadow-sm">
            <img src="/logo-consulat-mark.png" alt="Consulat" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-2xl font-bold">Espace consulaire</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Consulat Honoraire de la République du Congo au Bénin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          {error && (
            <div className="mb-5 rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
              {error}
              {emailNonVerifie && (
                <button type="button" onClick={handleRenvoyer} className="block mt-2 font-semibold underline">
                  Renvoyer l'email de vérification
                </button>
              )}
            </div>
          )}
          {renvoiMessage && (
            <div className="mb-5 rounded-xl bg-brand-green-50 border border-brand-green-200 text-brand-green-700 text-sm px-4 py-3">
              {renvoiMessage}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              Rester connecté 30 jours
            </label>

            <div className="text-right -mt-1">
              <Link to="/espace-consulaire/mot-de-passe-oublie" className="text-sm text-brand-green-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Pas encore inscrit au registre consulaire ?{' '}
          <Link to="/espace-consulaire/inscription" className="text-brand-green-600 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
