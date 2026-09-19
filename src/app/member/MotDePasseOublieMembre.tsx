import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { ApiError } from '../../lib/memberApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function MotDePasseOublieMembre() {
  const { motDePasseOublie } = useMemberAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const msg = await motDePasseOublie(email);
      setMessage(msg);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessayez.');
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
          <h1 className="text-slate-900 text-2xl font-bold text-center">Mot de passe oublié</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">Espace consulaire</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          {message ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-green-50 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-6 h-6 text-brand-green-600" />
              </div>
              <p className="text-slate-700">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-5 rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}
              <p className="text-sm text-slate-500 mb-5">
                Indiquez l'email de votre espace membre : si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe.
              </p>
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
                <Button type="submit" disabled={loading} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/membre/login" className="text-slate-500 text-sm hover:text-slate-700 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
