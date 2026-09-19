import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Eye, Mail, Phone, MapPin, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../components/Navbar';
import { useLightbox } from '../../components/ImageLightbox';
import type { Partenaire, StatutPartenaire, TypePartenaire, NiveauPartenariat } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
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

const TYPE_LABELS: Record<TypePartenaire, string> = {
  institution: 'Institution',
  ong: 'ONG',
  entreprise: 'Entreprise',
  media: 'Média',
  universite: 'Université/École',
  association: 'Association',
};

const NIVEAU_LABELS: Record<NiveauPartenariat, string> = {
  or: 'Or',
  argent: 'Argent',
  bronze: 'Bronze',
  institutionnel: 'Institutionnel',
  technique: 'Technique',
};

const NIVEAU_BADGE: Record<NiveauPartenariat, string> = {
  or: 'bg-brand-gold-50 text-brand-gold-500 border-brand-gold-200',
  argent: 'bg-slate-100 text-slate-500 border-slate-200',
  bronze: 'bg-orange-50 text-orange-600 border-orange-200',
  institutionnel: 'bg-brand-green-50 text-brand-green-600 border-brand-green-200',
  technique: 'bg-blue-50 text-blue-600 border-blue-200',
};

const NONE = '__aucun__';
type FilterTab = 'tous' | StatutPartenaire;

interface FormState {
  nom: string;
  description: string;
  siteWeb: string;
  type: string;
  secteurActivite: string;
  pays: string;
  ville: string;
  email: string;
  telephone: string;
  niveauPartenariat: string;
  statut: StatutPartenaire;
  logoFile: File | null;
}

function emptyForm(): FormState {
  return {
    nom: '', description: '', siteWeb: '', type: NONE, secteurActivite: '',
    pays: '', ville: '', email: '', telephone: '', niveauPartenariat: NONE,
    statut: 'actif', logoFile: null,
  };
}

export function AdminPartenaires() {
  const { hasRole } = useAuth();
  const { openImage } = useLightbox();
  const canWrite = hasRole('super_admin', 'admin');
  const canDelete = hasRole('super_admin');

  const [partenaires, setPartenaires] = useState<Partenaire[] | null>(null);
  const [filter, setFilter] = useState<FilterTab>('tous');
  const [editing, setEditing] = useState<Partenaire | 'new' | null>(null);
  const [viewing, setViewing] = useState<Partenaire | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'nom' | 'type' | 'statut'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  async function load() {
    try {
      // La route publique ne renvoie que les actifs par défaut : deux appels
      // (actif + inactif) pour afficher tous les partenaires côté admin.
      const [actifs, inactifs] = await Promise.all([
        api.get<Partenaire[]>('/v1/partenaires?statut=actif'),
        api.get<Partenaire[]>('/v1/partenaires?statut=inactif'),
      ]);
      setPartenaires([...actifs, ...inactifs].sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch {
      toast.error('Impossible de charger les partenaires.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: 'nom' | 'type' | 'statut') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    if (!partenaires) return [];
    let list = filter === 'tous' ? partenaires : partenaires.filter((p) => p.statut === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          (p.secteur_activite || '').toLowerCase().includes(q) ||
          (p.ville || '').toLowerCase().includes(q) ||
          (p.pays || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nom') cmp = a.nom.localeCompare(b.nom);
      else if (sortKey === 'type') cmp = (a.type || '').localeCompare(b.type || '');
      else cmp = a.statut.localeCompare(b.statut);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [partenaires, filter, search, sortKey, sortDir]);

  function openCreate() {
    setForm(emptyForm());
    setEditing('new');
  }

  function openEdit(p: Partenaire) {
    setForm({
      nom: p.nom,
      description: p.description || '',
      siteWeb: p.site_web || '',
      type: p.type || NONE,
      secteurActivite: p.secteur_activite || '',
      pays: p.pays || '',
      ville: p.ville || '',
      email: p.email || '',
      telephone: p.telephone || '',
      niveauPartenariat: p.niveau_partenariat || NONE,
      statut: p.statut,
      logoFile: null,
    });
    setEditing(p);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('nom', form.nom);
    if (form.description) fd.append('description', form.description);
    if (form.siteWeb) fd.append('site_web', form.siteWeb);
    if (form.type !== NONE) fd.append('type', form.type);
    if (form.secteurActivite) fd.append('secteur_activite', form.secteurActivite);
    if (form.pays) fd.append('pays', form.pays);
    if (form.ville) fd.append('ville', form.ville);
    if (form.email) fd.append('email', form.email);
    if (form.telephone) fd.append('telephone', form.telephone);
    if (form.niveauPartenariat !== NONE) fd.append('niveau_partenariat', form.niveauPartenariat);
    fd.append('statut', form.statut);
    if (form.logoFile) fd.append('logo', form.logoFile);
    return fd;
  }

  async function save() {
    if (!form.nom.trim()) {
      toast.error('Le nom est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      if (editing === 'new') {
        const created = await api.postForm<Partenaire>('/v1/partenaires', fd, 'POST');
        setPartenaires((prev) => (prev ? [created, ...prev] : [created]));
        toast.success('Partenaire ajouté avec succès.');
      } else if (editing) {
        const updated = await api.postForm<Partenaire>(`/v1/partenaires/${editing.id}`, fd, 'PUT');
        setPartenaires((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
        toast.success('Partenaire mis à jour.');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Partenaire) {
    if (!confirm(`Supprimer définitivement « ${p.nom} » ?`)) return;
    try {
      await api.delete(`/v1/partenaires/${p.id}`);
      setPartenaires((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
      toast.success('Partenaire supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Partenaires</h1>
          <p className="text-slate-500 text-sm mt-0.5">Institutions, ONG et entreprises partenaires.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4" /> Ajouter un partenaire
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="actif">Actifs</TabsTrigger>
            <TabsTrigger value="inactif">Inactifs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un partenaire…"
            className="pl-9"
          />
        </div>
      </div>

      {partenaires === null ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-brand-green-100">
          Aucun partenaire dans cette catégorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Partenaire" active={sortKey === 'nom'} dir={sortDir} onClick={() => toggleSort('nom')} />
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortableHeader label="Type" active={sortKey === 'type'} dir={sortDir} onClick={() => toggleSort('type')} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">Niveau</TableHead>
                <TableHead>
                  <SortableHeader label="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setViewing(p)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-md">
                        {p.logo_url && <AvatarImage src={p.logo_url} alt={p.nom} />}
                        <AvatarFallback className="text-xs rounded-md bg-brand-green-50 text-brand-green-700">
                          {p.nom.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-slate-900">{p.nom}</span>
                        {p.site_web && (
                          <a
                            href={p.site_web}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-green-600"
                          >
                            {p.site_web.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">
                    {p.type ? TYPE_LABELS[p.type] : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.niveau_partenariat ? (
                      <Badge variant="outline" className={NIVEAU_BADGE[p.niveau_partenariat]}>
                        {NIVEAU_LABELS[p.niveau_partenariat]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        p.statut === 'actif'
                          ? 'bg-brand-green-50 text-brand-green-600 border-brand-green-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }
                    >
                      {p.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(p)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-brand-red-600 hover:text-brand-red-700"
                          onClick={() => remove(p)}
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
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center text-center gap-3 pt-2">
                  <Avatar
                    className={cn('w-20 h-20 rounded-xl', viewing.logo_url && 'cursor-zoom-in')}
                    onClick={() => viewing.logo_url && openImage(viewing.logo_url, viewing.nom, true)}
                  >
                    {viewing.logo_url && <AvatarImage src={viewing.logo_url} alt={viewing.nom} />}
                    <AvatarFallback className="text-xl rounded-xl bg-brand-green-50 text-brand-green-700">
                      {viewing.nom.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg">{viewing.nom}</DialogTitle>
                    {viewing.type && <p className="text-sm text-slate-500 mt-0.5">{TYPE_LABELS[viewing.type]}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        viewing.statut === 'actif'
                          ? 'bg-brand-green-50 text-brand-green-600 border-brand-green-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }
                    >
                      {viewing.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                    {viewing.niveau_partenariat && (
                      <Badge variant="outline" className={NIVEAU_BADGE[viewing.niveau_partenariat]}>
                        {NIVEAU_LABELS[viewing.niveau_partenariat]}
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {viewing.description && <p className="text-slate-600 text-center">{viewing.description}</p>}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {viewing.secteur_activite && (
                    <div>
                      <p className="text-slate-400 text-xs">Secteur</p>
                      <p className="text-slate-700">{viewing.secteur_activite}</p>
                    </div>
                  )}
                  {(viewing.ville || viewing.pays) && (
                    <div>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Localisation
                      </p>
                      <p className="text-slate-700">{[viewing.ville, viewing.pays].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                </dl>

                {(viewing.email || viewing.telephone || viewing.site_web) && (
                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {viewing.site_web && (
                      <a
                        href={viewing.site_web}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Site web
                      </a>
                    )}
                    {viewing.email && (
                      <a
                        href={`mailto:${viewing.email}`}
                        className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600"
                      >
                        <Mail className="w-3.5 h-3.5" /> {viewing.email}
                      </a>
                    )}
                    {viewing.telephone && (
                      <span className="flex items-center gap-1.5 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5" /> {viewing.telephone}
                      </span>
                    )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Ajouter un partenaire' : 'Modifier le partenaire'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" type="file" accept="image/jpeg,image/png,image/jpg,image/svg+xml" onChange={(e) => setForm((f) => ({ ...f, logoFile: e.target.files?.[0] || null }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="site-web">Site web</Label>
              <Input id="site-web" value={form.siteWeb} onChange={(e) => setForm((f) => ({ ...f, siteWeb: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Non défini</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Niveau de partenariat</Label>
                <Select value={form.niveauPartenariat} onValueChange={(v) => setForm((f) => ({ ...f, niveauPartenariat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Non défini</SelectItem>
                    {Object.entries(NIVEAU_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secteur">Secteur d'activité</Label>
              <Input id="secteur" value={form.secteurActivite} onChange={(e) => setForm((f) => ({ ...f, secteurActivite: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pays">Pays</Label>
                <Input id="pays" value={form.pays} onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm((f) => ({ ...f, statut: v as StatutPartenaire }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
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
