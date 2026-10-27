import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, FileText, Loader2, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';

interface Appel {
  id: number;
  titre: string;
  description: string | null;
  affiche_url: string | null;
  date_limite: string | null;
}

const CHAMP =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-green-500 transition-all outline-none';

const TAILLE_MAX_FICHIER = 5 * 1024 * 1024; // 5 Mo, aligné sur la validation API

const VIDE = {
  prenom: '', nom: '', email: '', telephone: '', ville: '',
  domaine: '', discipline: '', presentation: '', lien_portfolio: '',
};

const formaterDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

function joursRestants(date: string): number {
  const fin = new Date(`${date}T23:59:59`);
  return Math.ceil((fin.getTime() - Date.now()) / 86400000);
}

// Appels à candidatures ouverts (créés depuis l'admin) : présentation + formulaire
// de candidature sans compte. N'affiche rien tant qu'aucun appel n'est ouvert.
export function AppelsCandidatures() {
  const [appels, setAppels] = useState<Appel[] | null>(null);
  const [domaines, setDomaines] = useState<Record<string, string>>({});

  useEffect(() => {
    let annule = false;
    api
      .get<{ appels: Appel[]; domaines: Record<string, string> }>('/v1/appels')
      .then((data) => {
        if (annule) return;
        setAppels(data.appels);
        setDomaines(data.domaines);
      })
      .catch(() => !annule && setAppels([]));
    return () => {
      annule = true;
    };
  }, []);

  if (!appels || appels.length === 0) return null;

  return (
    <section id="candidatures" className="mb-24 scroll-mt-28 space-y-10">
      {appels.map((appel) => (
        <AppelCard key={appel.id} appel={appel} domaines={domaines} />
      ))}
    </section>
  );
}

function AppelCard({ appel, domaines }: { appel: Appel; domaines: Record<string, string> }) {
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [fichier, setFichier] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string[]>>({});

  const set = (k: keyof typeof VIDE, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const jours = appel.date_limite ? joursRestants(appel.date_limite) : null;

  function choisirFichier(file: File | undefined) {
    if (!file) return;
    if (file.size > TAILLE_MAX_FICHIER) {
      setErreurs((er) => ({ ...er, fichier: ['Le dossier ne doit pas dépasser 5 Mo.'] }));
      return;
    }
    setErreurs((er) => {
      const { fichier: _ignore, ...reste } = er;
      return reste;
    });
    setFichier(file);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreurs({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v.trim() !== '') fd.append(k, v.trim());
      });
      if (fichier) fd.append('fichier', fichier, fichier.name);

      await api.postForm(`/v1/appels/${appel.id}/candidatures`, fd);
      setEnvoye(true);
      setForm(VIDE);
      setFichier(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErreurs(err.errors);
      toast.error(err instanceof ApiError ? err.message : "Impossible d'envoyer la candidature pour l'instant.");
    } finally {
      setLoading(false);
    }
  }

  const erreur = (k: string) =>
    erreurs[k]?.[0] ? <p className="text-red-500 text-xs mt-1 ml-1">{erreurs[k][0]}</p> : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-[2.5rem] overflow-hidden bg-slate-900 text-white shadow-xl"
    >
      <div className={appel.affiche_url ? 'grid md:grid-cols-2' : ''}>
        {appel.affiche_url && (
          <img src={appel.affiche_url} alt={appel.titre} className="w-full h-full object-cover max-h-[34rem]" loading="lazy" />
        )}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <span className="self-start px-3 py-1 bg-brand-gold-500 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
            Appel à candidatures
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{appel.titre}</h2>

          {appel.date_limite && (
            <p className="flex items-center gap-2 text-brand-gold-500 font-semibold mb-4">
              <Calendar className="w-5 h-5" />
              Jusqu'au {formaterDate(appel.date_limite)}
              {jours !== null && jours <= 7 && (
                <span className="text-xs bg-white/10 rounded-full px-2.5 py-0.5 text-white">
                  {jours <= 1 ? 'dernier jour' : `plus que ${jours} jours`}
                </span>
              )}
            </p>
          )}

          {appel.description && (
            <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-6">{appel.description}</p>
          )}

          {!ouvert && (
            <button
              type="button"
              onClick={() => setOuvert(true)}
              className="self-start bg-brand-gold-500 text-slate-900 font-bold px-8 py-4 rounded-2xl hover:bg-white transition-colors"
            >
              Je candidate
            </button>
          )}
        </div>
      </div>

      {ouvert && (
        <div className="bg-slate-50 text-slate-900 p-8 md:p-12">
          {envoye ? (
            <div className="text-center py-6 max-w-xl mx-auto">
              <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Candidature enregistrée</h3>
              <p className="text-slate-500">
                Merci ! Un e-mail de confirmation vous a été envoyé. Votre dossier sera examiné et le Consulat reviendra
                vers vous.
              </p>
            </div>
          ) : (
            <form onSubmit={envoyer} className="max-w-3xl mx-auto space-y-5">
              <h3 className="text-xl font-bold">Mon dossier de candidature</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input required className={CHAMP} placeholder="Prénom" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
                  {erreur('prenom')}
                </div>
                <div>
                  <input required className={CHAMP} placeholder="Nom" value={form.nom} onChange={(e) => set('nom', e.target.value)} />
                  {erreur('nom')}
                </div>
                <div>
                  <input required type="email" className={CHAMP} placeholder="E-mail" value={form.email} onChange={(e) => set('email', e.target.value)} />
                  {erreur('email')}
                </div>
                <div>
                  <input required type="tel" className={CHAMP} placeholder="Téléphone" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
                  {erreur('telephone')}
                </div>
                <div>
                  <input className={CHAMP} placeholder="Ville de résidence (facultatif)" value={form.ville} onChange={(e) => set('ville', e.target.value)} />
                  {erreur('ville')}
                </div>
                <div>
                  <select required className={CHAMP} value={form.domaine} onChange={(e) => set('domaine', e.target.value)}>
                    <option value="">Vous êtes…</option>
                    {Object.entries(domaines).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  {erreur('domaine')}
                </div>
              </div>

              <div>
                <input
                  className={CHAMP}
                  placeholder="Discipline (ex. musique, littérature, danse, arts visuels…)"
                  value={form.discipline}
                  onChange={(e) => set('discipline', e.target.value)}
                />
                {erreur('discipline')}
              </div>

              <div>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  className={CHAMP}
                  placeholder="Présentez votre parcours, vos réalisations et ce que vous souhaitez apporter au comité"
                  value={form.presentation}
                  onChange={(e) => set('presentation', e.target.value)}
                />
                {erreur('presentation')}
              </div>

              <div>
                <input
                  type="url"
                  className={CHAMP}
                  placeholder="Lien vers votre travail (site, réseaux, vidéo…) : facultatif"
                  value={form.lien_portfolio}
                  onChange={(e) => set('lien_portfolio', e.target.value)}
                />
                {erreur('lien_portfolio')}
              </div>

              <div>
                <label className="flex items-center gap-3 border border-dashed border-slate-300 bg-white rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
                  {fichier ? <FileText className="w-4 h-4 text-brand-green-600 shrink-0" /> : <Upload className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="text-sm text-slate-600 truncate">
                    {fichier ? fichier.name : 'Joindre un CV ou un dossier artistique (PDF ou Word, 5 Mo max) : facultatif'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => choisirFichier(e.target.files?.[0])}
                  />
                </label>
                {erreur('fichier')}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Envoyer ma candidature
              </button>
            </form>
          )}
        </div>
      )}
    </motion.article>
  );
}
