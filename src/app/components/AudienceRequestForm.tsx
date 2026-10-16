import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, CheckCircle2, FileText, Loader2, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { compressImage } from '../../lib/compressImage';

const CHAMP =
  'w-full px-5 py-3.5 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none';

const VIDE = {
  prenom: '', nom: '', email: '', telephone: '', date_souhaitee: '', message: '',
  piece_type: '', piece_numero: '',
};

const TYPES_PIECE = [
  { value: 'passeport', label: 'Passeport' },
  { value: 'cni', label: "Carte nationale d'identité" },
  { value: 'cip_etranger', label: 'CIP Étranger' },
];

const TAILLE_MAX_PIECE = 5 * 1024 * 1024; // 5 Mo, aligné sur la validation API

// Demande d'audience auprès du Consul Honoraire. Passe par le circuit des
// messages (objet « audience ») : le Consulat répond par e-mail pour fixer
// la date et l'heure — ce n'est pas une réservation de créneau.
export function AudienceRequestForm() {
  const [form, setForm] = useState(VIDE);
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string[]>>({});
  const [pieceFichier, setPieceFichier] = useState<File | null>(null);

  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const aujourdhui = new Date().toISOString().slice(0, 10);

  async function choisirPiece(file: File | undefined) {
    if (!file) return;
    const fichier = file.type.startsWith('image/') ? await compressImage(file) : file;
    if (fichier.size > TAILLE_MAX_PIECE) {
      setErreurs((er) => ({ ...er, piece_fichier: ['La pièce ne doit pas dépasser 5 Mo.'] }));
      return;
    }
    setErreurs((er) => {
      const { piece_fichier: _ignore, ...reste } = er;
      return reste;
    });
    setPieceFichier(fichier);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceFichier) {
      setErreurs({ piece_fichier: ["Joignez la copie de votre pièce d'identité (PDF ou image)."] });
      return;
    }
    setLoading(true);
    setErreurs({});
    try {
      // Multipart : la pièce d'identité est jointe à la demande.
      const fd = new FormData();
      Object.entries({ ...form, objet: 'audience' }).forEach(([k, v]) => {
        if (v !== '') fd.append(k, v);
      });
      fd.append('piece_fichier', pieceFichier, pieceFichier.name);
      await api.postForm('/v1/messages', fd);
      setEnvoye(true);
      setForm(VIDE);
      setPieceFichier(null);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">Pièce d'identité</label>
                <select required className={CHAMP} value={form.piece_type} onChange={(e) => set('piece_type', e.target.value)}>
                  <option value="">Type de pièce…</option>
                  {TYPES_PIECE.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {erreur('piece_type')}
              </div>
              <div>
                <label className="text-sm font-bold text-slate-900 ml-1">N° de la pièce</label>
                <input className={CHAMP} value={form.piece_numero} onChange={(e) => set('piece_numero', e.target.value)} />
                {erreur('piece_numero')}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 ml-1">Copie de la pièce (PDF ou image, 5 Mo max)</label>
              <label className="flex items-center gap-3 bg-white rounded-xl px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors">
                {pieceFichier ? <FileText className="w-4 h-4 text-brand-green-600 shrink-0" /> : <Upload className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="text-sm text-slate-600 truncate">{pieceFichier ? pieceFichier.name : 'Choisir un fichier'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => choisirPiece(e.target.files?.[0])}
                />
              </label>
              {erreur('piece_fichier')}
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Cette pièce sert uniquement à identifier le demandeur ; elle n'est consultable que par le Consulat.
              </p>
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
