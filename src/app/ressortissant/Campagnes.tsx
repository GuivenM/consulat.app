import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Megaphone, Pencil, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import type { CampagneRessortissant } from './types';

const CHAMP =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-green-500 outline-none';

const formaterMontant = (montant: number, devise: string) =>
  `${new Intl.NumberFormat('fr-FR').format(montant)} ${devise === 'XOF' ? 'FCFA' : devise}`;

const formaterDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

export function Campagnes() {
  const [campagnes, setCampagnes] = useState<CampagneRessortissant[] | null>(null);
  const [situations, setSituations] = useState<Record<string, string>>({});

  async function charger() {
    try {
      const data = await ressortissantApi.get<{ campagnes: CampagneRessortissant[]; situations: Record<string, string> }>(
        '/v1/ressortissant/campagnes'
      );
      setCampagnes(data.campagnes);
      setSituations(data.situations);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les campagnes.');
      setCampagnes([]);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  if (campagnes === null) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (campagnes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
        <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-900 mb-1">Aucune campagne en cours</h1>
        <p className="text-slate-500 text-sm">Les campagnes ouvertes par le Consulat apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {campagnes.map((c) => (
        <CampagneCard key={c.id} campagne={c} situations={situations} onChange={charger} />
      ))}
    </div>
  );
}

function CampagneCard({
  campagne,
  situations,
  onChange,
}: {
  campagne: CampagneRessortissant;
  situations: Record<string, string>;
  onChange: () => Promise<void>;
}) {
  const inscription = campagne.inscription;
  const [edition, setEdition] = useState(!inscription);
  const [situation, setSituation] = useState(inscription?.situation ?? '');
  const [dispose, setDispose] = useState<'1' | '0' | ''>(inscription ? (inscription.dispose_montant ? '1' : '0') : '');
  const [commentaire, setCommentaire] = useState(inscription?.commentaire ?? '');
  const [loading, setLoading] = useState(false);

  const somme = campagne.montant ? formaterMontant(campagne.montant, campagne.devise) : null;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!situation || !dispose) {
      toast.error('Renseignez votre situation et indiquez si vous disposez de la somme.');
      return;
    }
    setLoading(true);
    try {
      await ressortissantApi.post(`/v1/ressortissant/campagnes/${campagne.id}/inscription`, {
        situation,
        dispose_montant: dispose === '1',
        commentaire: commentaire.trim() || null,
      });
      toast.success('Votre inscription est enregistrée.');
      setEdition(false);
      await onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  async function desinscrire() {
    if (!confirm('Retirer votre inscription à cette campagne ?')) return;
    try {
      await ressortissantApi.delete(`/v1/ressortissant/campagnes/${campagne.id}/inscription`);
      toast.success('Votre inscription a été retirée.');
      setSituation('');
      setDispose('');
      setCommentaire('');
      setEdition(true);
      await onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la désinscription.');
    }
  }

  return (
    <article className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-2 text-brand-green-600 text-sm font-semibold mb-2">
          <Megaphone className="w-4 h-4" /> Campagne
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{campagne.titre}</h1>
        {(campagne.date_debut || campagne.date_fin) && (
          <p className="text-sm text-slate-500 mb-4">
            {campagne.date_debut && campagne.date_fin
              ? `Du ${formaterDate(campagne.date_debut)} au ${formaterDate(campagne.date_fin)}`
              : campagne.date_fin
                ? `Jusqu'au ${formaterDate(campagne.date_fin)}`
                : `À partir du ${formaterDate(campagne.date_debut!)}`}
          </p>
        )}
        {campagne.description && (
          <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-4">{campagne.description}</p>
        )}
        {somme && (
          <p className="inline-flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700">
            <Wallet className="w-4 h-4 text-slate-400" /> Montant à prévoir : <strong>{somme}</strong>
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-6 md:p-8">
        {inscription && !edition ? (
          <div>
            <p className="flex items-center gap-2 font-semibold text-brand-green-700 mb-2">
              <CheckCircle2 className="w-5 h-5" /> Vous êtes inscrit(e) à cette campagne
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-4">
              <li>Situation : {inscription.situation_label}</li>
              <li>Somme disponible : {inscription.dispose_montant ? 'Oui' : 'Pas encore'}</li>
              {inscription.commentaire && <li>Remarque : {inscription.commentaire}</li>}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => setEdition(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier ma réponse
              </Button>
              <Button variant="ghost" size="sm" onClick={desinscrire} className="text-brand-red-600">
                Me désinscrire
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={envoyer} className="space-y-4">
            <h2 className="font-bold text-slate-900">Je m'inscris à la campagne</h2>

            <div className="space-y-1.5">
              <Label>Votre situation</Label>
              <select className={CHAMP} value={situation} onChange={(e) => setSituation(e.target.value)}>
                <option value="">Choisir…</option>
                {Object.entries(situations).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Disposez-vous de la somme{somme ? ` de ${somme}` : ' demandée'} ?</Label>
              <div className="flex gap-6">
                {[
                  { v: '1', label: 'Oui' },
                  { v: '0', label: 'Pas encore' },
                ].map(({ v, label }) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`dispose-${campagne.id}`}
                      value={v}
                      checked={dispose === v}
                      onChange={() => setDispose(v as '1' | '0')}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Remarque (facultatif)</Label>
              <Textarea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="bg-brand-green-600 hover:bg-brand-green-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {inscription ? 'Enregistrer' : "Je m'inscris"}
              </Button>
              {inscription && (
                <Button type="button" variant="ghost" onClick={() => setEdition(false)}>
                  Annuler
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Vos coordonnées sont reprises de votre fiche du registre consulaire.
            </p>
          </form>
        )}
      </div>
    </article>
  );
}
