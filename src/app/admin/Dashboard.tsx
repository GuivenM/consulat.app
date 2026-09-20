import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Mail,
  BookUser,
  CheckCircle2,
  Newspaper,
  BookOpen,
  Handshake,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import type {
  Message,
  RessortissantStats,
  Demande,
  Actualite,
  GuideSection,
  Partenaire,
} from './types';

interface Overview {
  messagesNonLus: number;
  messagesTotal: number;
  ressortissantsActifs: number;
  ressortissantsTotal: number;
  demandesEnAttente: number;
  demandesPretes: number;
  demandesTotal: number;
  actualitesBrouillons: number;
  actualitesTotal: number;
  guideDocuments: number;
  guideSections: number;
  partenairesActifs: number;
  partenairesTotal: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [
          messages,
          ressortissantsStats,
          demandes,
          actualites,
          guide,
          partenairesActifs,
          partenairesInactifs,
        ] = await Promise.all([
          api.get<Message[]>('/v1/messages'),
          api.get<RessortissantStats>('/v1/admin/ressortissants/statistiques'),
          // NOTE : /v1/admin/demandes pagine côté serveur (20/page par défaut) mais
          // ne renvoie pas encore de total exploitable par ce client HTTP (le
          // `meta` de la réponse est ignoré par api.get, voir lib/api.ts) — une
          // vraie page Demandes visera cet endpoint avec ses propres filtres,
          // ce large par_page n'est qu'un aperçu pour le tableau de bord.
          api.get<Demande[]>('/v1/admin/demandes?par_page=200'),
          api.get<Actualite[]>('/v1/actualites'),
          api.get<GuideSection[]>('/v1/guide?all=1'),
          api.get<Partenaire[]>('/v1/partenaires?statut=actif'),
          api.get<Partenaire[]>('/v1/partenaires?statut=inactif'),
        ]);

        if (cancelled) return;

        setData({
          messagesNonLus: messages.filter((m) => m.statut === 'non_lu').length,
          messagesTotal: messages.length,
          ressortissantsActifs: ressortissantsStats.par_statut.actif ?? 0,
          ressortissantsTotal: ressortissantsStats.total,
          demandesEnAttente: demandes.filter((d) => d.statut === 'recu' || d.statut === 'en_traitement').length,
          demandesPretes: demandes.filter((d) => d.statut === 'pret').length,
          demandesTotal: demandes.length,
          actualitesBrouillons: actualites.filter((a) => a.statut === 'brouillon').length,
          actualitesTotal: actualites.length,
          guideDocuments: guide.reduce(
            (sum, s) => sum + s.sous_sections.reduce((s2, ss) => s2 + ss.documents.length, 0),
            0
          ),
          guideSections: guide.length,
          partenairesActifs: partenairesActifs.length,
          partenairesTotal: partenairesActifs.length + partenairesInactifs.length,
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
              label="Demandes en attente"
              value={data.demandesEnAttente}
              icon={FileText}
              tone={data.demandesEnAttente > 0 ? 'gold' : 'green'}
            />
            <StatCard
              label="Dossiers prêts"
              value={data.demandesPretes}
              icon={CheckCircle2}
              tone={data.demandesPretes > 0 ? 'gold' : 'green'}
            />
            <StatCard
              label="Messages non lus"
              value={data.messagesNonLus}
              icon={Mail}
              tone={data.messagesNonLus > 0 ? 'red' : 'green'}
            />
            <StatCard
              label="Ressortissants inscrits"
              value={data.ressortissantsActifs}
              icon={BookUser}
              tone="green"
            />
          </div>

          {/* Tous les modules */}
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Modules
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <ModuleCard
              to="/admin/demandes"
              icon={FileText}
              title="Demandes"
              stat={`${data.demandesTotal} dossier${data.demandesTotal > 1 ? 's' : ''} au total`}
              badge={data.demandesEnAttente}
            />
            <ModuleCard
              to="/admin/registre"
              icon={BookUser}
              title="Registre consulaire"
              stat={`${data.ressortissantsActifs} actif${data.ressortissantsActifs > 1 ? 's' : ''} / ${data.ressortissantsTotal}`}
            />
            <ModuleCard
              to="/admin/messages"
              icon={Mail}
              title="Messages"
              stat={`${data.messagesTotal} message${data.messagesTotal > 1 ? 's' : ''} reçu${data.messagesTotal > 1 ? 's' : ''}`}
              badge={data.messagesNonLus}
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
