import React, { useEffect, useState } from 'react';
import { Loader2, BookUser, ChevronLeft, ChevronRight, Search, Download, X, Phone, Mail, MapPin, BadgeCheck } from 'lucide-react';
import { api, ApiError, downloadFile } from '../../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { VilleSelect } from '../../components/VilleSelect';
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
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import type { Ressortissant, StatutRessortissant } from '../types';

interface Meta {
  total: number;
  current_page: number;
  last_page: number;
}

const STATUT_LABEL: Record<StatutRessortissant, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
};

const STATUT_COULEUR: Record<StatutRessortissant, string> = {
  actif: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  inactif: 'bg-slate-100 text-slate-600 border-slate-200',
  suspendu: 'bg-brand-red-50 text-brand-red-700 border-brand-red-200',
};

export function AdminRegistre() {
  const [ressortissants, setRessortissants] = useState<Ressortissant[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);

  const [statut, setStatut] = useState<string>('tous');
  const [ville, setVille] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [rechercheDebounced, setRechercheDebounced] = useState('');

  const [viewing, setViewing] = useState<Ressortissant | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRechercheDebounced(recherche), 400);
    return () => clearTimeout(t);
  }, [recherche]);

  useEffect(() => {
    setPage(1);
  }, [statut, ville, rechercheDebounced]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statut, ville, rechercheDebounced]);

  async function load() {
    setRessortissants(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (statut !== 'tous') params.set('statut', statut);
      if (ville) params.set('ville', ville);
      if (rechercheDebounced) params.set('recherche', rechercheDebounced);

      const res = await api.get<{ items: Ressortissant[]; meta: Meta }>(
        `/v1/admin/ressortissants?${params.toString()}`
      );
      setRessortissants(res.items);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger le registre.');
    }
  }

  async function ouvrirDetail(id: number) {
    setLoadingDetail(true);
    try {
      const r = await api.get<Ressortissant>(`/v1/admin/ressortissants/${id}`);
      setViewing(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger la fiche.');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function exporter() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statut !== 'tous') params.set('statut', statut);
      await downloadFile(`/v1/admin/ressortissants/export?${params.toString()}`, 'registre-consulaire.csv');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'exporter le registre.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookUser className="w-6 h-6 text-slate-400" /> Registre consulaire
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ressortissants inscrits{meta ? ` — ${meta.total} au total` : ''}.
          </p>
        </div>
        <Button variant="outline" onClick={exporter} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Exporter (CSV)
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Nom, prénom, n° registre, email..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-[220px]">
          <VilleSelect value={ville} onChange={setVille} placeholder="Toutes les villes" allowClear clearLabel="Toutes les villes" />
        </div>
      </div>

      {ressortissants === null ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : ressortissants.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
          Aucun ressortissant ne correspond à ces critères.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° registre</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Ville / Quartier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ressortissants.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => ouvrirDetail(r.id)}
                >
                  <TableCell className="font-mono text-xs text-slate-500">{r.numero_registre || '—'}</TableCell>
                  <TableCell className="font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      {r.nom_complet}
                      {r.inscription_verifiee && <BadgeCheck className="w-4 h-4 text-brand-green-600" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {r.ville || '—'}{r.quartier ? ` · ${r.quartier}` : ''}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{r.telephone || r.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_COULEUR[r.statut]}>
                      {STATUT_LABEL[r.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-400 text-sm">{r.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">
            Page {meta.current_page} / {meta.last_page}
          </span>
          <Button variant="outline" size="icon" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Dialog open={!!viewing || loadingDetail} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fiche ressortissant</DialogTitle>
          </DialogHeader>
          {loadingDetail || !viewing ? (
            <div className="flex justify-center py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-slate-900">{viewing.nom_complet}</div>
                  <div className="text-xs text-slate-400 font-mono">{viewing.numero_registre || 'Sans numéro'}</div>
                </div>
                <Badge variant="outline" className={STATUT_COULEUR[viewing.statut]}>
                  {STATUT_LABEL[viewing.statut]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {viewing.telephone && (
                  <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {viewing.telephone}</div>
                )}
                {viewing.email && (
                  <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {viewing.email}</div>
                )}
                {(viewing.ville || viewing.quartier) && (
                  <div className="flex items-center gap-2 text-slate-600 col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> {viewing.ville}{viewing.quartier ? ` · ${viewing.quartier}` : ''}{viewing.adresse ? ` — ${viewing.adresse}` : ''}
                  </div>
                )}
                {viewing.nationalite && <div className="text-slate-500">Nationalité : <span className="text-slate-800">{viewing.nationalite}</span></div>}
                {viewing.date_naissance && <div className="text-slate-500">Né(e) le : <span className="text-slate-800">{viewing.date_naissance}</span></div>}
                {viewing.type_piece && (
                  <div className="text-slate-500 col-span-2">
                    Pièce : <span className="text-slate-800">{viewing.type_piece} {viewing.numero_piece}</span>
                  </div>
                )}
              </div>

              {viewing.motif_inactivation && (
                <p className="text-xs text-brand-red-600 bg-brand-red-50 rounded-lg px-3 py-2">
                  Motif : {viewing.motif_inactivation}
                </p>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Demandes</h4>
                {!viewing.demandes || viewing.demandes.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune demande déposée.</p>
                ) : (
                  <div className="space-y-2">
                    {viewing.demandes.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <div>
                          <div className="font-medium text-slate-800">{d.type.replace('_', ' ')}</div>
                          <div className="text-xs text-slate-400 font-mono">{d.numero_dossier}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-600">{d.statut_label}</div>
                          <div className="text-xs text-slate-400">{d.date_depot}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
