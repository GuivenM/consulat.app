import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, Eye, Send, Search, ArrowUp, ArrowDown, ArrowUpDown, UserPlus, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Message, StatutMessage, ObjetMessage, Partenaire } from '../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

const STATUT_LABELS: Record<StatutMessage, string> = {
  non_lu: 'Non lu',
  lu: 'Lu',
  repondu: 'Répondu',
};

const STATUT_BADGE: Record<StatutMessage, string> = {
  non_lu: 'bg-brand-red-50 text-brand-red-600 border-brand-red-200',
  lu: 'bg-brand-gold-50 text-brand-gold-500 border-brand-gold-200',
  repondu: 'bg-brand-green-50 text-brand-green-600 border-brand-green-200',
};

const OBJET_LABELS: Record<ObjetMessage, string> = {
  question: 'Question',
  partenariat: 'Demande de partenariat',
  service_consulaire: 'Question sur une démarche',
  urgence: 'Urgence communautaire',
  information: "Demande d'information",
  reclamation: 'Réclamation',
  autre: 'Autre',
};

const TYPE_ORGANISATION_LABELS: Record<string, string> = {
  institution: 'Institution',
  ong: 'ONG',
  entreprise: 'Entreprise',
  media: 'Média',
  universite: 'Université/École',
  association: 'Association',
};

type FilterTab = 'tous' | StatutMessage;

export function AdminMessages() {
  const { hasRole } = useAuth();
  const canReply = hasRole('super_admin', 'admin');
  const canDelete = hasRole('super_admin');

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [filter, setFilter] = useState<FilterTab>('tous');
  const [selected, setSelected] = useState<Message | null>(null);
  const [reponse, setReponse] = useState('');
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'contact' | 'objet' | 'created_at' | 'statut'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  async function load() {
    try {
      const data = await api.get<Message[]>('/v1/messages');
      setMessages(data);
    } catch {
      toast.error('Impossible de charger les messages.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: 'contact' | 'objet' | 'created_at' | 'statut') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    if (!messages) return [];
    let list = filter === 'tous' ? messages : messages.filter((m) => m.statut === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          `${m.prenom} ${m.nom}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'contact') cmp = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
      else if (sortKey === 'objet') cmp = a.objet.localeCompare(b.objet);
      else if (sortKey === 'statut') cmp = a.statut.localeCompare(b.statut);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [messages, filter, search, sortKey, sortDir]);

  async function openDetail(m: Message) {
    setSelected(m);
    setReponse('');

    // Marquer comme lu automatiquement (réservé admin/super_admin, cf. routes API)
    if (m.statut === 'non_lu' && canReply) {
      try {
        const updated = await api.put<Message>(`/v1/messages/${m.id}`, { statut: 'lu' });
        setMessages((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
        setSelected(updated);
      } catch {
        // silencieux — ce n'est pas bloquant pour la lecture
      }
    }
  }

  async function envoyerReponse() {
    if (!selected || !reponse.trim()) return;
    setSending(true);
    try {
      const updated = await api.post<Message>(`/v1/messages/${selected.id}/repondre`, {
        reponse,
      });
      setMessages((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      toast.success('Réponse envoyée par email au contact.');
      setSelected(updated);
      setReponse('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  async function convertirEnPartenaire() {
    if (!selected) return;
    setConverting(true);
    try {
      const partenaire = await api.post<Partenaire>(`/v1/messages/${selected.id}/creer-partenaire`);
      const updated = { ...selected, partenaire_id: partenaire.id };
      setMessages((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      setSelected(updated);
      toast.success('Partenaire créé (statut inactif) — à activer depuis la page Partenaires.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur lors de la création du partenaire.');
    } finally {
      setConverting(false);
    }
  }

  async function remove(m: Message) {
    if (!confirm(`Supprimer définitivement le message de ${m.prenom} ${m.nom} ?`)) return;
    try {
      await api.delete(`/v1/messages/${m.id}`);
      setMessages((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
      toast.success('Message supprimé.');
      if (selected?.id === m.id) setSelected(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm">Messages reçus via le formulaire de contact.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="non_lu">Non lus</TabsTrigger>
            <TabsTrigger value="lu">Lus</TabsTrigger>
            <TabsTrigger value="repondu">Répondus</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un message…"
            className="pl-9"
          />
        </div>
      </div>

      {messages === null ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-brand-green-100">
          Aucun message dans cette catégorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Contact" active={sortKey === 'contact'} dir={sortDir} onClick={() => toggleSort('contact')} />
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortableHeader label="Objet" active={sortKey === 'objet'} dir={sortDir} onClick={() => toggleSort('objet')} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <SortableHeader label="Reçu le" active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className={`cursor-pointer ${m.statut === 'non_lu' ? 'bg-brand-red-50/30' : ''}`} onClick={() => openDetail(m)}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {m.prenom} {m.nom}
                    </div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">
                    {OBJET_LABELS[m.objet]}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-500 text-sm">
                    {new Date(m.created_at).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_BADGE[m.statut]}>
                      {STATUT_LABELS[m.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(m)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.prenom} {selected.nom}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={STATUT_BADGE[selected.statut]}>
                    {STATUT_LABELS[selected.statut]}
                  </Badge>
                  <Badge variant="secondary">{OBJET_LABELS[selected.objet]}</Badge>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-slate-700">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Téléphone</p>
                    <p className="text-slate-700">{selected.telephone}</p>
                  </div>
                </dl>

                {selected.objet === 'partenariat' && selected.organisation && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <p className="text-slate-400 text-xs font-medium">Organisation</p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-slate-400 text-xs">Nom</p>
                        <p className="text-slate-700">{selected.organisation}</p>
                      </div>
                      {selected.type_organisation && (
                        <div>
                          <p className="text-slate-400 text-xs">Type</p>
                          <p className="text-slate-700">{TYPE_ORGANISATION_LABELS[selected.type_organisation]}</p>
                        </div>
                      )}
                      {selected.secteur_activite && (
                        <div>
                          <p className="text-slate-400 text-xs">Secteur</p>
                          <p className="text-slate-700">{selected.secteur_activite}</p>
                        </div>
                      )}
                      {(selected.ville || selected.pays) && (
                        <div>
                          <p className="text-slate-400 text-xs">Localisation</p>
                          <p className="text-slate-700">
                            {[selected.ville, selected.pays].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                      {selected.site_web && (
                        <div className="col-span-2">
                          <p className="text-slate-400 text-xs">Site web</p>
                          <a
                            href={selected.site_web}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-green-700 hover:underline break-all"
                          >
                            {selected.site_web}
                          </a>
                        </div>
                      )}
                    </dl>

                    {canReply &&
                      (selected.partenaire_id ? (
                        <p className="flex items-center gap-1.5 text-sm text-brand-green-700 font-medium pt-1">
                          <CheckCircle2 className="w-4 h-4" /> Déjà ajouté comme partenaire
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          disabled={converting}
                          onClick={convertirEnPartenaire}
                          className="bg-brand-green-600 hover:bg-brand-green-700 mt-1"
                        >
                          {converting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          Ajouter comme partenaire
                        </Button>
                      ))}
                  </div>
                )}

                <div>
                  <p className="text-slate-400 text-xs mb-1">Message</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selected.message}</p>
                </div>

                {selected.reponse && (
                  <div className="bg-brand-green-50 rounded-xl p-3">
                    <p className="text-brand-green-700 text-xs mb-1 font-medium">
                      Réponse envoyée
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap">{selected.reponse}</p>
                  </div>
                )}

                {canReply && selected.statut !== 'repondu' && (
                  <div className="pt-2">
                    <Textarea
                      value={reponse}
                      onChange={(e) => setReponse(e.target.value)}
                      rows={4}
                      placeholder="Votre réponse (envoyée par email au contact)…"
                    />
                  </div>
                )}
              </div>

              {canReply && selected.statut !== 'repondu' && (
                <DialogFooter>
                  <Button
                    disabled={sending || !reponse.trim()}
                    onClick={envoyerReponse}
                    className="bg-brand-green-600 hover:bg-brand-green-700"
                  >
                    <Send className="w-4 h-4" /> Envoyer la réponse
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
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
