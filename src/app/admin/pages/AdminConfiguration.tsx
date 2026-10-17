import React, { useEffect, useState } from 'react';
import { Loader2, Settings, Plus, Trash2, Pencil, Check, X as XIcon, FileStack, Wallet, ListChecks } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import type { Tarif, DocumentTypeRequis, DelaiDemande, ServiceConsulaire } from '../types';

// Un « type » de demande correspond à un service créé dans l'onglet Services
// (value = code du service, label = son nom).
type TypeOption = { value: string; label: string };

// Du plus rapide au plus long : cet ordre est celui du menu des délais et du
// tableau des tarifs, quel que soit l'ordre de création (doit rester
// identique à Tarif::DELAIS côté API).
const DELAI_LABEL: Record<DelaiDemande, string> = {
  meme_jour: 'Le jour même',
  '24h': '24 heures',
  '3_jours': '3 jours',
  '1_semaine': '1 semaine',
  '2_semaines': '2 semaines',
};

const ORDRE_DELAIS = Object.keys(DELAI_LABEL);

// Tarifs groupés par service (dans l'ordre des services), puis par délai.
function trierTarifs(liste: Tarif[], types: TypeOption[]): Tarif[] {
  const rangType = (code: string) => {
    const i = types.findIndex((t) => t.value === code);
    return i === -1 ? 999 : i;
  };
  const rangDelai = (d: string) => {
    const i = ORDRE_DELAIS.indexOf(d);
    return i === -1 ? 99 : i;
  };
  return [...liste].sort(
    (a, b) => rangType(a.type_demande) - rangType(b.type_demande) || rangDelai(a.delai) - rangDelai(b.delai)
  );
}

export function AdminConfiguration() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('super_admin', 'admin');
  const [services, setServices] = useState<ServiceConsulaire[] | null>(null);

  async function chargerServices() {
    try {
      setServices(await api.get<ServiceConsulaire[]>('/v1/admin/services'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les services.');
      setServices((prev) => prev ?? []);
    }
  }

  useEffect(() => { chargerServices(); }, []);

  if (services === null) {
    return <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const types: TypeOption[] = services.map((s) => ({ value: s.code, label: s.nom }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" /> Configuration des services
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Services proposés, tarifs et pièces à fournir — modifiables ici sans déploiement.
        </p>
      </div>

      <Tabs defaultValue="tarifs">
        <TabsList>
          <TabsTrigger value="tarifs"><Wallet className="w-4 h-4 mr-1.5" /> Tarifs</TabsTrigger>
          <TabsTrigger value="documents"><FileStack className="w-4 h-4 mr-1.5" /> Pièces requises</TabsTrigger>
          <TabsTrigger value="services"><ListChecks className="w-4 h-4 mr-1.5" /> Services</TabsTrigger>
        </TabsList>
        <TabsContent value="tarifs" className="mt-6">
          <OngletTarifs canWrite={canWrite} types={types} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <OngletDocuments canWrite={canWrite} types={types} />
        </TabsContent>
        <TabsContent value="services" className="mt-6">
          <OngletServices canWrite={canWrite} services={services} onChange={chargerServices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================== Onglet Tarifs =====================

function OngletTarifs({ canWrite, types }: { canWrite: boolean; types: TypeOption[] }) {
  const [tarifs, setTarifs] = useState<Tarif[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [montantEdit, setMontantEdit] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ type_demande: types[0]?.value ?? '', delai: '3_jours' as DelaiDemande, montant: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api.get<Tarif[]>('/v1/admin/tarifs');
      setTarifs(trierTarifs(data, types));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les tarifs.');
    }
  }

  function commencerEdition(t: Tarif) {
    setEditingId(t.id);
    setMontantEdit(String(t.montant));
  }

  async function enregistrerMontant(t: Tarif) {
    const montant = Number(montantEdit);
    if (!montant || montant < 0) {
      toast.error('Montant invalide.');
      return;
    }
    try {
      const updated = await api.put<Tarif>(`/v1/admin/tarifs/${t.id}`, { montant });
      setTarifs((prev) => prev?.map((x) => (x.id === t.id ? updated : x)) ?? null);
      setEditingId(null);
      toast.success('Tarif mis à jour.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  async function toggleActif(t: Tarif) {
    try {
      const updated = await api.put<Tarif>(`/v1/admin/tarifs/${t.id}`, { est_actif: !t.est_actif });
      setTarifs((prev) => prev?.map((x) => (x.id === t.id ? updated : x)) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  async function supprimer(t: Tarif) {
    if (!confirm(`Supprimer le tarif ${t.type_demande} / ${DELAI_LABEL[t.delai]} ?`)) return;
    try {
      await api.delete(`/v1/admin/tarifs/${t.id}`);
      setTarifs((prev) => prev?.filter((x) => x.id !== t.id) ?? null);
      toast.success('Tarif supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  async function creer() {
    if (!form.montant || Number(form.montant) < 0) {
      toast.error('Montant invalide.');
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<Tarif>('/v1/admin/tarifs', {
        type_demande: form.type_demande,
        delai: form.delai,
        montant: Number(form.montant),
      });
      setTarifs((prev) => trierTarifs([...(prev ?? []), created], types));
      setCreating(false);
      setForm({ type_demande: types[0]?.value ?? '', delai: '3_jours', montant: '' });
      toast.success('Tarif ajouté.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'ajout.");
    } finally {
      setSaving(false);
    }
  }

  if (tarifs === null) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type de demande</TableHead>
            <TableHead>Délai</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Actif</TableHead>
            {canWrite && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tarifs.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-slate-800">
                {types.find((x) => x.value === t.type_demande)?.label ?? t.type_demande}
              </TableCell>
              <TableCell>{DELAI_LABEL[t.delai]}</TableCell>
              <TableCell>
                {editingId === t.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={montantEdit}
                      onChange={(e) => setMontantEdit(e.target.value)}
                      className="w-28 h-8"
                    />
                    <span className="text-slate-400 text-sm">{t.devise}</span>
                  </div>
                ) : (
                  <span className="font-mono">{t.montant.toLocaleString('fr-FR')} {t.devise}</span>
                )}
              </TableCell>
              <TableCell>
                <Switch checked={t.est_actif} onCheckedChange={() => toggleActif(t)} disabled={!canWrite} />
              </TableCell>
              {canWrite && (
                <TableCell className="text-right">
                  {editingId === t.id ? (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => enregistrerMontant(t)}><Check className="w-4 h-4 text-brand-green-600" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><XIcon className="w-4 h-4 text-slate-400" /></Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => commencerEdition(t)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => supprimer(t)}><Trash2 className="w-4 h-4 text-brand-red-500" /></Button>
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {canWrite && (
        <div className="p-4 border-t border-slate-100">
          {creating ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type_demande} onValueChange={(v) => setForm((f) => ({ ...f, type_demande: v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Délai</Label>
                <Select value={form.delai} onValueChange={(v) => setForm((f) => ({ ...f, delai: v as DelaiDemande }))}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DELAI_LABEL) as DelaiDemande[]).map((d) => <SelectItem key={d} value={d}>{DELAI_LABEL[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Montant (FCFA)</Label>
                <Input type="number" value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} className="w-32" />
              </div>
              <Button onClick={creer} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}</Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>Annuler</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" /> Ajouter un tarif</Button>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== Onglet Documents requis =====================

const EMPTY_DOC_FORM = { type_demande: '', code_document: '', label: '', obligatoire: true };

function OngletDocuments({ canWrite, types }: { canWrite: boolean; types: TypeOption[] }) {
  const [documents, setDocuments] = useState<DocumentTypeRequis[] | null>(null);
  const [typeFiltre, setTypeFiltre] = useState(types[0]?.value ?? '');
  const [editing, setEditing] = useState<DocumentTypeRequis | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_DOC_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api.get<DocumentTypeRequis[]>('/v1/admin/document-types-requis');
      setDocuments(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les pièces requises.');
    }
  }

  function ouvrirCreation() {
    setForm({ ...EMPTY_DOC_FORM, type_demande: typeFiltre });
    setEditing('new');
  }

  function ouvrirEdition(d: DocumentTypeRequis) {
    setForm({ type_demande: d.type_demande, code_document: d.code_document, label: d.label, obligatoire: d.obligatoire });
    setEditing(d);
  }

  async function enregistrer() {
    if (!form.label.trim() || !form.code_document.trim()) {
      toast.error('Le libellé et le code sont requis.');
      return;
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        const created = await api.post<DocumentTypeRequis>('/v1/admin/document-types-requis', form);
        setDocuments((prev) => [...(prev ?? []), created]);
        toast.success('Pièce ajoutée.');
      } else if (editing) {
        const updated = await api.put<DocumentTypeRequis>(`/v1/admin/document-types-requis/${editing.id}`, {
          label: form.label,
          obligatoire: form.obligatoire,
        });
        setDocuments((prev) => prev?.map((x) => (x.id === editing.id ? updated : x)) ?? null);
        toast.success('Pièce modifiée.');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function supprimer(d: DocumentTypeRequis) {
    if (!confirm(`Retirer « ${d.label} » des pièces requises ?`)) return;
    try {
      await api.delete(`/v1/admin/document-types-requis/${d.id}`);
      setDocuments((prev) => prev?.filter((x) => x.id !== d.id) ?? null);
      toast.success('Pièce retirée.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  async function toggleActif(d: DocumentTypeRequis) {
    try {
      const updated = await api.put<DocumentTypeRequis>(`/v1/admin/document-types-requis/${d.id}`, { est_actif: !d.est_actif });
      setDocuments((prev) => prev?.map((x) => (x.id === d.id ? updated : x)) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  if (documents === null) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const filtres = documents.filter((d) => d.type_demande === typeFiltre).sort((a, b) => a.ordre - b.ordre);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Select value={typeFiltre} onValueChange={setTypeFiltre}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {canWrite && (
          <Button variant="outline" onClick={ouvrirCreation}><Plus className="w-4 h-4 mr-2" /> Ajouter une pièce</Button>
        )}
      </div>

      {filtres.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
          Aucune pièce configurée pour ce type de demande.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100">
          {filtres.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">{d.label}</div>
                <div className="text-xs text-slate-400 font-mono">{d.code_document}</div>
              </div>
              {d.obligatoire ? (
                <Badge variant="outline" className="bg-brand-gold-50 text-brand-gold-700 border-brand-gold-200">Obligatoire</Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Optionnel</Badge>
              )}
              <Switch checked={d.est_actif} onCheckedChange={() => toggleActif(d)} disabled={!canWrite} />
              {canWrite && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => ouvrirEdition(d)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => supprimer(d)}><Trash2 className="w-4 h-4 text-brand-red-500" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Ajouter une pièce requise' : 'Modifier la pièce'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editing === 'new' && (
              <>
                <div>
                  <Label>Type de demande</Label>
                  <Select value={form.type_demande} onValueChange={(v) => setForm((f) => ({ ...f, type_demande: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Code (identifiant technique, ex: photo_identite)</Label>
                  <Input value={form.code_document} onChange={(e) => setForm((f) => ({ ...f, code_document: e.target.value }))} />
                </div>
              </>
            )}
            <div>
              <Label>Libellé affiché au ressortissant</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.obligatoire} onCheckedChange={(v) => setForm((f) => ({ ...f, obligatoire: v }))} />
              <Label>Pièce obligatoire</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={enregistrer} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ===================== Onglet Services =====================

const EMPTY_SERVICE_FORM = { nom: '', description: '', ordre: '' };

function OngletServices({
  canWrite,
  services,
  onChange,
}: {
  canWrite: boolean;
  services: ServiceConsulaire[];
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<ServiceConsulaire | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);
  const [saving, setSaving] = useState(false);

  function ouvrirCreation() {
    setForm(EMPTY_SERVICE_FORM);
    setEditing('new');
  }

  function ouvrirEdition(s: ServiceConsulaire) {
    setForm({ nom: s.nom, description: s.description ?? '', ordre: String(s.ordre) });
    setEditing(s);
  }

  async function enregistrer() {
    if (!form.nom.trim()) {
      toast.error('Le nom du service est requis.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { nom: form.nom.trim(), description: form.description.trim() || null };
      if (form.ordre !== '') payload.ordre = Number(form.ordre);

      if (editing === 'new') {
        await api.post('/v1/admin/services', payload);
        toast.success('Service ajouté. Ajoutez maintenant ses tarifs et ses pièces requises.');
      } else if (editing) {
        await api.put(`/v1/admin/services/${editing.id}`, payload);
        toast.success('Service mis à jour.');
      }
      setEditing(null);
      await onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActif(s: ServiceConsulaire) {
    try {
      await api.put(`/v1/admin/services/${s.id}`, { est_actif: !s.est_actif });
      await onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    }
  }

  async function supprimer(s: ServiceConsulaire) {
    if (!confirm(`Supprimer le service « ${s.nom} » avec ses ${s.nb_tarifs} tarif(s) et ses ${s.nb_pieces} pièce(s) requise(s) ?`)) return;
    try {
      await api.delete(`/v1/admin/services/${s.id}`);
      toast.success('Service supprimé.');
      await onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-sm text-slate-500">
          Les services actifs s'affichent sur la page publique « Services consulaires », avec leurs tarifs et pièces à fournir.
        </p>
        {canWrite && (
          <Button onClick={ouvrirCreation} className="bg-brand-green-600 hover:bg-brand-green-700 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un service
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Tarifs</TableHead>
              <TableHead>Pièces</TableHead>
              <TableHead>Actif</TableHead>
              {canWrite && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-center text-slate-400 py-8">
                  Aucun service pour l'instant.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium text-slate-800">{s.nom}</div>
                    <div className="text-xs text-slate-400">{s.code}</div>
                    {s.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.description}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.nb_tarifs}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.nb_pieces}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={s.est_actif} disabled={!canWrite} onCheckedChange={() => toggleActif(s)} />
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => ouvrirEdition(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => supprimer(s)}>
                        <Trash2 className="w-4 h-4 text-brand-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Ajouter un service' : 'Modifier le service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-nom">Nom du service</Label>
              <Input id="service-nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Ex. Légalisation de documents" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-description">Description (affichée sur le site)</Label>
              <Textarea id="service-description" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-ordre">Ordre d'affichage (facultatif)</Label>
              <Input id="service-ordre" type="number" min={0} value={form.ordre} onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))} />
            </div>
            {editing === 'new' && (
              <p className="text-xs text-slate-500">
                Une fois le service créé, ajoutez ses tarifs et ses pièces requises dans les onglets « Tarifs » et « Pièces requises ».
              </p>
            )}
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={enregistrer} className="bg-brand-green-600 hover:bg-brand-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing === 'new' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
