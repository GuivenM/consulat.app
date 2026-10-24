import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Megaphone, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, downloadFile } from '../../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Campagne, InscriptionCampagneAdmin } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

const formaterMontant = (montant: number, devise: string) =>
  `${new Intl.NumberFormat('fr-FR').format(montant)} ${devise === 'XOF' ? 'FCFA' : devise}`;

const formaterDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

function statutCampagne(c: Campagne): { label: string; classe: string } {
  if (!c.est_active) return { label: 'Désactivée', classe: 'text-slate-500' };
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (c.date_debut && c.date_debut > aujourdhui) return { label: 'À venir', classe: 'text-amber-700 bg-amber-50' };
  if (c.date_fin && c.date_fin < aujourdhui) return { label: 'Terminée', classe: 'text-slate-500' };
  return { label: 'En cours', classe: 'text-brand-green-700 bg-brand-green-50' };
}

interface FormState {
  titre: string;
  description: string;
  montant: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
}

const emptyForm = (): FormState => ({ titre: '', description: '', montant: '', date_debut: '', date_fin: '', est_active: true });

export function AdminCampagnes() {
  const { hasRole } = useAuth();
  const peutModifier = hasRole('super_admin', 'admin');
  const [campagnes, setCampagnes] = useState<Campagne[] | null>(null);
  const [editing, setEditing] = useState<Campagne | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [inscritsDe, setInscritsDe] = useState<Campagne | null>(null);
  const [inscrits, setInscrits] = useState<InscriptionCampagneAdmin[] | null>(null);

  async function charger() {
    try {
      setCampagnes(await api.get<Campagne[]>('/v1/admin/campagnes'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les campagnes.');
      setCampagnes([]);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  function ouvrirCreation() {
    setForm(emptyForm());
    setEditing('new');
  }

  function ouvrirEdition(c: Campagne) {
    setForm({
      titre: c.titre,
      description: c.description ?? '',
      montant: c.montant !== null ? String(c.montant) : '',
      date_debut: c.date_debut ?? '',
      date_fin: c.date_fin ?? '',
      est_active: c.est_active,
    });
    setEditing(c);
  }

  async function enregistrer() {
    if (!form.titre.trim()) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        montant: form.montant === '' ? null : Number(form.montant),
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        est_active: form.est_active,
      };
      if (editing === 'new') {
        await api.post('/v1/admin/campagnes', payload);
        toast.success('Campagne créée.');
      } else if (editing) {
        await api.put(`/v1/admin/campagnes/${editing.id}`, payload);
        toast.success('Campagne mise à jour.');
      }
      setEditing(null);
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function supprimer(c: Campagne) {
    if (!confirm(`Supprimer la campagne « ${c.titre} » et ses ${c.inscriptions_count ?? 0} inscription(s) ? Pour garder l'historique, désactivez-la plutôt.`)) return;
    try {
      await api.delete(`/v1/admin/campagnes/${c.id}`);
      toast.success('Campagne supprimée.');
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  async function basculerActive(c: Campagne) {
    try {
      await api.put(`/v1/admin/campagnes/${c.id}`, { est_active: !c.est_active });
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  async function voirInscrits(c: Campagne) {
    setInscritsDe(c);
    setInscrits(null);
    try {
      setInscrits(await api.get<InscriptionCampagneAdmin[]>(`/v1/admin/campagnes/${c.id}/inscriptions`));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les inscrits.');
      setInscrits([]);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campagnes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Campagnes proposées aux ressortissants dans l'espace consulaire (ex. campagne passeports).
          </p>
        </div>
        {peutModifier && (
          <Button onClick={ouvrirCreation} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle campagne
          </Button>
        )}
      </div>

      {campagnes === null ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : campagnes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aucune campagne pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campagnes.map((c) => {
            const statut = statutCampagne(c);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-bold text-slate-900">{c.titre}</h2>
                      <Badge variant="outline" className={statut.classe}>{statut.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {c.date_debut || c.date_fin
                        ? `${c.date_debut ? `Du ${formaterDate(c.date_debut)}` : ''}${c.date_debut && c.date_fin ? ' ' : ''}${c.date_fin ? `au ${formaterDate(c.date_fin)}` : ''}`
                        : 'Sans limite de dates'}
                      {c.montant !== null && ` · Montant : ${formaterMontant(c.montant, c.devise)}`}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      <strong>{c.inscriptions_count ?? 0}</strong> inscrit(s), dont{' '}
                      <strong>{c.inscriptions_avec_somme_count ?? 0}</strong> disposant de la somme
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {peutModifier && (
                      <label className="flex items-center gap-2 text-xs text-slate-500 mr-2">
                        Active <Switch checked={c.est_active} onCheckedChange={() => basculerActive(c)} />
                      </label>
                    )}
                    <Button size="sm" variant="outline" onClick={() => voirInscrits(c)}>
                      <Users className="w-3.5 h-3.5 mr-1.5" /> Inscrits
                    </Button>
                    {peutModifier && (
                      <Button size="sm" variant="outline" onClick={() => ouvrirEdition(c)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
                      </Button>
                    )}
                    {hasRole('super_admin') && (
                      <Button size="sm" variant="outline" onClick={() => supprimer(c)}>
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
            <DialogTitle>{editing === 'new' ? 'Nouvelle campagne' : 'Modifier la campagne'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="campagne-titre">Titre</Label>
              <Input id="campagne-titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex. Campagne passeports" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campagne-description">Texte affiché aux ressortissants</Label>
              <Textarea id="campagne-description" rows={7} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Présentation, pièces à fournir, lieu, déroulement…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campagne-montant">Montant demandé (FCFA)</Label>
              <Input id="campagne-montant" type="number" min={0} value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} placeholder="80000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="campagne-debut">Date de début</Label>
                <Input id="campagne-debut" type="date" value={form.date_debut} onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campagne-fin">Date de fin</Label>
                <Input id="campagne-fin" type="date" value={form.date_fin} onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">Active</div>
                <div className="text-xs text-slate-400">Visible dans l'espace consulaire pendant sa période.</div>
              </div>
              <Switch checked={form.est_active} onCheckedChange={(v) => setForm((f) => ({ ...f, est_active: v }))} />
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

      <Dialog open={!!inscritsDe} onOpenChange={(open) => !open && setInscritsDe(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-6">
              Inscrits — {inscritsDe?.titre}
              {inscritsDe && (inscrits?.length ?? 0) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(`/v1/admin/campagnes/${inscritsDe.id}/inscriptions/export`, `campagne-${inscritsDe.id}-inscrits.csv`).catch(
                      (err) => toast.error(err instanceof ApiError ? err.message : "Échec de l'export.")
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter (CSV)
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {inscrits === null ? (
            <div className="flex justify-center py-10 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : inscrits.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Aucun inscrit pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ressortissant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville / Quartier</TableHead>
                  <TableHead>Situation</TableHead>
                  <TableHead>Somme</TableHead>
                  <TableHead className="text-right">Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscrits.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium text-slate-800">{i.nom_complet ?? '—'}</div>
                      <div className="text-xs font-mono text-slate-400">{i.numero_registre ?? ''}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{i.telephone || i.email || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {i.ville || '—'}{i.quartier ? ` · ${i.quartier}` : ''}
                    </TableCell>
                    <TableCell className="text-sm">
                      {i.situation_label}
                      {i.commentaire && <div className="text-xs text-slate-400 mt-0.5">{i.commentaire}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={i.dispose_montant ? 'text-brand-green-700 bg-brand-green-50' : 'text-amber-700 bg-amber-50'}>
                        {i.dispose_montant ? 'Oui' : 'Pas encore'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-400">{i.created_at}</TableCell>
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
