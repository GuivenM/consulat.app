import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, Calendar, MapPin, Search, ArrowUp, ArrowDown, ArrowUpDown, MessageCircle, Facebook, Share2, X, ImagePlus } from 'lucide-react';
import { Zoomable } from '../../components/Zoomable';
import { api, ApiError } from '../../../lib/api';
import { compressImage } from '../../../lib/compressImage';
import { useAuth } from '../../context/AuthContext';
import type { Actualite, StatutActualite, TypeActualite } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

const TYPE_LABELS: Record<TypeActualite, string> = {
  actualite: 'Actualité',
  evenement: 'Événement',
  education: 'Éducation',
  culture: 'Culture',
};

const STATUT_LABELS: Record<StatutActualite, string> = {
  publie: 'Publié',
  brouillon: 'Brouillon',
};

const STATUT_BADGE: Record<StatutActualite, string> = {
  publie: 'bg-brand-green-50 text-brand-green-600 border-brand-green-200',
  brouillon: 'bg-slate-100 text-slate-500 border-slate-200',
};

type FilterTab = 'tous' | StatutActualite;

interface FormState {
  titre: string;
  description: string;
  contenu: string;
  type: TypeActualite;
  dateEvenement: string;
  lieuEvenement: string;
  statut: StatutActualite;
  photosExistantes: { id: number; url: string }[];
  photosSupprimees: number[];
  nouvellesPhotos: File[];
}

function emptyForm(): FormState {
  return {
    titre: '',
    description: '',
    contenu: '',
    type: 'actualite',
    dateEvenement: '',
    lieuEvenement: '',
    statut: 'brouillon',
    photosExistantes: [],
    photosSupprimees: [],
    nouvellesPhotos: [],
  };
}

export function AdminActualites() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('super_admin', 'admin');
  const canEdit = hasRole('super_admin', 'admin');
  const canDelete = hasRole('super_admin');

  const [actualites, setActualites] = useState<Actualite[] | null>(null);
  const [filter, setFilter] = useState<FilterTab>('tous');
  const [editing, setEditing] = useState<Actualite | 'new' | null>(null);
  const [viewing, setViewing] = useState<Actualite | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'titre' | 'type' | 'created_at' | 'statut'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [facebookConfigure, setFacebookConfigure] = useState(false);
  const [partageId, setPartageId] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api.get<Actualite[]>('/v1/actualites?all=1');
      setActualites(data);
    } catch {
      toast.error('Impossible de charger les actualités.');
    }
  }

  useEffect(() => {
    load();
    api
      .get<{ facebook_configure: boolean }>('/v1/actualites/partage-config')
      .then((c) => setFacebookConfigure(c.facebook_configure))
      .catch(() => setFacebookConfigure(false));
  }, []);

  function lienWhatsapp(a: Actualite) {
    const extraitContenu = a.contenu.length > 300 ? a.contenu.slice(0, 300).trimEnd() + '…' : a.contenu;
    const mentionPhotos = a.photos_urls.length > 1 ? `\n📸 ${a.photos_urls.length} photos à voir sur le lien.` : '';
    const texte = `*${a.titre}*\n\n${a.description}\n\n${extraitContenu}${mentionPhotos}\n\n${a.lien_public}`;
    return `https://wa.me/?text=${encodeURIComponent(texte)}`;
  }

  function lienPartageFacebookManuel(a: Actualite) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(a.lien_public)}`;
  }

  async function publierSurFacebook(a: Actualite) {
    setPartageId(a.id);
    try {
      const updated = await api.post<Actualite>(`/v1/actualites/${a.id}/partager-facebook`);
      setActualites((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      toast.success('Actualité publiée sur la Page Facebook.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la publication Facebook.');
    } finally {
      setPartageId(null);
    }
  }

  function toggleSort(key: 'titre' | 'type' | 'created_at' | 'statut') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    if (!actualites) return [];
    let list = filter === 'tous' ? actualites : actualites.filter((a) => a.statut === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.titre.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.auteur.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'titre') cmp = a.titre.localeCompare(b.titre);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortKey === 'statut') cmp = a.statut.localeCompare(b.statut);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [actualites, filter, search, sortKey, sortDir]);

  function openCreate() {
    setForm(emptyForm());
    setEditing('new');
  }

  function openEdit(a: Actualite) {
    setForm({
      titre: a.titre,
      description: a.description,
      contenu: a.contenu,
      type: a.type,
      dateEvenement: a.date_evenement ? a.date_evenement.slice(0, 10) : '',
      lieuEvenement: a.lieu_evenement || '',
      statut: a.statut,
      photosExistantes: a.photos,
      photosSupprimees: [],
      nouvellesPhotos: [],
    });
    setEditing(a);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('titre', form.titre);
    fd.append('description', form.description);
    fd.append('contenu', form.contenu);
    fd.append('type', form.type);
    if (form.dateEvenement) fd.append('date_evenement', form.dateEvenement);
    if (form.lieuEvenement) fd.append('lieu_evenement', form.lieuEvenement);
    fd.append('statut', form.statut);
    form.nouvellesPhotos.forEach((f) => fd.append('photos[]', f));
    form.photosSupprimees.forEach((id) => fd.append('photos_supprimees[]', String(id)));
    return fd;
  }

  async function save() {
    if (!form.titre.trim() || !form.description.trim() || !form.contenu.trim()) {
      toast.error('Titre, description et contenu sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      if (editing === 'new') {
        const created = await api.postForm<Actualite>('/v1/actualites', fd, 'POST');
        setActualites((prev) => (prev ? [created, ...prev] : [created]));
        toast.success('Actualité créée avec succès.');
      } else if (editing) {
        const updated = await api.postForm<Actualite>(`/v1/actualites/${editing.id}`, fd, 'PUT');
        setActualites((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null);
        toast.success('Actualité mise à jour.');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Actualite) {
    if (!confirm(`Supprimer définitivement « ${a.titre} » ?`)) return;
    try {
      await api.delete(`/v1/actualites/${a.id}`);
      setActualites((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
      toast.success('Actualité supprimée.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Actualités</h1>
          <p className="text-slate-500 text-sm mt-0.5">Articles et annonces publiés sur le site.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4" /> Rédiger une actualité
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="tous">Toutes</TabsTrigger>
            <TabsTrigger value="publie">Publiées</TabsTrigger>
            <TabsTrigger value="brouillon">Brouillons</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une actualité…"
            className="pl-9"
          />
        </div>
      </div>

      {actualites === null ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-brand-green-100">
          Aucune actualité dans cette catégorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Titre" active={sortKey === 'titre'} dir={sortDir} onClick={() => toggleSort('titre')} />
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortableHeader label="Type" active={sortKey === 'type'} dir={sortDir} onClick={() => toggleSort('type')} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <SortableHeader label="Publié le" active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setViewing(a)}>
                  <TableCell>
                    <div className="font-medium text-slate-900 line-clamp-1">{a.titre}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{a.description}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{TYPE_LABELS[a.type]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-500 text-sm">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_BADGE[a.statut]}>
                      {STATUT_LABELS[a.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(a)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Envoyer sur WhatsApp"
                        onClick={() => window.open(lienWhatsapp(a), '_blank', 'noopener')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      {a.facebook_post_url ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Voir le post Facebook"
                          className="text-brand-green-600"
                          onClick={() => window.open(a.facebook_post_url!, '_blank', 'noopener')}
                        >
                          <Facebook className="w-4 h-4" />
                        </Button>
                      ) : facebookConfigure ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Publier sur Facebook"
                          disabled={partageId === a.id}
                          onClick={() => publierSurFacebook(a)}
                        >
                          {partageId === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Facebook className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Partager sur Facebook"
                          onClick={() => window.open(lienPartageFacebookManuel(a), '_blank', 'noopener')}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-brand-red-600 hover:text-brand-red-700"
                          onClick={() => remove(a)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              {viewing.photos_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 -mt-2">
                  {viewing.photos_urls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                      <Zoomable
                        src={url}
                        alt={viewing.titre}
                        downloadable
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle>{viewing.titre}</DialogTitle>
                  <Badge variant="outline" className={STATUT_BADGE[viewing.statut]}>
                    {STATUT_LABELS[viewing.statut]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{TYPE_LABELS[viewing.type]}</Badge>
                  <span className="text-xs text-slate-400">
                    Publié le {new Date(viewing.created_at).toLocaleDateString('fr-FR')} — {viewing.auteur}
                  </span>
                </div>

                {(viewing.date_evenement || viewing.lieu_evenement) && (
                  <div className="flex flex-wrap gap-4 text-slate-600">
                    {viewing.date_evenement && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(viewing.date_evenement).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {viewing.lieu_evenement && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {viewing.lieu_evenement}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-slate-600 italic">{viewing.description}</p>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-700 whitespace-pre-wrap">{viewing.contenu}</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => window.open(lienWhatsapp(viewing), '_blank', 'noopener')}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                {viewing.facebook_post_url ? (
                  <Button
                    variant="outline"
                    className="text-brand-green-600"
                    onClick={() => window.open(viewing.facebook_post_url!, '_blank', 'noopener')}
                  >
                    <Facebook className="w-4 h-4" /> Voir sur Facebook
                  </Button>
                ) : facebookConfigure ? (
                  <Button
                    variant="outline"
                    disabled={partageId === viewing.id}
                    onClick={() => publierSurFacebook(viewing)}
                  >
                    {partageId === viewing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Facebook className="w-4 h-4" />
                    )}
                    Publier sur Facebook
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => window.open(lienPartageFacebookManuel(viewing), '_blank', 'noopener')}
                  >
                    <Share2 className="w-4 h-4" /> Partager sur Facebook
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewing(null);
                      openEdit(viewing);
                    }}
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Rédiger une actualité' : "Modifier l'actualité"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description courte</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Affichée dans les listes et l'extrait de l'article"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contenu">Contenu</Label>
              <Textarea
                id="contenu"
                rows={6}
                value={form.contenu}
                onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Photos</Label>
              <p className="text-xs text-slate-500">
                La 1ère photo sert de couverture. Utilisées telles quelles pour le post Facebook natif.
              </p>

              {(form.photosExistantes.length > 0 || form.nouvellesPhotos.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.photosExistantes.map((p) => {
                    const marqueeSupprimee = form.photosSupprimees.includes(p.id);
                    return (
                      <div
                        key={`existante-${p.id}`}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border ${marqueeSupprimee ? 'opacity-30 border-brand-red-300' : 'border-slate-200'}`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              photosSupprimees: marqueeSupprimee
                                ? f.photosSupprimees.filter((id) => id !== p.id)
                                : [...f.photosSupprimees, p.id],
                            }))
                          }
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {form.nouvellesPhotos.map((f, i) => (
                    <div key={`nouvelle-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-brand-green-300">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                        onClick={() =>
                          setForm((form2) => ({
                            ...form2,
                            nouvellesPhotos: form2.nouvellesPhotos.filter((_, idx) => idx !== i),
                          }))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                htmlFor="photos"
                className="flex items-center gap-2 justify-center border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 hover:border-slate-400 cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" /> Ajouter des photos
              </label>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={async (e) => {
                  const fichiers = Array.from(e.target.files || []);
                  const compressees = await Promise.all(fichiers.map((f) => compressImage(f)));
                  setForm((f) => ({
                    ...f,
                    nouvellesPhotos: [...f.nouvellesPhotos, ...compressees],
                  }));
                  e.target.value = '';
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as TypeActualite }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) => setForm((f) => ({ ...f, statut: v as StatutActualite }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="publie">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'evenement' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date-evenement">Date de l'événement (optionnel)</Label>
                  <Input
                    id="date-evenement"
                    type="date"
                    value={form.dateEvenement}
                    onChange={(e) => setForm((f) => ({ ...f, dateEvenement: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lieu-evenement">Lieu (optionnel)</Label>
                  <Input
                    id="lieu-evenement"
                    value={form.lieuEvenement}
                    onChange={(e) => setForm((f) => ({ ...f, lieuEvenement: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={saving}
              onClick={save}
              className="bg-brand-green-600 hover:bg-brand-green-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing === 'new' ? 'Publier' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 hover:text-slate-900">
      {label}
      {active ? (
        dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 text-slate-300" />
      )}
    </button>
  );
}
