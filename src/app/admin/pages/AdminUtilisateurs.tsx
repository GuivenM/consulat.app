import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, Mail, ShieldCheck, Clock, KeyRound } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { useAuth, AdminRole } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

interface UtilisateurAdmin {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  role: AdminRole;
  role_label: string;
  telephone: string | null;
  est_actif: boolean;
  en_attente_activation: boolean;
  derniere_connexion: string | null;
  initiales: string;
}

const ROLES: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'agent', label: 'Agent' },
];

export function AdminUtilisateurs() {
  const { user: moi } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await api.get<UtilisateurAdmin[]>('/v1/utilisateurs');
      setUtilisateurs(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les utilisateurs.');
    }
  }

  async function changerRole(u: UtilisateurAdmin, role: AdminRole) {
    setBusyId(u.id);
    try {
      const updated = await api.put<UtilisateurAdmin>(`/v1/utilisateurs/${u.id}`, { role });
      setUtilisateurs((prev) => prev?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      toast.success('Rôle mis à jour.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActif(u: UtilisateurAdmin) {
    setBusyId(u.id);
    try {
      const updated = await api.put<UtilisateurAdmin>(`/v1/utilisateurs/${u.id}`, { est_actif: !u.est_actif });
      setUtilisateurs((prev) => prev?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      toast.success(updated.est_actif ? 'Compte réactivé.' : 'Compte désactivé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  }

  async function renvoyerActivation(u: UtilisateurAdmin) {
    setBusyId(u.id);
    try {
      await api.post(`/v1/utilisateurs/${u.id}/renvoyer-activation`, {});
      toast.success(`Email d'activation renvoyé à ${u.email}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible de renvoyer l'activation.");
    } finally {
      setBusyId(null);
    }
  }

  async function supprimer(u: UtilisateurAdmin) {
    if (!confirm(`Supprimer définitivement le compte de ${u.nom_complet} ?`)) return;
    setBusyId(u.id);
    try {
      await api.delete(`/v1/utilisateurs/${u.id}`);
      setUtilisateurs((prev) => prev?.filter((x) => x.id !== u.id) ?? null);
      toast.success('Compte supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Comptes ayant accès à l'espace d'administration.
          </p>
        </div>
      </div>

      {utilisateurs === null ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilisateurs.map((u) => {
                const estSoiMeme = moi?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-brand-green-50 text-brand-green-700 text-xs">
                            {u.initiales}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {u.nom_complet}
                            {estSoiMeme && <span className="text-xs text-slate-400">(vous)</span>}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        disabled={busyId === u.id || estSoiMeme}
                        onValueChange={(v) => changerRole(u, v as AdminRole)}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.est_actif}
                            disabled={busyId === u.id || estSoiMeme}
                            onCheckedChange={() => toggleActif(u)}
                          />
                          <span className="text-xs text-slate-500">{u.est_actif ? 'Actif' : 'Désactivé'}</span>
                        </div>
                        {u.en_attente_activation ? (
                          <Badge variant="outline" className="w-fit gap-1 bg-amber-50 text-amber-600 border-amber-200">
                            <Clock className="w-3 h-3" /> En attente d'activation
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit gap-1 bg-brand-green-50 text-brand-green-600 border-brand-green-200">
                            <ShieldCheck className="w-3 h-3" /> Activé
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                      {u.derniere_connexion || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {u.en_attente_activation && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Renvoyer l'email d'activation"
                            disabled={busyId === u.id}
                            onClick={() => renvoyerActivation(u)}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        {!estSoiMeme && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-brand-red-600 hover:text-brand-red-700"
                            disabled={busyId === u.id}
                            onClick={() => supprimer(u)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
