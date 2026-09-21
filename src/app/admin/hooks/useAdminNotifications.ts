import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { Demande, Message } from '../types';

export type NotificationType = 'demande' | 'message';

export interface AdminNotification {
  type: NotificationType;
  id: number;
  titre: string;
  sous_titre: string;
  date: string;
  lien: string;
}

interface NotificationsState {
  loading: boolean;
  items: AdminNotification[];
  total: number;
  demandesEnAttente: number;
  messagesNonLus: number;
  refresh: () => void;
}

const INTERVALLE_RAFRAICHISSEMENT_MS = 60_000;

/**
 * "Nouveau" est dérivé du statut métier existant (une demande reçue, un
 * message non_lu redeviennent silencieux dès qu'un admin/agent les
 * traite) — pas d'un système de notifications séparé à marquer lu/non lu.
 */
export function useAdminNotifications(): NotificationsState {
  const [loading, setLoading] = useState(true);
  const [demandesRecues, setDemandesRecues] = useState<Demande[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const charger = useCallback(async () => {
    try {
      const [demandesData, messagesData] = await Promise.all([
        api.get<{ items: Demande[] }>('/v1/admin/demandes?statut=recu&par_page=50'),
        api.get<Message[]>('/v1/messages'),
      ]);
      setDemandesRecues(demandesData.items);
      setMessages(messagesData);
    } catch {
      // Échec silencieux : la cloche affiche simplement les derniers
      // chiffres connus plutôt qu'une erreur intrusive.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(interval);
  }, [charger]);

  const messagesNonLus = messages.filter((m) => m.statut === 'non_lu');

  const items: AdminNotification[] = [
    ...demandesRecues.map((d) => ({
      type: 'demande' as const,
      id: d.id,
      titre: `Nouvelle demande — ${d.numero_dossier}`,
      sous_titre: d.ressortissant?.nom_complet ?? d.type,
      date: d.date_depot ?? '',
      lien: '/admin/demandes',
    })),
    ...messagesNonLus.map((m) => ({
      type: 'message' as const,
      id: m.id,
      titre: `Nouveau message — ${m.prenom} ${m.nom}`,
      sous_titre: m.objet,
      date: m.created_at,
      lien: '/admin/messages',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return {
    loading,
    items,
    total: demandesRecues.length + messagesNonLus.length,
    demandesEnAttente: demandesRecues.length,
    messagesNonLus: messagesNonLus.length,
    refresh: charger,
  };
}