import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, UserX, UserCheck, Eye, MessageCircle, Facebook, Instagram, Linkedin, Twitter, Search, ArrowUp, ArrowDown, ArrowUpDown, Link2, Download, KeyRound } from 'lucide-react';
import { api, ApiError, downloadFile } from '../../../lib/api';
import { compressImage } from '../../../lib/compressImage';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../components/Navbar';
import { useLightbox } from '../../components/ImageLightbox';
import type { Membre, StatutMembre } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { VilleSelect } from '../../components/VilleSelect';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

type FilterTab = 'tous' | StatutMembre;

const NONE = '__aucun__';

interface FormState {
  nom: string;
  prenom: string;
  poste: string;
  commission: string;
  whatsapp: string;
  ville: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  photoFile: File | null;
}

const EMPTY_FORM: FormState = {
  nom: '',
  prenom: '',
  poste: NONE,
  commission: NONE,
  whatsapp: '',
  ville: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  twitter: '',
  photoFile: null,
};

export function AdminMembres() {
  const { hasRole } = useAuth();
  const { openImage } = useLightbox();
  const canWrite = hasRole('super_admin', 'admin');
  const canDelete = hasRole('super_admin');
  const canCreerAcces = hasRole('super_admin');
  const [creatingAccesId, setCreatingAccesId] = useState<number | null>(null);

  const [membres, setMembres] = useState<Membre[] | null>(null);
  const [postes, setPostes] = useState<string[]>([]);
  const [commissions, setCommissions] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterTab>('tous');

  const [editing, setEditing] = useState<Membre | 'new' | null>(null);
  const [viewing, setViewing] = useState<Membre | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [m, p, c] = await Promise.all([
        api.get<Membre[]>('/v1/membres-admin/tous'),
        api.get<string[]>('/v1/membres/postes-bureau'),
        api.get<string[]>('/v1/membres/commissions'),
      ]);
      setMembres(m);
      setPostes(p);
      setCommissions(c);
    } catch {
      toast.error('Impossible de charger les membres.');
    }
  }

  const [search, setSearch] = useState('');
  const [villeFilter, setVilleFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'nom' | 'role' | 'statut' | 'ville'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadFile(`/v1/membres-admin/export?statut=${filter}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'exporter les membres.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: 'nom' | 'role' | 'statut' | 'ville') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    if (!membres) return [];
    let list = filter === 'tous' ? membres : membres.filter((m) => m.statut === filter);

    if (villeFilter) {
      list = list.filter((m) => m.ville === villeFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.nom_complet.toLowerCase().includes(q) ||
          (m.poste || '').toLowerCase().includes(q) ||
          (m.commission || '').toLowerCase().includes(q) ||
          (m.whatsapp || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nom') cmp = a.nom_complet.localeCompare(b.nom_complet);
      else if (sortKey === 'role') cmp = a.role.localeCompare(b.role);
      else if (sortKey === 'ville') cmp = (a.ville || '').localeCompare(b.ville || '');
      else cmp = a.statut.localeCompare(b.statut);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [membres, filter, villeFilter, search, sortKey, sortDir]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(m: Membre) {
    setForm({
      nom: m.nom,
      prenom: m.prenom,
      poste: m.poste || NONE,
      commission: m.commission || NONE,
      whatsapp: m.whatsapp || '',
      ville: m.ville || '',
      facebook: m.facebook || '',
      instagram: m.instagram || '',
      linkedin: m.linkedin || '',
      twitter: m.twitter || '',
      photoFile: null,
    });
    setEditing(m);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('nom', form.nom);
    fd.append('prenom', form.prenom);
    if (form.poste !== NONE) fd.append('poste', form.poste);
    if (form.commission !== NONE) fd.append('commission', form.commission);
    if (form.whatsapp) fd.append('whatsapp', form.whatsapp);
    if (form.ville) fd.append('ville', form.ville);
    if (form.facebook) fd.append('facebook', form.facebook);
    if (form.instagram) fd.append('instagram', form.instagram);
    if (form.linkedin) fd.append('linkedin', form.linkedin);
    if (form.twitter) fd.append('twitter', form.twitter);
    if (form.photoFile) fd.append('photo', form.photoFile);
    return fd;
  }

  async function save() {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast.error('Nom et prénom sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      if (editing === 'new') {
        const created = await api.postForm<Membre>('/v1/membres', fd, 'POST');
        setMembres((prev) => (prev ? [created, ...prev] : [created]));
        toast.success('Membre ajouté avec succès.');
      } else if (editing) {
        const updated = await api.postForm<Membre>(`/v1/membres/${editing.id}`, fd, 'PUT');
        setMembres((prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? null);
        toast.success('Membre mis à jour.');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatut(m: Membre) {
    const nouveauStatut: StatutMembre = m.statut === 'actif' ? 'inactif' : 'actif';
    try {
      const updated = await api.put<Membre>(`/v1/membres/${m.id}`, { statut: nouveauStatut });
      setMembres((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      toast.success(
        nouveauStatut === 'actif' ? 'Membre réactivé.' : 'Membre désactivé.'
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action impossible.');
    }
  }

  async function remove(m: Membre) {
    if (!confirm(`Supprimer définitivement ${m.prenom} ${m.nom} ?`)) return;
    try {
      await api.delete(`/v1/membres/${m.id}`);
      setMembres((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
      toast.success('Membre supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  async function creerAccesAdmin(m: Membre) {
    if (!confirm(`Créer un accès administrateur pour ${m.prenom} ${m.nom} (${m.poste}) ? Un email d'activation lui sera envoyé.`)) return;
    setCreatingAccesId(m.id);
    try {
      const res = await api.post<{ email: string; role_label: string }>(`/v1/membres/${m.id}/creer-acces-admin`, {});
      setMembres((prev) => prev?.map((x) => (x.id === m.id ? { ...x, a_compte_admin: true } : x)) ?? null);
      toast.success(`Accès ${res.role_label} créé, email envoyé à ${res.email}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible de créer l'accès admin.");
    } finally {
      setCreatingAccesId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Membres</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registre des ressortissants inscrits.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="bg-brand-green-600 hover:bg-brand-green-700">
            <Plus className="w-4 h-4" /> Ajouter un membre
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="actif">Actifs</TabsTrigger>
            <TabsTrigger value="en_attente_paiement">En attente</TabsTrigger>
            <TabsTrigger value="inactif">Inactifs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre…"
              className="pl-9"
            />
          </div>
          <div className="w-48">
            <VilleSelect value={villeFilter} onChange={setVilleFilter} allowClear clearLabel="Toutes les villes" />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exporter
          </Button>
        </div>
      </div>

      {membres === null ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-brand-green-100">
          Aucun membre dans cette catégorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Membre" active={sortKey === 'nom'} dir={sortDir} onClick={() => toggleSort('nom')} />
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortableHeader label="Rôle" active={sortKey === 'role'} dir={sortDir} onClick={() => toggleSort('role')} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <SortableHeader label="Ville" active={sortKey === 'ville'} dir={sortDir} onClick={() => toggleSort('ville')} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => setViewing(m)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {m.photo_url && <AvatarImage src={m.photo_url} alt={m.nom_complet} />}
                        <AvatarFallback className="text-xs bg-brand-green-50 text-brand-green-700">
                          {m.prenom[0]}
                          {m.nom[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">{m.nom_complet}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">{m.role}</TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600">{m.ville || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.statut === 'actif'
                          ? 'bg-brand-green-50 text-brand-green-600 border-brand-green-200'
                          : m.statut === 'en_attente_paiement'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }
                    >
                      {m.statut === 'actif' ? 'Actif' : m.statut === 'en_attente_paiement' ? 'En attente de paiement' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(m)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canWrite && m.statut !== 'actif' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copier le lien de paiement à envoyer au membre"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/cotisation/${m.id}`);
                            toast.success('Lien de paiement copié.');
                          }}
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                      )}
                      {canCreerAcces && m.peut_avoir_acces_admin && !m.a_compte_admin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Créer un accès admin pour ce membre"
                          disabled={creatingAccesId === m.id}
                          onClick={() => creerAccesAdmin(m)}
                        >
                          {creatingAccesId === m.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <KeyRound className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleStatut(m)}>
                            {m.statut === 'actif' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-brand-red-600 hover:text-brand-red-700"
                          onClick={() => remove(m)}
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
                    className={cn('w-24 h-24', viewing.photo_url && 'cursor-zoom-in')}
                    onClick={() => viewing.photo_url && openImage(viewing.photo_url, viewing.nom_complet, true)}
                  >
                    {viewing.photo_url && <AvatarImage src={viewing.photo_url} alt={viewing.nom_complet} />}
                    <AvatarFallback className="text-2xl bg-brand-green-50 text-brand-green-700">
                      {viewing.prenom[0]}
                      {viewing.nom[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg">{viewing.nom_complet}</DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">{viewing.role}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      viewing.statut === 'actif'
                        ? 'bg-brand-green-50 text-brand-green-600 border-brand-green-200'
                        : viewing.statut === 'en_attente_paiement'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }
                  >
                    {viewing.statut === 'actif' ? 'Actif' : viewing.statut === 'en_attente_paiement' ? 'En attente de paiement' : 'Inactif'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {(viewing.poste || viewing.commission) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewing.poste && (
                      <div>
                        <p className="text-slate-400 text-xs">Poste au bureau</p>
                        <p className="text-slate-700">{viewing.poste}</p>
                      </div>
                    )}
                    {viewing.commission && (
                      <div>
                        <p className="text-slate-400 text-xs">Commission</p>
                        <p className="text-slate-700">{viewing.commission}</p>
                      </div>
                    )}
                  </div>
                )}

                {(viewing.whatsapp || viewing.facebook || viewing.instagram || viewing.linkedin || viewing.twitter) && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">Contact & réseaux</p>
                    <div className="flex flex-wrap gap-2">
                      {viewing.whatsapp && (
                        <a
                          href={`https://wa.me/${viewing.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> {viewing.whatsapp}
                        </a>
                      )}
                      {viewing.facebook && (
                        <a href={viewing.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
                          <Facebook className="w-3.5 h-3.5" /> Facebook
                        </a>
                      )}
                      {viewing.instagram && (
                        <a href={viewing.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
                          <Instagram className="w-3.5 h-3.5" /> Instagram
                        </a>
                      )}
                      {viewing.linkedin && (
                        <a href={viewing.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                      {viewing.twitter && (
                        <a href={viewing.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
                          <Twitter className="w-3.5 h-3.5" /> X / Twitter
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                  Membre depuis le {new Date(viewing.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {canWrite && (
                <DialogFooter>
                  {viewing.statut !== 'actif' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/cotisation/${viewing.id}`);
                        toast.success('Lien de paiement copié.');
                      }}
                    >
                      <Link2 className="w-4 h-4" /> Copier le lien de paiement
                    </Button>
                  )}
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
            <DialogTitle>{editing === 'new' ? 'Ajouter un membre' : 'Modifier le membre'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={async (e) => {
                  const raw = e.target.files?.[0] || null;
                  const photoFile = raw ? await compressImage(raw) : null;
                  setForm((f) => ({ ...f, photoFile }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Poste au bureau</Label>
                <Select
                  value={form.poste}
                  onValueChange={(v) => setForm((f) => ({ ...f, poste: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun</SelectItem>
                    {postes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Commission</Label>
                <Select
                  value={form.commission}
                  onValueChange={(v) => setForm((f) => ({ ...f, commission: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune</SelectItem>
                    {commissions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+229 00 00 00 00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ville</Label>
              <VilleSelect
                value={form.ville || null}
                onChange={(ville) => setForm((f) => ({ ...f, ville: ville || '' }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={form.facebook}
                  onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
                  placeholder="https://facebook.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="https://instagram.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={form.linkedin}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="twitter">X / Twitter</Label>
                <Input
                  id="twitter"
                  value={form.twitter}
                  onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
                  placeholder="https://x.com/…"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={saving}
              onClick={save}
              className="bg-brand-green-600 hover:bg-brand-green-700"
            >
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
