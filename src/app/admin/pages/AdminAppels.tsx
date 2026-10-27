import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Award, Users, Download, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, downloadFile, openFile } from '../../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { AppelCandidature, Candidature } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

const formaterDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

const CHAMP_SELECT =
  'h-8 px-2 rounded-md border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-brand-green-500 outline-none';

function statutAppel(a: AppelCandidature): { label: string; classe: string } {
  if (!a.est_actif) return { label: 'Désactivé', classe: 'text-slate-500' };
  if (!a.est_ouvert) return { label: 'Clos', classe: 'text-slate-500' };
  return { label: 'Ouvert', classe: 'text-brand-green-700 bg-brand-green-50' };
}

interface FormState {
  titre: string;
  description: string;
  date_limite: string;
  est_actif: boolean;
  afficheFile: File | null;
  retirerAffiche: boolean;
}

const emptyForm = (): FormState => ({ titre: '', description: '', date_limite: '', est_actif: true, afficheFile: null, retirerAffiche: false });

export function AdminAppels() {
  const { hasRole } = useAuth();
  const peutModifier = hasRole('super_admin', 'admin');
  const [appels, setAppels] = useState<AppelCandidature[] | null>(null);
  const [editing, setEditing] = useState<AppelCandidature | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [candidatsDe, setCandidatsDe] = useState<AppelCandidature | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[] | null>(null);
  const [statuts, setStatuts] = useState<Record<string, string>>({});

  async function charger() {
    try {
      setAppels(await api.get<AppelCandidature[]>('/v1/admin/appels'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les appels.');
      setAppels([]);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  function ouvrirCreation() {
    setForm(emptyForm());
    setEditing('new');
  }

  function ouvrirEdition(a: AppelCandidature) {
    setForm({
      titre: a.titre,
      description: a.description ?? '',
      date_limite: a.date_limite ?? '',
      est_actif: a.est_actif,
      afficheFile: null,
      retirerAffiche: false,
    });
    setEditing(a);
  }

  async function enregistrer() {
    if (!form.titre.trim()) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre.trim());
      fd.append('description', form.description.trim());
      fd.append('date_limite', form.date_limite);
      fd.append('est_actif', form.est_actif ? '1' : '0');
      if (form.afficheFile) fd.append('affiche', form.afficheFile);
      if (form.retirerAffiche && !form.afficheFile) fd.append('retirer_affiche', '1');

      if (editing === 'new') {
        await api.postForm('/v1/admin/appels', fd);
        toast.success('Appel créé.');
      } else if (editing) {
        await api.postForm(`/v1/admin/appels/${editing.id}`, fd, 'PUT');
        toast.success('Appel mis à jour.');
      }
      setEditing(null);
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function basculerActif(a: AppelCandidature) {
    try {
      await api.put(`/v1/admin/appels/${a.id}`, { est_actif: !a.est_actif });
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  async function supprimer(a: AppelCandidature) {
    if (!confirm(`Supprimer l'appel « ${a.titre} » et ses ${a.candidatures_count ?? 0} candidature(s) ? Pour garder l'historique, désactivez-le plutôt.`)) return;
    try {
      await api.delete(`/v1/admin/appels/${a.id}`);
      toast.success('Appel supprimé.');
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  async function voirCandidatures(a: AppelCandidature) {
    setCandidatsDe(a);
    setCandidatures(null);
    try {
      const data = await api.get<{ candidatures: Candidature[]; statuts: Record<string, string> }>(`/v1/admin/appels/${a.id}/candidatures`);
      setCandidatures(data.candidatures);
      setStatuts(data.statuts);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les candidatures.');
      setCandidatures([]);
    }
  }

  async function changerStatut(c: Candidature, statut: string) {
    try {
      const maj = await api.put<Candidature>(`/v1/admin/appels/candidatures/${c.id}`, { statut });
      setCandidatures((prev) => prev?.map((x) => (x.id === maj.id ? maj : x)) ?? null);
      charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour du statut.');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appels à candidatures</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Affichés sur la page Culture & Patrimoine, avec un formulaire de candidature.
          </p>
        </div>
        {peutModifier && (
          <Button onClick={ouvrirCreation} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4 mr-2" /> Nouvel appel
          </Button>
        )}
      </div>

      {appels === null ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : appels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aucun appel pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appels.map((a) => {
            const statut = statutAppel(a);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-4 min-w-0">
                    {a.affiche_url && <img src={a.affiche_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-bold text-slate-900">{a.titre}</h2>
                        <Badge variant="outline" className={statut.classe}>{statut.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {a.date_limite ? `Date limite : ${formaterDate(a.date_limite)}` : 'Sans date limite'}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        <strong>{a.candidatures_count ?? 0}</strong> candidature(s), dont{' '}
                        <strong>{a.candidatures_nouvelles_count ?? 0}</strong> nouvelle(s) et{' '}
                        <strong>{a.candidatures_retenues_count ?? 0}</strong> retenue(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {peutModifier && (
                      <label className="flex items-center gap-2 text-xs text-slate-500 mr-2">
                        Actif <Switch checked={a.est_actif} onCheckedChange={() => basculerActif(a)} />
                      </label>
                    )}
                    <Button size="sm" variant="outline" onClick={() => voirCandidatures(a)}>
                      <Users className="w-3.5 h-3.5 mr-1.5" /> Candidatures
                    </Button>
                    {peutModifier && (
                      <Button size="sm" variant="outline" onClick={() => ouvrirEdition(a)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
                      </Button>
                    )}
                    {hasRole('super_admin') && (
                      <Button size="sm" variant="outline" onClick={() => supprimer(a)}>
                        <Trash2 className="w-3.5 h-3.5 text-brand-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Nouvel appel à candidatures' : "Modifier l'appel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="appel-titre">Titre</Label>
              <Input id="appel-titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex. Comité de pilotage des activités culturelles" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appel-description">Texte de présentation</Label>
              <Textarea id="appel-description" rows={6} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appel-date">Date limite (incluse)</Label>
              <Input id="appel-date" type="date" value={form.date_limite} onChange={(e) => setForm((f) => ({ ...f, date_limite: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appel-affiche">Affiche (image)</Label>
              <Input id="appel-affiche" type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={(e) => setForm((f) => ({ ...f, afficheFile: e.target.files?.[0] || null }))} />
              {editing !== 'new' && editing?.affiche_url && (
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={form.retirerAffiche} onChange={(e) => setForm((f) => ({ ...f, retirerAffiche: e.target.checked }))} />
                  Retirer l'affiche actuelle
                </label>
              )}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">Actif</div>
                <div className="text-xs text-slate-400">Visible sur le site jusqu'à la date limite.</div>
              </div>
              <Switch checked={form.est_actif} onCheckedChange={(v) => setForm((f) => ({ ...f, est_actif: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={enregistrer} className="bg-brand-green-600 hover:bg-brand-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing === 'new' ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!candidatsDe} onOpenChange={(open) => !open && setCandidatsDe(null)}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-6">
              Candidatures — {candidatsDe?.titre}
              {candidatsDe && (candidatures?.length ?? 0) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(`/v1/admin/appels/${candidatsDe.id}/candidatures/export`, `appel-${candidatsDe.id}-candidatures.csv`).catch(
                      (err) => toast.error(err instanceof ApiError ? err.message : "Échec de l'export.")
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter (CSV)
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {candidatures === null ? (
            <div className="flex justify-center py-10 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : candidatures.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Aucune candidature pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidat</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Présentation</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Reçue le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatures.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="align-top">
                      <div className="font-medium text-slate-800">{c.prenom} {c.nom}</div>
                      <div className="text-xs text-slate-400">
                        {c.domaine_label}{c.discipline ? ` · ${c.discipline}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-slate-500">
                      <div>{c.email}</div>
                      <div>{c.telephone}</div>
                      {c.ville && <div>{c.ville}</div>}
                    </TableCell>
                    <TableCell className="align-top max-w-xs">
                      <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-5" title={c.presentation}>{c.presentation}</p>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      <div className="space-y-1">
                        {c.fichier_disponible && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-brand-green-700 hover:underline"
                            onClick={() =>
                              openFile(`/v1/admin/appels/candidatures/${c.id}/fichier`).catch((err) =>
                                toast.error(err instanceof ApiError ? err.message : "Impossible d'ouvrir le fichier.")
                              )
                            }
                          >
                            <FileText className="w-3.5 h-3.5" /> Fichier
                          </button>
                        )}
                        {c.lien_portfolio && (
                          <a href={c.lien_portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-green-700 hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" /> Lien
                          </a>
                        )}
                        {!c.fichier_disponible && !c.lien_portfolio && <span className="text-slate-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {peutModifier ? (
                        <select className={CHAMP_SELECT} value={c.statut} onChange={(e) => changerStatut(c, e.target.value)}>
                          {Object.entries(statuts).map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant="outline">{c.statut_label}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right text-sm text-slate-400">{c.created_at.slice(0, 10).split('-').reverse().join('/')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
