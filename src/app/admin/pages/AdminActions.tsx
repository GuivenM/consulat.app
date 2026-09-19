import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, Calendar, MapPin, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { compressImage } from '../../../lib/compressImage';
import { useAuth } from '../../context/AuthContext';
import { Zoomable } from '../../components/Zoomable';
import type { Action, StatutAction, SectionAction } from '../types';
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

const SECTION_LABELS: Record<SectionAction, string> = {
  solidarite: 'Solidarité & Intégration',
  education: 'Éducation & Formation',
  culture: 'Culture & Identité',
  communication: 'Communication & Partenariats',
};

const STATUT_LABELS: Record<StatutAction, string> = {
  actif: 'En cours',
  a_venir: 'À venir',
  termine: 'Terminé',
  inactif: 'Inactif',
};

const STATUT_BADGE: Record<StatutAction, string> = {
  actif: 'bg-brand-green-50 text-brand-green-600 border-brand-green-200',
  a_venir: 'bg-brand-gold-50 text-brand-gold-500 border-brand-gold-200',
  termine: 'bg-slate-100 text-slate-500 border-slate-200',
  inactif: 'bg-brand-red-50 text-brand-red-600 border-brand-red-200',
};

type FilterTab = 'toutes' | SectionAction;

interface FormState {
  titre: string;
  description: string;
  section: SectionAction;
  dateDebut: string;
  dateFin: string;
  dateEvenement: string;
  lieu: string;
  objectifs: string;
  activitesCles: string;
  resultats: string;
  statut: StatutAction;
  imageFile: File | null;
}

function emptyForm(): FormState {
  return {
    titre: '', description: '', section: 'solidarite', dateDebut: '', dateFin: '',
    dateEvenement: '', lieu: '', objectifs: '', activitesCles: '', resultats: '',
    statut: 'a_venir', imageFile: null,
  };
}

function toLines(v: string) {
  return v.split('\n').map((l) => l.trim()).filter(Boolean);
}

export function AdminActions() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('super_admin', 'admin');
  const canDelete = hasRole('super_admin');

  const [actions, setActions] = useState<Action[] | null>(null);
  const [filter, setFilter] = useState<FilterTab>('toutes');
  const [editing, setEditing] = useState<Action | 'new' | null>(null);
  const [viewing, setViewing] = useState<Action | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'titre' | 'section' | 'statut'>('titre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  async function load() {
    try {
      const data = await api.get<Action[]>('/v1/actions');
      setActions(data);
    } catch {
      toast.error('Impossible de charger les actions.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: 'titre' | 'section' | 'statut') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    if (!actions) return [];
    let list = filter === 'toutes' ? actions : actions.filter((a) => a.section === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.titre.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.lieu || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'titre') cmp = a.titre.localeCompare(b.titre);
      else if (sortKey === 'section') cmp = a.section.localeCompare(b.section);
      else cmp = a.statut.localeCompare(b.statut);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [actions, filter, search, sortKey, sortDir]);

  function openCreate() {
    setForm(emptyForm());
    setEditing('new');
  }

  function openEdit(a: Action) {
    setForm({
      titre: a.titre,
      description: a.description,
      section: a.section,
      dateDebut: a.date_debut ? a.date_debut.slice(0, 10) : '',
      dateFin: a.date_fin ? a.date_fin.slice(0, 10) : '',
      dateEvenement: a.date_evenement ? a.date_evenement.slice(0, 10) : '',
      lieu: a.lieu || '',
      objectifs: (a.objectifs || []).join('\n'),
      activitesCles: (a.activites_cles || []).join('\n'),
      resultats: (a.resultats || []).join('\n'),
      statut: a.statut,
      imageFile: null,
    });
    setEditing(a);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('titre', form.titre);
    fd.append('description', form.description);
    fd.append('section', form.section);
    if (form.dateDebut) fd.append('date_debut', form.dateDebut);
    if (form.dateFin) fd.append('date_fin', form.dateFin);
    if (form.dateEvenement) fd.append('date_evenement', form.dateEvenement);
    if (form.lieu) fd.append('lieu', form.lieu);
    toLines(form.objectifs).forEach((v) => fd.append('objectifs[]', v));
    toLines(form.activitesCles).forEach((v) => fd.append('activites_cles[]', v));
    toLines(form.resultats).forEach((v) => fd.append('resultats[]', v));
    fd.append('statut', form.statut);
    if (form.imageFile) fd.append('image', form.imageFile);
    return fd;
  }

  async function save() {
    if (!form.titre.trim() || !form.description.trim()) {
      toast.error('Titre et description sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      if (editing === 'new') {
        const created = await api.postForm<Action>('/v1/actions', fd, 'POST');
        setActions((prev) => (prev ? [created, ...prev] : [created]));
        toast.success('Action créée avec succès.');
      } else if (editing) {
        // La route de mise à jour est en POST côté backend (pas de PUT).
        const updated = await api.postForm<Action>(`/v1/actions/${editing.id}`, fd, 'POST');
        setActions((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null);
        toast.success('Action mise à jour.');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Action) {
    if (!confirm(`Supprimer définitivement « ${a.titre} » ?`)) return;
    try {
      await api.delete(`/v1/actions/${a.id}`);
      setActions((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
      toast.success('Action supprimée.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Actions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Projets et réalisations, par catégorie.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4" /> Créer une action
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="toutes">Toutes</TabsTrigger>
            {Object.entries(SECTION_LABELS).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une action…"
            className="pl-9"
          />
        </div>
      </div>

      {actions === null ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-brand-green-100">
          Aucune action dans cette catégorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Action" active={sortKey === 'titre'} dir={sortDir} onClick={() => toggleSort('titre')} />
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortableHeader label="Commission" active={sortKey === 'section'} dir={sortDir} onClick={() => toggleSort('section')} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">Lieu</TableHead>
                <TableHead>
                  <SortableHeader label="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setViewing(a)}>
                  <TableCell className="max-w-[320px]">
                    <div className="font-medium text-slate-900 line-clamp-1">{a.titre}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{a.description}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{SECTION_LABELS[a.section]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600 text-sm">
                    {a.lieu || '—'}
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
                      {canWrite && (
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
              {viewing.image_url && (
                <Zoomable
                  src={viewing.image_url}
                  alt={viewing.titre}
                  downloadable
                  className="w-full h-44 object-cover rounded-xl -mt-2"
                />
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
                  <Badge variant="secondary">{SECTION_LABELS[viewing.section]}</Badge>
                </div>

                <p className="text-slate-600">{viewing.description}</p>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {(viewing.date_debut || viewing.date_fin) && (
                    <div className="col-span-2">
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Période
                      </p>
                      <p className="text-slate-700">
                        {viewing.date_debut ? new Date(viewing.date_debut).toLocaleDateString('fr-FR') : '?'}
                        {' → '}
                        {viewing.date_fin ? new Date(viewing.date_fin).toLocaleDateString('fr-FR') : '?'}
                      </p>
                    </div>
                  )}
                  {viewing.date_evenement && (
                    <div>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                      </p>
                      <p className="text-slate-700">{new Date(viewing.date_evenement).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {viewing.lieu && (
                    <div>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Lieu
                      </p>
                      <p className="text-slate-700">{viewing.lieu}</p>
                    </div>
                  )}
                </dl>

                {viewing.objectifs && viewing.objectifs.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Objectifs</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {viewing.objectifs.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}

                {viewing.activites_cles && viewing.activites_cles.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Activités clés</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {viewing.activites_cles.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}

                {viewing.resultats && viewing.resultats.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Résultats</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {viewing.resultats.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {canWrite && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewing(null);
                      openEdit(viewing);
                    }}
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Créer une action' : "Modifier l'action"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={async (e) => {
                  const raw = e.target.files?.[0] || null;
                  const imageFile = raw ? await compressImage(raw) : null;
                  setForm((f) => ({ ...f, imageFile }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Commission</Label>
                <Select value={form.section} onValueChange={(v) => setForm((f) => ({ ...f, section: v as SectionAction }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SECTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm((f) => ({ ...f, statut: v as StatutAction }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date-debut">Date de début (optionnel)</Label>
                <Input id="date-debut" type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date-fin">Date de fin (optionnel)</Label>
                <Input id="date-fin" type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date-evenement">Date ponctuelle (optionnel)</Label>
                <Input id="date-evenement" type="date" value={form.dateEvenement} onChange={(e) => setForm((f) => ({ ...f, dateEvenement: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lieu">Lieu</Label>
                <Input id="lieu" value={form.lieu} onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="objectifs">Objectifs <span className="text-slate-400 font-normal">(un par ligne)</span></Label>
              <Textarea id="objectifs" rows={3} value={form.objectifs} onChange={(e) => setForm((f) => ({ ...f, objectifs: e.target.value }))} placeholder={'Renforcer l\'insertion des jeunes\nFavoriser l\'entraide communautaire'} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activites">Activités clés <span className="text-slate-400 font-normal">(une par ligne)</span></Label>
              <Textarea id="activites" rows={3} value={form.activitesCles} onChange={(e) => setForm((f) => ({ ...f, activitesCles: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resultats">Résultats <span className="text-slate-400 font-normal">(un par ligne)</span></Label>
              <Textarea id="resultats" rows={3} value={form.resultats} onChange={(e) => setForm((f) => ({ ...f, resultats: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={saving} onClick={save} className="bg-brand-green-600 hover:bg-brand-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing === 'new' ? 'Créer' : 'Enregistrer'}
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
