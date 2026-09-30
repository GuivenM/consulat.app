import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, MapPin, CheckCircle2, Upload, FileText } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { ApiError } from '../../lib/ressortissantApi';
import { compressImage } from '../../lib/compressImage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { VilleSelect } from '../components/VilleSelect';
import { QuartierSelect } from '../components/QuartierSelect';
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
  possede_carte_consulaire: '', numero_carte_consulaire: '',
  whatsapp: '', telephone: '',
  ville: '', quartier: '', adresse: '', date_arrivee: '',
  contact_urgence_nom: '', contact_urgence_telephone: '',
  email: '', password: '', password_confirmation: '',
};

const TAILLE_MAX_PIECE = 5 * 1024 * 1024; // 5 Mo, aligné sur la validation API

export function Inscription() {
  const { inscrire, isAuthenticated } = useRessortissantAuth();
  const [form, setForm] = useState(EMPTY);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pieceFichier, setPieceFichier] = useState<File | null>(null);
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

  async function choisirPiece(file: File | undefined) {
    if (!file) return;
    const fichier = file.type.startsWith('image/') ? await compressImage(file) : file;
    if (fichier.size > TAILLE_MAX_PIECE) {
      setFieldErrors((f) => ({ ...f, piece_fichier: ['La pièce ne doit pas dépasser 5 Mo.'] }));
      return;
    }
    setFieldErrors((f) => {
      const { piece_fichier: _ignore, ...reste } = f;
      return reste;
    });
    setPieceFichier(fichier);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const manquants: Record<string, string[]> = {};
    if (!form.type_piece) manquants.type_piece = ["Choisissez le type de pièce."];
    if (!pieceFichier) manquants.piece_fichier = ["Joignez la copie de votre pièce d'identité (PDF ou image)."];
    if (!form.possede_carte_consulaire) manquants.possede_carte_consulaire = ['Indiquez si vous possédez la carte consulaire.'];
    if (Object.keys(manquants).length > 0) {
      setFieldErrors(manquants);
      return;
    }

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password: ['Les mots de passe ne correspondent pas.'] });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { ...form, ...coords };
      // Champs optionnels vides -> non envoyés (le backend les traite en `nullable`)
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) formData.append(k, String(v));
      });
      if (pieceFichier) formData.append('piece_fichier', pieceFichier, pieceFichier.name);

      const message = await inscrire(formData);
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
            Faites-vous recenser auprès du Consulat pour rester joignable et faciliter vos démarches.
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
                <Label>Type de pièce *</Label>
                <Select value={form.type_piece} onValueChange={(v) => set('type_piece', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="cni">Carte nationale d'identité</SelectItem>
                    <SelectItem value="cip_etranger">CIP Étranger</SelectItem>
                    <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {err('type_piece') && <p className="text-xs text-brand-red-600 mt-1">{err('type_piece')}</p>}
              </div>
              <div>
                <Label>Numéro de la pièce</Label>
                <Input value={form.numero_piece} onChange={(e) => set('numero_piece', e.target.value)} />
              </div>
              <div>
                <Label>Date d'expiration</Label>
                <Input type="date" value={form.date_expiration_piece} onChange={(e) => set('date_expiration_piece', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Copie de la pièce (PDF ou image, 5 Mo max) *</Label>
                <label className="mt-1.5 flex items-center gap-3 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  {pieceFichier ? <FileText className="w-4 h-4 text-brand-green-600 shrink-0" /> : <Upload className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="text-sm text-slate-600 truncate">
                    {pieceFichier ? pieceFichier.name : 'Choisir un fichier'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => choisirPiece(e.target.files?.[0])}
                  />
                </label>
                {err('piece_fichier') && <p className="text-xs text-brand-red-600 mt-1">{err('piece_fichier')}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label>Possédez-vous la carte consulaire ? *</Label>
                <div className="flex gap-6 mt-1.5">
                  {[
                    { v: '1', label: 'Oui' },
                    { v: '0', label: 'Non' },
                  ].map(({ v, label }) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="possede_carte_consulaire"
                        value={v}
                        checked={form.possede_carte_consulaire === v}
                        onChange={() => set('possede_carte_consulaire', v)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {err('possede_carte_consulaire') && <p className="text-xs text-brand-red-600 mt-1">{err('possede_carte_consulaire')}</p>}
              </div>
              {form.possede_carte_consulaire === '1' && (
                <div>
                  <Label>Numéro de la carte consulaire</Label>
                  <Input value={form.numero_carte_consulaire} onChange={(e) => set('numero_carte_consulaire', e.target.value)} />
                </div>
              )}
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
                <VilleSelect value={form.ville || null} onChange={(v) => setForm((f) => ({ ...f, ville: v || '', quartier: v === f.ville ? f.quartier : '' }))} placeholder="Sélectionner…" />
                {err('ville') && <p className="text-xs text-brand-red-600 mt-1">{err('ville')}</p>}
              </div>
              <div>
                <Label>Quartier *</Label>
                <QuartierSelect required ville={form.ville || null} value={form.quartier || null} onChange={(q) => set('quartier', q)} />
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
