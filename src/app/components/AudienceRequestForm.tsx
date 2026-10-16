import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';

const CHAMP =
  'w-full px-5 py-3.5 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none';

const VIDE = { prenom: '', nom: '', email: '', telephone: '', date_souhaitee: '', message: '' };

// Demande d'audience auprès du Consul Honoraire. Passe par le circuit des
// messages (objet « audience ») : le Consulat répond par e-mail pour fixer
// la date et l'heure — ce n'est pas une réservation de créneau.
export function AudienceRequestForm() {
  const [form, setForm] = useState(VIDE);
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string[]>>({});

  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const aujourdhui = new Date().toISOString().slice(0, 10);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreurs({});
    try {
      const payload: Record<string, string> = { ...form, objet: 'audience' };
      if (!payload.date_souhaitee) delete payload.date_souhaitee;
      await api.post('/v1/messages', payload);
      setEnvoye(true);
      setForm(VIDE);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErreurs(err.errors);
      toast.error(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande pour l'instant.");
    } finally {
      setLoading(false);
    }
  }

  const erreur = (k: string) =>
    erreurs[k]?.[0] ? <p className="text-red-500 text-xs mt-1 ml-1">{erreurs[k][0]}</p> : null;

  return (
    <section id="audience" className="mb-24 scroll-mt-28">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-green-50 text-brand-green-600 flex items-center justify-center mx-auto mb-5">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Demander une audience</h2>
        <p className="text-slate-500">
          Vous souhaitez rencontrer le Consul Honoraire ? Exposez brièvement l'objet de votre demande : le Consulat
          vous répondra par e-mail pour convenir d'une date et d'une heure.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto bg-slate-50 p-8 md:p-10 rounded-[2.5rem]"
      >
        {envoye ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Demande transmise</h3>
            <p className="text-slate-500 mb-6">
              Votre demande d'audience a bien été reçue. Un e-mail de confirmation vous a été envoyé ; le Consulat
              reviendra vers vous pour fixer un rendez-vous. Une demande n'est pas une confirmation de rendez-vous.
            </p>
            <button type="button" onClick={() => setEnvoye(false)} className="text-brand-green-600 font-semibold hover:underline">
              Faire une autre demande
            </button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">Prénom</label>
                <input required className={CHAMP} value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
                {erreur('prenom')}
              </div>
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">Nom</label>
                <input required className={CHAMP} value={form.nom} onChange={(e) => set('nom', e.target.value)} />
                {erreur('nom')}
              </div>
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">E-mail</label>
                <input required type="email" className={CHAMP} placeholder="nom@exemple.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {erreur('email')}
              </div>
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">Téléphone</label>
                <input required className={CHAMP} placeholder="+229 00 00 00 00" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
                {erreur('telephone')}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 ml-1">Date souhaitée (facultatif)</label>
              <input type="date" min={aujourdhui} className={CHAMP} value={form.date_souhaitee} onChange={(e) => set('date_souhaitee', e.target.value)} />
              {erreur('date_souhaitee')}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 ml-1">Objet de l'audience</label>
              <textarea
                required
                rows={4}
                className={CHAMP}
                placeholder="Décrivez brièvement le motif de votre demande"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
              />
              {erreur('message')}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Envoyer ma demande d'audience
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
