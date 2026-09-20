import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { VilleSelect } from '../components/VilleSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const EMPTY = {
  nom: '', prenom: '', sexe: '', date_naissance: '', lieu_naissance: '', nationalite: '',
  profession: '', situation_matrimoniale: '',
  type_piece: '', numero_piece: '', date_expiration_piece: '',
  whatsapp: '', telephone: '',
  ville: '', quartier: '', adresse: '', date_arrivee: '',
  contact_urgence_nom: '', contact_urgence_telephone: '',
  email: '', password: '', password_confirmation: '',
};

export function Inscription() {
  const { inscrire, isAuthenticated } = useRessortissantAuth();
  const [form, setForm] = useState(EMPTY);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/espace-consulaire" replace />;

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function localiser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => { /* refusé ou indisponible — champ facultatif, pas bloquant */ }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password: ['Les mots de passe ne correspondent pas.'] });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { ...form, ...coords };
      // Champs optionnels vides -> non envoyés (le backend les traite en `nullable`)
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });

      const message = await inscrire(payload);
      setSucces(message);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors || {});
      } else {
        setError("Erreur lors de l'inscription. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (succes) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
          <CheckCircle2 className="w-14 h-14 text-brand-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Inscription enregistrée</h1>
          <p className="text-slate-500 text-sm">{succes}</p>
          <Link to="/espace-consulaire/login" className="inline-block mt-6 text-brand-green-600 hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const err = (field: string) => fieldErrors[field]?.[0];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 p-2 shadow-sm">
            <img src="/logo-consulat-mark.png" alt="Consulat" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-2xl font-bold text-center">Inscription au registre consulaire</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Obligatoire avant toute demande de carte consulaire ou de laissez-passer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-8">
          {error && (
            <div className="rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800">Identité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input required value={form.nom} onChange={(e) => set('nom', e.target.value)} />
                {err('nom') && <p className="text-xs text-brand-red-600 mt-1">{err('nom')}</p>}
              </div>
              <div>
                <Label>Prénom *</Label>
                <Input required value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
                {err('prenom') && <p className="text-xs text-brand-red-600 mt-1">{err('prenom')}</p>}
              </div>
              <div>
                <Label>Sexe</Label>
                <Select value={form.sexe} onValueChange={(v) => set('sexe', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de naissance</Label>
                <Input type="date" value={form.date_naissance} onChange={(e) => set('date_naissance', e.target.value)} />
              </div>
              <div>
                <Label>Lieu de naissance</Label>
                <Input value={form.lieu_naissance} onChange={(e) => set('lieu_naissance', e.target.value)} />
              </div>
              <div>
                <Label>Nationalité</Label>
                <Input value={form.nationalite} onChange={(e) => set('nationalite', e.target.value)} placeholder="Congolaise" />
              </div>
              <div>
                <Label>Profession</Label>
                <Input value={form.profession} onChange={(e) => set('profession', e.target.value)} />
              </div>
              <div>
                <Label>Situation matrimoniale</Label>
                <Select value={form.situation_matrimoniale} onValueChange={(v) => set('situation_matrimoniale', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="marie">Marié(e)</SelectItem>
                    <SelectItem value="divorce">Divorcé(e)</SelectItem>
                    <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800">Pièce d'identité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Type de pièce</Label>
                <Select value={form.type_piece} onValueChange={(v) => set('type_piece', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="cni">Carte nationale d'identité</SelectItem>
                    <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Numéro de la pièce</Label>
                <Input value={form.numero_piece} onChange={(e) => set('numero_piece', e.target.value)} />
              </div>
              <div>
                <Label>Date d'expiration</Label>
                <Input type="date" value={form.date_expiration_piece} onChange={(e) => set('date_expiration_piece', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800">Coordonnées & localisation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Téléphone</Label>
                <Input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
              </div>
              <div>
                <Label>Ville *</Label>
                <VilleSelect value={form.ville || null} onChange={(v) => set('ville', v || '')} placeholder="Sélectionner…" />
                {err('ville') && <p className="text-xs text-brand-red-600 mt-1">{err('ville')}</p>}
              </div>
              <div>
                <Label>Quartier *</Label>
                <Input required value={form.quartier} onChange={(e) => set('quartier', e.target.value)} />
                {err('quartier') && <p className="text-xs text-brand-red-600 mt-1">{err('quartier')}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label>Adresse</Label>
                <Input value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
              </div>
              <div>
                <Label>Date d'arrivée au Bénin</Label>
                <Input type="date" value={form.date_arrivee} onChange={(e) => set('date_arrivee', e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={localiser} className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  {coords ? 'Position enregistrée ✓' : 'Utiliser ma position actuelle'}
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800">Contact d'urgence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input value={form.contact_urgence_nom} onChange={(e) => set('contact_urgence_nom', e.target.value)} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={form.contact_urgence_telephone} onChange={(e) => set('contact_urgence_telephone', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800">Votre compte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Email *</Label>
                <Input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
                {err('email') && <p className="text-xs text-brand-red-600 mt-1">{err('email')}</p>}
              </div>
              <div>
                <Label>Mot de passe *</Label>
                <Input type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
              <div>
                <Label>Confirmer le mot de passe *</Label>
                <Input type="password" required minLength={8} value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} />
                {err('password') && <p className="text-xs text-brand-red-600 mt-1">{err('password')}</p>}
              </div>
            </div>
          </section>

          <Button type="submit" disabled={loading} className="w-full bg-brand-green-600 hover:bg-brand-green-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "S'inscrire"}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Déjà inscrit ?{' '}
          <Link to="/espace-consulaire/login" className="text-brand-green-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
