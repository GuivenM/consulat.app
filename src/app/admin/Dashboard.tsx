import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Mail,
  Users,
  Wallet,
  CalendarDays,
  Newspaper,
  BookOpen,
  Handshake,
  Activity,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import type {
  Adhesion,
  Message,
  Membre,
  CotisationStats,
  Evenement,
  Actualite,
  GuideSection,
  Partenaire,
  Action,
} from './types';

interface Overview {
  adhesionsEnAttente: number;
  adhesionsTotal: number;
  messagesNonLus: number;
  messagesTotal: number;
  membresActifs: number;
  membresTotal: number;
  cotisationsEnRetard: number;
  cotisationsTauxAJour: number;
  evenementsAVenir: number;
  evenementsTotal: number;
  actualitesBrouillons: number;
  actualitesTotal: number;
  guideDocuments: number;
  guideSections: number;
  partenairesActifs: number;
  partenairesTotal: number;
  actionsEnCours: number;
  actionsTotal: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const moisCourant = new Date().toISOString().slice(0, 7);

    (async () => {
      try {
        const [
          adhesions,
          messages,
          membres,
          cotisationsStats,
          evenements,
          actualites,
          guide,
          partenairesActifs,
          partenairesInactifs,
          actions,
        ] = await Promise.all([
          api.get<Adhesion[]>('/v1/adhesions'),
          api.get<Message[]>('/v1/messages'),
          api.get<Membre[]>('/v1/membres-admin/tous'),
          api.get<CotisationStats>(`/v1/cotisations/statistiques?mois=${moisCourant}`),
          api.get<Evenement[]>('/v1/evenements'),
          api.get<Actualite[]>('/v1/actualites'),
          api.get<GuideSection[]>('/v1/guide?all=1'),
          api.get<Partenaire[]>('/v1/partenaires?statut=actif'),
          api.get<Partenaire[]>('/v1/partenaires?statut=inactif'),
          api.get<Action[]>('/v1/actions'),
        ]);

        if (cancelled) return;

        const today = new Date().toISOString().slice(0, 10);

        setData({
          adhesionsEnAttente: adhesions.filter((a) => a.statut === 'en_attente').length,
          adhesionsTotal: adhesions.length,
          messagesNonLus: messages.filter((m) => m.statut === 'non_lu').length,
          messagesTotal: messages.length,
          membresActifs: membres.filter((m) => m.statut === 'actif').length,
          membresTotal: membres.length,
          cotisationsEnRetard: cotisationsStats.nb_impayees,
          cotisationsTauxAJour: cotisationsStats.taux_a_jour,
          evenementsAVenir: evenements.filter((e) => e.date_debut >= today && e.statut === 'publie').length,
          evenementsTotal: evenements.length,
          actualitesBrouillons: actualites.filter((a) => a.statut === 'brouillon').length,
          actualitesTotal: actualites.length,
          guideDocuments: guide.reduce(
            (sum, s) => sum + s.sous_sections.reduce((s2, ss) => s2 + ss.documents.length, 0),
            0
          ),
          guideSections: guide.length,
          partenairesActifs: partenairesActifs.length,
          partenairesTotal: partenairesActifs.length + partenairesInactifs.length,
          actionsEnCours: actions.filter((a) => a.statut === 'actif').length,
          actionsTotal: actions.length,
        });
      } catch {
        if (!cancelled) setError('Impossible de charger les données du tableau de bord.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-0.5">Bonjour {user?.prenom}, voici l'activité du consulat.</p>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!data ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* À traiter en priorité */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <StatCard
              label="Adhésions en attente"
              value={data.adhesionsEnAttente}
              icon={UserPlus}
              tone={data.adhesionsEnAttente > 0 ? 'gold' : 'green'}
            />
            <StatCard
              label="Messages non lus"
              value={data.messagesNonLus}
              icon={Mail}
              tone={data.messagesNonLus > 0 ? 'red' : 'green'}
            />
            <StatCard
              label="Cotisations en retard"
              value={data.cotisationsEnRetard}
              icon={Wallet}
              tone={data.cotisationsEnRetard > 0 ? 'red' : 'green'}
            />
            <StatCard
              label="Événements à venir"
              value={data.evenementsAVenir}
              icon={CalendarDays}
              tone="green"
            />
          </div>

          {/* Tous les modules */}
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Modules
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <ModuleCard
              to="/admin/adhesions"
              icon={UserPlus}
              title="Adhésions"
              stat={`${data.adhesionsTotal} demande${data.adhesionsTotal > 1 ? 's' : ''} au total`}
              badge={data.adhesionsEnAttente}
            />
            <ModuleCard
              to="/admin/messages"
              icon={Mail}
              title="Messages"
              stat={`${data.messagesTotal} message${data.messagesTotal > 1 ? 's' : ''} reçu${data.messagesTotal > 1 ? 's' : ''}`}
              badge={data.messagesNonLus}
            />
            <ModuleCard
              to="/admin/membres"
              icon={Users}
              title="Membres"
              stat={`${data.membresActifs} actif${data.membresActifs > 1 ? 's' : ''} / ${data.membresTotal}`}
            />
            <ModuleCard
              to="/admin/cotisations"
              icon={Wallet}
              title="Cotisations"
              stat={`${data.cotisationsTauxAJour}% à jour ce mois`}
              badge={data.cotisationsEnRetard}
            />
            <ModuleCard
              to="/admin/evenements"
              icon={CalendarDays}
              title="Événements"
              stat={`${data.evenementsTotal} événement${data.evenementsTotal > 1 ? 's' : ''} au total`}
            />
            <ModuleCard
              to="/admin/actualites"
              icon={Newspaper}
              title="Actualités"
              stat={`${data.actualitesBrouillons} brouillon${data.actualitesBrouillons > 1 ? 's' : ''} en attente`}
            />
            <ModuleCard
              to="/admin/guide"
              icon={BookOpen}
              title="Guide"
              stat={`${data.guideSections} section${data.guideSections > 1 ? 's' : ''} · ${data.guideDocuments} document${data.guideDocuments > 1 ? 's' : ''}`}
            />
            <ModuleCard
              to="/admin/partenaires"
              icon={Handshake}
              title="Partenaires"
              stat={`${data.partenairesActifs} actif${data.partenairesActifs > 1 ? 's' : ''} / ${data.partenairesTotal}`}
            />
            <ModuleCard
              to="/admin/actions"
              icon={Activity}
              title="Actions"
              stat={`${data.actionsEnCours} en cours / ${data.actionsTotal}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

const TONE_STYLES = {
  green: 'text-brand-green-600',
  gold: 'text-brand-gold-500',
  red: 'text-brand-red-600',
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'green',
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <div className="bg-white border border-brand-green-100 rounded-xl p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${TONE_STYLES[tone]}`} />
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
    </div>
  );
}

function ModuleCard({
  to,
  icon: Icon,
  title,
  stat,
  badge,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  stat: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="relative bg-white border border-brand-green-100 rounded-xl p-5 hover:border-brand-green-300 transition-colors group flex items-start justify-between gap-3"
    >
      {!!badge && badge > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-red-600 text-white text-[11px] font-bold flex items-center justify-center leading-none shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-brand-green-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-brand-green-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{stat}</p>
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1.5 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-green-600" />
    </Link>
  );
}
