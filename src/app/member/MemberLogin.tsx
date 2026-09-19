import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { ApiError } from '../../lib/memberApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function MemberLogin() {
  const { login, isAuthenticated } = useMemberAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from || '/membre';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      const from = (location.state as { from?: string })?.from || '/membre';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible. Réessayez.');
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
          <h1 className="text-slate-900 text-2xl font-bold">Espace Membre</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Consulat Honoraire de la République du Congo au Bénin
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          {error && (
            <div className="mb-5 rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
              {error}
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
                  minLength={6}
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
              <Link to="/mot-de-passe-oublie" className="text-sm text-brand-green-600 hover:underline">
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
          Pas encore membre ?{' '}
          <Link to="/join" className="text-brand-green-600 hover:underline">
            Faire une demande d'adhésion
          </Link>
        </p>
      </div>
    </div>
  );
}
