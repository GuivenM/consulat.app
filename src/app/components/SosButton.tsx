import React, { useState } from 'react';
import { CheckCircle2, Loader2, LifeBuoy, MapPin, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

// Même numéro que la page Contact.
const TEL_CONSULAT = { affiche: '+229 01 66 24 62 68', lien: 'tel:+2290166246268' };

// Numéros courts officiels du Bénin (liste ARCEP Bénin).
const URGENCES_LOCALES = [
  { label: 'Police', numero: '117' },
  { label: 'Pompiers', numero: '118' },
  { label: 'SAMU', numero: '112' },
];

const TYPES_AIDE = [
  { value: 'perte_documents', label: "Perte ou vol de documents (passeport, pièce d'identité)" },
  { value: 'arrestation', label: 'Arrestation ou détention' },
  { value: 'sante', label: 'Accident ou problème de santé' },
  { value: 'agression', label: 'Agression ou situation de danger' },
  { value: 'ressources', label: 'Difficulté financière ou de logement' },
  { value: 'autre', label: 'Autre situation urgente' },
];

const CHAMP =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-red-500 transition-all outline-none text-sm';

const VIDE = { prenom: '', nom: '', telephone: '', email: '', type_aide: '', localisation: '', message: '' };

// Bouton SOS flottant (pages publiques) : alerte le Consulat par e-mail via
// le circuit des messages (objet « sos »). Pas besoin de compte ni d'e-mail.
export function SosButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [localisation, setLocalisation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string[]>>({});

  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function partagerPosition() {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocalisation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocalisation(false);
      },
      () => {
        setLocalisation(false);
        toast.error("Position non obtenue. Décrivez plutôt l'endroit où vous êtes.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreurs({});
    try {
      const payload: Record<string, unknown> = { ...form, objet: 'sos', ...(position ?? {}) };
      if (!form.email) delete payload.email;
      await api.post('/v1/messages', payload);
      setEnvoye(true);
      setForm(VIDE);
      setPosition(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErreurs(err.errors);
      toast.error(err instanceof ApiError ? err.message : "L'alerte n'a pas pu être envoyée. Appelez le Consulat.");
    } finally {
      setLoading(false);
    }
  }

  const erreur = (k: string) =>
    erreurs[k]?.[0] ? <p className="text-red-600 text-xs mt-1">{erreurs[k][0]}</p> : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setEnvoye(false);
          setOpen(true);
        }}
        aria-label="SOS : demander l'aide du Consulat"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-brand-red-600 text-white font-bold pl-4 pr-5 py-3 rounded-full shadow-xl hover:bg-brand-red-700 transition-colors"
      >
        <LifeBuoy className="w-5 h-5" />
        SOS
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-red-600">
              <LifeBuoy className="w-5 h-5" /> SOS : demander l'aide du Consulat
            </DialogTitle>
            <DialogDescription>
              Réservé aux situations urgentes des ressortissants congolais au Bénin.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-brand-red-50 border border-brand-red-100 p-3 text-sm text-slate-700 space-y-2">
            <p className="font-semibold text-brand-red-700">En danger immédiat, appelez d'abord les secours locaux :</p>
            <div className="flex flex-wrap gap-2">
              {URGENCES_LOCALES.map(({ label, numero }) => (
                <a
                  key={numero}
                  href={`tel:${numero}`}
                  className="inline-flex items-center gap-1.5 bg-white border border-brand-red-200 rounded-full px-3 py-1 font-semibold text-brand-red-700"
                >
                  <Phone className="w-3.5 h-3.5" /> {label} {numero}
                </a>
              ))}
            </div>
            <p>
              Consulat :{' '}
              <a href={TEL_CONSULAT.lien} className="font-semibold underline">
                {TEL_CONSULAT.affiche}
              </a>
            </p>
          </div>

          {envoye ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Alerte transmise au Consulat</h3>
              <p className="text-slate-500 text-sm">
                Le Consulat a été prévenu par e-mail et vous rappellera dès que possible. Gardez votre téléphone
                allumé. Si votre situation est critique, appelez directement les numéros ci-dessus.
              </p>
            </div>
          ) : (
            <form onSubmit={envoyer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input required className={CHAMP} placeholder="Prénom" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
                  {erreur('prenom')}
                </div>
                <div>
                  <input required className={CHAMP} placeholder="Nom" value={form.nom} onChange={(e) => set('nom', e.target.value)} />
                  {erreur('nom')}
                </div>
              </div>

              <div>
                <input
                  required
                  type="tel"
                  className={CHAMP}
                  placeholder="Téléphone où vous joindre (WhatsApp si possible)"
                  value={form.telephone}
                  onChange={(e) => set('telephone', e.target.value)}
                />
                {erreur('telephone')}
              </div>

              <div>
                <input type="email" className={CHAMP} placeholder="E-mail (facultatif)" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {erreur('email')}
              </div>

              <div>
                <select required className={CHAMP} value={form.type_aide} onChange={(e) => set('type_aide', e.target.value)}>
                  <option value="">De quelle aide avez-vous besoin ?</option>
                  {TYPES_AIDE.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {erreur('type_aide')}
              </div>

              <div>
                <input
                  required
                  className={CHAMP}
                  placeholder="Où êtes-vous ? (ville, quartier, point de repère)"
                  value={form.localisation}
                  onChange={(e) => set('localisation', e.target.value)}
                />
                {erreur('localisation')}
                <button
                  type="button"
                  onClick={partagerPosition}
                  disabled={localisation || !!position}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-green-700 font-medium hover:underline disabled:no-underline disabled:text-slate-500"
                >
                  {localisation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {position ? 'Position GPS jointe' : 'Joindre ma position GPS (facultatif)'}
                </button>
              </div>

              <div>
                <textarea
                  required
                  rows={3}
                  className={CHAMP}
                  placeholder="Décrivez brièvement votre situation"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                />
                {erreur('message')}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Envoyer l'alerte au Consulat
              </button>

              <p className="text-xs text-slate-400">
                Ce formulaire prévient le Consulat par e-mail. Il ne remplace pas les numéros d'urgence et le Consulat
                ne garantit pas une réponse immédiate.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
