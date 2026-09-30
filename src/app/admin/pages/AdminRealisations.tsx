import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Images, EyeOff } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { compressImage } from '../../../lib/compressImage';
import { useAuth } from '../../context/AuthContext';
import type { Realisation, RubriqueRealisation } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

type FilterTab = 'toutes' | RubriqueRealisation;

const RUBRIQUE_LABEL: Record<RubriqueRealisation, string> = {
  communaute: 'Communauté',
  culture_patrimoine: 'Culture & Patrimoine',
};

interface FormState {
  rubrique: RubriqueRealisation;
  titre: string;
  description: string;
  contenu: string;
  dateRealisation: string;
  publie: boolean;
  photoFile: File | null;
  photosExistantes: { id: number; url: string }[];
  photosSupprimees: number[];
  nouvellesPhotos: File[];
}

const emptyForm = (rubrique: RubriqueRealisation = 'communaute'): FormState => ({
  rubrique,
  titre: '',
  description: '',
  contenu: '',
  dateRealisation: '',
  publie: true,
  photoFile: null,
  photosExistantes: [],
  photosSupprimees: [],
  nouvellesPhotos: [],
});

export function AdminRealisations() {
  const { hasRole } = useAuth();
  const [realisations, setRealisations] = useState<Realisation[] | null>(null);
  const [filter, setFilter] = useState<FilterTab>('toutes');
  const [editing, setEditing] = useState<Realisation | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [aSupprimer, setASupprimer] = useState<Realisation | null>(null);

  async function charger() {
    try {
      setRealisations(await api.get<Realisation[]>('/v1/realisations'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les réalisations.');
      setRealisations([]);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  function openNew() {
    setForm(emptyForm(filter === 'toutes' ? 'communaute' : filter));
    setEditing('new');
  }

  function openEdit(r: Realisation) {
    setForm({
      rubrique: r.rubrique,
      titre: r.titre,
      description: r.description ?? '',
      contenu: r.contenu ?? '',
      dateRealisation: r.date_realisation ?? '',
      publie: r.publie,
      photoFile: null,
      photosExistantes: r.photos ?? [],
      photosSupprimees: [],
      nouvellesPhotos: [],
    });
    setEditing(r);
  }

  async function save() {
    if (!form.titre.trim()) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('rubrique', form.rubrique);
      fd.append('titre', form.titre);
      fd.append('description', form.description);
      fd.append('contenu', form.contenu);
      fd.append('date_realisation', form.dateRealisation);
      fd.append('publie', form.publie ? '1' : '0');
      if (form.photoFile) fd.append('photo', await compressImage(form.photoFile));
      for (const f of form.nouvellesPhotos) fd.append('photos[]', await compressImage(f));
      form.photosSupprimees.forEach((id) => fd.append('photos_supprimees[]', String(id)));

      if (editing === 'new') {
        await api.postForm<Realisation>('/v1/realisations', fd, 'POST');
        toast.success('Réalisation ajoutée.');
      } else if (editing) {
        await api.postForm<Realisation>(`/v1/realisations/${editing.id}`, fd, 'PUT');
        toast.success('Réalisation mise à jour.');
      }
      setEditing(null);
      await charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function supprimer() {
    if (!aSupprimer) return;
    try {
      await api.delete(`/v1/realisations/${aSupprimer.id}`);
      setRealisations((prev) => prev?.filter((r) => r.id !== aSupprimer.id) ?? null);
      toast.success('Réalisation supprimée.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    } finally {
      setASupprimer(null);
    }
  }

  const visibles = (realisations ?? []).filter((r) => filter === 'toutes' || r.rubrique === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Réalisations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Affichées sur les pages publiques Communauté et Culture & Patrimoine.
          </p>
        </div>
        <Button onClick={openNew} className="bg-brand-green-600 hover:bg-brand-green-700">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="mb-5">
        <TabsList>
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
          <TabsTrigger value="communaute">Communauté</TabsTrigger>
          <TabsTrigger value="culture_patrimoine">Culture & Patrimoine</TabsTrigger>
        </TabsList>
      </Tabs>

      {realisations === null ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : visibles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Images className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aucune réalisation pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
              {r.photo_url ? (
                <img src={r.photo_url} alt={r.titre} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-300">
                  <Images className="w-8 h-8" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">{RUBRIQUE_LABEL[r.rubrique]}</Badge>
                  {!r.publie && (
                    <Badge variant="outline" className="gap-1 text-slate-500">
                      <EyeOff className="w-3 h-3" /> Brouillon
                    </Badge>
                  )}
                </div>
                <div className="font-semibold text-slate-900">{r.titre}</div>
                {r.description && <p className="text-sm text-slate-500 mt-1 line-clamp-3">{r.description}</p>}
                <div className="mt-auto pt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
                  </Button>
                  {hasRole('super_admin') && (
                    <Button size="sm" variant="outline" onClick={() => setASupprimer(r)}>
                      <Trash2 className="w-3.5 h-3.5 text-brand-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Ajouter une réalisation' : 'Modifier la réalisation'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rubrique</Label>
              <Select value={form.rubrique} onValueChange={(v) => setForm((f) => ({ ...f, rubrique: v as RubriqueRealisation }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="communaute">Communauté</SelectItem>
                  <SelectItem value="culture_patrimoine">Culture & Patrimoine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-titre">Titre</Label>
              <Input id="realisation-titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-description">Résumé (affiché sur la carte)</Label>
              <Textarea id="realisation-description" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-contenu">Texte complet (page de détail)</Label>
              <Textarea id="realisation-contenu" rows={8} value={form.contenu} onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-date">Date</Label>
              <Input id="realisation-date" type="date" value={form.dateRealisation} onChange={(e) => setForm((f) => ({ ...f, dateRealisation: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-photo">Photo de couverture</Label>
              <Input
                id="realisation-photo"
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={(e) => setForm((f) => ({ ...f, photoFile: e.target.files?.[0] || null }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="realisation-photos">Galerie (10 photos max)</Label>
              {form.photosExistantes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.photosExistantes.map((p) => {
                    const retiree = form.photosSupprimees.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={retiree ? 'Annuler la suppression' : 'Retirer cette photo'}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            photosSupprimees: retiree
                              ? f.photosSupprimees.filter((id) => id !== p.id)
                              : [...f.photosSupprimees, p.id],
                          }))
                        }
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border ${retiree ? 'opacity-30 border-brand-red-500' : 'border-slate-200'}`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        {retiree && <Trash2 className="absolute inset-0 m-auto w-5 h-5 text-brand-red-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <Input
                id="realisation-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={(e) => setForm((f) => ({ ...f, nouvellesPhotos: Array.from(e.target.files ?? []) }))}
              />
              {form.nouvellesPhotos.length > 0 && (
                <p className="text-xs text-slate-400">{form.nouvellesPhotos.length} photo(s) à ajouter</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">Publiée</div>
                <div className="text-xs text-slate-400">Décochée, l'entrée reste visible uniquement ici.</div>
              </div>
              <Switch checked={form.publie} onCheckedChange={(v) => setForm((f) => ({ ...f, publie: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={saving} onClick={save} className="bg-brand-green-600 hover:bg-brand-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing === 'new' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(open) => !open && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette réalisation ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {aSupprimer?.titre} » sera retirée définitivement du site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
