import React, { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { ApiError } from '../../lib/memberApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function ActivationCompte() {
  const { activerCompte, isAuthenticated } = useMemberAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/membre" replace />;
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lien invalide</h1>
          <p className="text-slate-500">
            Ce lien d'activation est incomplet. Vérifiez que vous avez copié l'intégralité du lien
            reçu par email, ou contactez l'administration.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await activerCompte(token as string, password, passwordConfirmation);
      navigate('/membre', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Activation impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 p-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-brand-green-600" />
          </div>
          <h1 className="text-slate-900 text-2xl font-bold text-center">Activez votre espace membre</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Bienvenue au Consulat ! Choisissez votre mot de passe pour finaliser votre compte.
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
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Activation…
                </>
              ) : (
                'Activer mon compte'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
