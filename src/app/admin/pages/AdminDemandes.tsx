import React, { useEffect, useState } from 'react';
import {
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Check,
  X as XIcon,
  ArrowRight,
  Ban,
  Banknote,
} from 'lucide-react';
import { api, ApiError, openFile } from '../../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import { toast } from 'sonner';
import type { Demande, StatutDemande, DemandeDocumentAdmin, ModeGuichet } from '../types';

interface Meta {
  total: number;
  current_page: number;
  last_page: number;
}

const TYPES: Record<string, string> = {
  carte_consulaire: 'Carte consulaire',
  laissez_passer: 'Laissez-passer',
};

const STATUT_COULEUR: Record<StatutDemande, string> = {
  recu: 'bg-slate-100 text-slate-600 border-slate-200',
  en_traitement: 'bg-brand-gold-50 text-brand-gold-700 border-brand-gold-200',
  pret: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  retire: 'bg-slate-100 text-slate-500 border-slate-200',
  rejete: 'bg-brand-red-50 text-brand-red-700 border-brand-red-200',
};

const PAIEMENT_COULEUR: Record<string, string> = {
  en_attente: 'bg-slate-100 text-slate-600 border-slate-200',
  partiel: 'bg-brand-gold-50 text-brand-gold-700 border-brand-gold-200',
  paye: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
};

// Prochain statut de la progression normale recu -> en_traitement -> pret ->
// retire, pour chaque statut courant. Le rejet est toujours proposé à part
// (accessible depuis n'importe quel statut non terminal), voir PROGRESSION
// côté backend (Demande::PROGRESSION).
const PROCHAIN_STATUT: Partial<Record<StatutDemande, { statut: StatutDemande; label: string }>> = {
  recu: { statut: 'en_traitement', label: 'Passer en traitement' },
  en_traitement: { statut: 'pret', label: 'Marquer le dossier prêt' },
  pret: { statut: 'retire', label: 'Marquer comme retiré' },
};

const DOC_STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  valide: 'Validé',
  rejete: 'Rejeté',
};

const DOC_STATUT_COULEUR: Record<string, string> = {
  en_attente: 'bg-slate-100 text-slate-600 border-slate-200',
  valide: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  rejete: 'bg-brand-red-50 text-brand-red-700 border-brand-red-200',
};

const MODE_GUICHET_LABEL: Record<ModeGuichet, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement',
  carte: 'Carte bancaire',
};

export function AdminDemandes() {
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);

  const [statut, setStatut] = useState<string>('tous');
  const [type, setType] = useState<string>('tous');
  const [paiementStatut, setPaiementStatut] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [rechercheDebounced, setRechercheDebounced] = useState('');

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Demande | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRechercheDebounced(recherche), 400);
    return () => clearTimeout(t);
  }, [recherche]);

  useEffect(() => {
    setPage(1);
  }, [statut, type, paiementStatut, rechercheDebounced]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statut, type, paiementStatut, rechercheDebounced]);

  async function load() {
    setDemandes(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (statut !== 'tous') params.set('statut', statut);
      if (type !== 'tous') params.set('type', type);
      if (paiementStatut !== 'tous') params.set('paiement_statut', paiementStatut);
      if (rechercheDebounced) params.set('recherche', rechercheDebounced);

      const res = await api.get<{ items: Demande[]; meta: Meta }>(
        `/v1/admin/demandes?${params.toString()}`
      );
      setDemandes(res.items);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les demandes.');
    }
  }

  async function ouvrirDetail(id: number) {
    setViewingId(id);
    setLoadingDetail(true);
    try {
      const d = await api.get<Demande>(`/v1/admin/demandes/${id}`);
      setViewing(d);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger le dossier.');
      setViewingId(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Après toute action (statut, vérification de pièce) : on recharge la
  // fiche détaillée ET la liste, plutôt que de retoucher l'état à la main —
  // documents_complets, paiement_statut, etc. sont recalculés côté serveur
  // et on ne veut jamais désynchroniser l'affichage de la réalité du dossier.
  async function rafraichir() {
    if (viewingId) await ouvrirDetail(viewingId);
    load();
  }

  function fermerPanneau() {
    setViewingId(null);
    setViewing(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-slate-400" /> Demandes
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Dossiers déposés par les ressortissants{meta ? ` — ${meta.total} au total` : ''}.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="N° dossier, nom, n° registre..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous statuts</SelectItem>
            <SelectItem value="recu">Reçu</SelectItem>
            <SelectItem value="en_traitement">En traitement</SelectItem>
            <SelectItem value="pret">Prêt</SelectItem>
            <SelectItem value="retire">Retiré</SelectItem>
            <SelectItem value="rejete">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous types</SelectItem>
            {Object.entries(TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paiementStatut} onValueChange={setPaiementStatut}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tout paiement</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="partiel">Partiel</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {demandes === null ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : demandes.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
          Aucune demande ne correspond à ces critères.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° dossier</TableHead>
                <TableHead>Ressortissant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead className="text-right">Déposé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.map((d) => (
                <TableRow
                  key={d.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => ouvrirDetail(d.id)}
                >
                  <TableCell className="font-mono text-xs text-slate-500">{d.numero_dossier}</TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {d.ressortissant?.nom_complet ?? '—'}
                    {d.ressortissant?.numero_registre && (
                      <div className="text-xs text-slate-400 font-mono font-normal">{d.ressortissant.numero_registre}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{TYPES[d.type] ?? d.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_COULEUR[d.statut]}>{d.statut_label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PAIEMENT_COULEUR[d.paiement_statut]}>
                      {d.montant.toLocaleString('fr-FR')} {d.devise}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-400 text-sm">{d.date_depot ?? '—'}</TableCell>
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

      <Sheet open={!!viewingId} onOpenChange={(open) => !open && fermerPanneau()}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {viewing ? (
                <>
                  <span className="font-mono">{viewing.numero_dossier}</span>
                  <Badge variant="outline" className={STATUT_COULEUR[viewing.statut]}>{viewing.statut_label}</Badge>
                </>
              ) : (
                'Dossier'
              )}
            </SheetTitle>
          </SheetHeader>

          {loadingDetail || !viewing ? (
            <div className="flex justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DetailDossier demande={viewing} onChanged={rafraichir} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailDossier({ demande, onChanged }: { demande: Demande; onChanged: () => void }) {
  const [note, setNote] = useState('');
  const [rejetDossierOuvert, setRejetDossierOuvert] = useState(false);
  const [motifRejetDossier, setMotifRejetDossier] = useState('');
  const [enCours, setEnCours] = useState(false);

  const [docEnRejet, setDocEnRejet] = useState<number | null>(null);
  const [motifRejetDoc, setMotifRejetDoc] = useState('');
  const [docEnCours, setDocEnCours] = useState<number | null>(null);

  const [formGuichetOuvert, setFormGuichetOuvert] = useState(false);
  const [mode, setMode] = useState<ModeGuichet | ''>('');
  const [numeroRecu, setNumeroRecu] = useState('');
  const [nomPayeur, setNomPayeur] = useState('');
  const [telephonePayeur, setTelephonePayeur] = useState('');
  const [encaissementEnCours, setEncaissementEnCours] = useState(false);

  const clos = demande.statut === 'retire' || demande.statut === 'rejete';
  const prochain = PROCHAIN_STATUT[demande.statut];

  async function encaisser() {
    setEncaissementEnCours(true);
    try {
      await api.post(`/v1/admin/demandes/${demande.id}/paiement-guichet`, {
        mode,
        numero_recu: numeroRecu,
        nom_payeur: nomPayeur || undefined,
        telephone_payeur: telephonePayeur || undefined,
      });
      toast.success('Paiement enregistré.');
      setFormGuichetOuvert(false);
      setMode('');
      setNumeroRecu('');
      setNomPayeur('');
      setTelephonePayeur('');
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'enregistrer le paiement.");
    } finally {
      setEncaissementEnCours(false);
    }
  }

  async function changerStatut(statut: StatutDemande, motifRejet?: string) {
    setEnCours(true);
    try {
      await api.patch(`/v1/admin/demandes/${demande.id}/statut`, {
        statut,
        motif_rejet: motifRejet,
        note_interne: note || undefined,
      });
      toast.success('Statut mis à jour.');
      setNote('');
      setRejetDossierOuvert(false);
      setMotifRejetDossier('');
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de mettre à jour le statut.');
    } finally {
      setEnCours(false);
    }
  }

  async function verifierDocument(doc: DemandeDocumentAdmin, statut: 'valide' | 'rejete', motifRejet?: string) {
    setDocEnCours(doc.id);
    try {
      await api.patch(`/v1/admin/demandes/documents/${doc.id}`, { statut, motif_rejet: motifRejet });
      toast.success(statut === 'valide' ? 'Pièce validée.' : 'Pièce rejetée.');
      setDocEnRejet(null);
      setMotifRejetDoc('');
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de mettre à jour la pièce.');
    } finally {
      setDocEnCours(null);
    }
  }

  async function voirFichier(doc: DemandeDocumentAdmin) {
    try {
      await openFile(doc.fichier_url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'ouvrir la pièce.");
    }
  }

  return (
    <div className="space-y-6 mt-2">
      {/* Ressortissant */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <div className="font-bold text-slate-900">{demande.ressortissant?.nom_complet ?? '—'}</div>
        <div className="text-xs text-slate-500 font-mono">{demande.ressortissant?.numero_registre ?? 'Sans numéro'}</div>
        {(demande.ressortissant?.ville || demande.ressortissant?.quartier) && (
          <div className="text-sm text-slate-500 mt-1">
            {demande.ressortissant?.ville}{demande.ressortissant?.quartier ? ` · ${demande.ressortissant.quartier}` : ''}
          </div>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-slate-500">Type : <span className="text-slate-800 font-medium">{TYPES[demande.type] ?? demande.type}</span></div>
        <div className="text-slate-500">Délai : <span className="text-slate-800 font-medium">{demande.delai_label}</span></div>
        <div className="text-slate-500">Montant : <span className="text-slate-800 font-medium">{demande.montant.toLocaleString('fr-FR')} {demande.devise}</span></div>
        <div className="text-slate-500 flex items-center gap-1.5">
          Paiement :
          <Badge variant="outline" className={PAIEMENT_COULEUR[demande.paiement_statut]}>
            {demande.paiement_statut === 'paye' ? 'Payé' : demande.paiement_statut === 'partiel' ? 'Partiel' : 'En attente'}
          </Badge>
        </div>
        {demande.date_depot && <div className="text-slate-500">Déposé le : <span className="text-slate-800">{demande.date_depot}</span></div>}
        {demande.date_disponibilite_prevue && (
          <div className="text-slate-500">Prévu le : <span className="text-slate-800">{demande.date_disponibilite_prevue}</span></div>
        )}
      </div>

      {demande.motif_rejet && (
        <p className="text-sm text-brand-red-700 bg-brand-red-50 rounded-lg px-3 py-2">
          Motif du rejet : {demande.motif_rejet}
        </p>
      )}

      {/* Paiement */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-2">Paiement</h4>

        {(demande.paiements ?? []).length > 0 && (
          <div className="space-y-1.5 mb-2">
            {(demande.paiements ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-slate-600">
                  {p.canal_label}{p.mode_label ? ` · ${p.mode_label}` : ''}
                  {p.numero_recu && <span className="font-mono text-slate-400"> · {p.numero_recu}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-800 font-medium">{p.montant.toLocaleString('fr-FR')} {p.devise}</span>
                  <Badge variant="outline" className={p.statut === 'reussi' ? 'bg-brand-green-50 text-brand-green-700 border-brand-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                    {p.statut === 'reussi' ? 'Réussi' : p.statut}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {demande.paiement_statut !== 'paye' && !clos && (
          !formGuichetOuvert ? (
            <Button variant="outline" size="sm" onClick={() => setFormGuichetOuvert(true)}>
              <Banknote className="w-3.5 h-3.5 mr-1.5" /> Encaisser au guichet
            </Button>
          ) : (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Select value={mode} onValueChange={(v) => setMode(v as ModeGuichet)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Mode de paiement" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_GUICHET_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="N° de reçu"
                  value={numeroRecu}
                  onChange={(e) => setNumeroRecu(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Nom du payeur (optionnel)"
                  value={nomPayeur}
                  onChange={(e) => setNomPayeur(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Téléphone (optionnel)"
                  value={telephonePayeur}
                  onChange={(e) => setTelephonePayeur(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <p className="text-xs text-slate-400">
                Montant encaissé : {demande.montant.toLocaleString('fr-FR')} {demande.devise} (forfait {demande.delai_label.toLowerCase()})
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-brand-green-600 hover:bg-brand-green-700"
                  disabled={!mode || !numeroRecu.trim() || encaissementEnCours}
                  onClick={encaisser}
                >
                  {encaissementEnCours ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Confirmer l'encaissement
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormGuichetOuvert(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Pièces */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-2">
          Pièces {demande.documents_complets ? (
            <span className="text-brand-green-600 font-normal">— dossier complet</span>
          ) : (
            <span className="text-brand-gold-600 font-normal">— incomplet</span>
          )}
        </h4>
        <div className="space-y-2">
          {(demande.documents ?? []).map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-100 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{doc.label}</div>
                  <div className="text-xs text-slate-400 truncate">{doc.nom_original ?? '—'}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className={DOC_STATUT_COULEUR[doc.statut]}>{DOC_STATUT_LABEL[doc.statut]}</Badge>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => voirFichier(doc)} title="Voir la pièce">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {doc.statut === 'en_attente' && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-brand-green-600 hover:bg-brand-green-700"
                    disabled={docEnCours === doc.id}
                    onClick={() => verifierDocument(doc, 'valide')}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Valider
                  </Button>
                  {docEnRejet === doc.id ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      disabled={!motifRejetDoc.trim() || docEnCours === doc.id}
                      onClick={() => verifierDocument(doc, 'rejete', motifRejetDoc)}
                    >
                      Confirmer le rejet
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-brand-red-600 border-brand-red-200 hover:bg-brand-red-50"
                      onClick={() => setDocEnRejet(doc.id)}
                    >
                      <XIcon className="w-3.5 h-3.5 mr-1" /> Rejeter
                    </Button>
                  )}
                </div>
              )}

              {docEnRejet === doc.id && (
                <div className="mt-2 flex items-start gap-2">
                  <Textarea
                    placeholder="Motif du rejet (visible par le ressortissant)"
                    value={motifRejetDoc}
                    onChange={(e) => setMotifRejetDoc(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setDocEnRejet(null); setMotifRejetDoc(''); }}>
                    <XIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {doc.statut === 'rejete' && doc.motif_rejet && (
                <p className="text-xs text-brand-red-600 mt-1.5">Motif : {doc.motif_rejet}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions statut */}
      {!clos && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <Textarea
            placeholder="Note interne (optionnelle, visible admin/agent uniquement)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            {prochain && (
              <Button
                disabled={enCours || (prochain.statut === 'pret' && (!demande.documents_complets || demande.paiement_statut !== 'paye'))}
                onClick={() => changerStatut(prochain.statut)}
                className="bg-brand-green-600 hover:bg-brand-green-700"
              >
                {enCours ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {prochain.label}
              </Button>
            )}

            {!rejetDossierOuvert ? (
              <Button variant="outline" className="text-brand-red-600 border-brand-red-200 hover:bg-brand-red-50" onClick={() => setRejetDossierOuvert(true)}>
                <Ban className="w-4 h-4 mr-2" /> Rejeter le dossier
              </Button>
            ) : null}
          </div>

          {prochain?.statut === 'pret' && (!demande.documents_complets || demande.paiement_statut !== 'paye') && (
            <p className="text-xs text-slate-400">
              {!demande.documents_complets && 'Toutes les pièces doivent être validées. '}
              {demande.paiement_statut !== 'paye' && 'Le paiement doit être complet.'}
            </p>
          )}

          {rejetDossierOuvert && (
            <div className="flex items-start gap-2">
              <Textarea
                placeholder="Motif du rejet du dossier (visible par le ressortissant)"
                value={motifRejetDossier}
                onChange={(e) => setMotifRejetDossier(e.target.value)}
                className="text-sm"
              />
              <Button
                variant="destructive"
                disabled={!motifRejetDossier.trim() || enCours}
                onClick={() => changerStatut('rejete', motifRejetDossier)}
              >
                Confirmer
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setRejetDossierOuvert(false); setMotifRejetDossier(''); }}>
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {demande.traite_par && (
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">Dernier traitement par {demande.traite_par}</p>
      )}
    </div>
  );
}
