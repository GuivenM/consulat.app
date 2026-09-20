import React, { useState } from 'react';
import { Loader2, Lock, BadgeCheck, MapPin, Mail } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function Profil() {
  const { ressortissant } = useRessortissantAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ressortissant) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await ressortissantApi.post('/v1/ressortissant/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmation,
      });
      toast.success('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la modification.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Mon profil</h1>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Nom complet</span>
            <span className="text-slate-800 font-medium">{ressortissant.nom_complet}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
            <span className="text-slate-800 font-medium">{ressortissant.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Localisation</span>
            <span className="text-slate-800 font-medium">{ressortissant.ville}{ressortissant.quartier ? ` · ${ressortissant.quartier}` : ''}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> N° de registre</span>
            <span className="text-slate-800 font-mono">{ressortissant.numero_registre || 'En attribution'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Pour corriger une information du registre, contactez le consulat.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" /> Changer de mot de passe
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Mot de passe actuel</Label>
            <Input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirmer le nouveau mot de passe</Label>
            <Input type="password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="bg-brand-green-600 hover:bg-brand-green-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Modifier le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
}
