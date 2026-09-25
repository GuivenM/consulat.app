import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Mail,
  BookUser,
  Newspaper,
  BookOpen,
  Handshake,
  Loader2,
  ArrowRight,
  Map as MapIcon,
  FileClock,
  PackageCheck,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Message, Actualite, GuideSection, Partenaire } from './types';
import type { PointCarte } from './types';

const CENTRE_COTONOU: [number, number] = [6.3703, 2.3912];
const STATUT_COULEUR: Record<string, string> = {
  actif: '#009739',
  inactif: '#94a3b8',
  suspendu: '#ef3340',
};

interface Overview {
  messagesNonLus: number;
  messagesTotal: number;
  ressortissantsTotal: number;
  ressortissantsParStatut: Record<string, number>;
  actualitesBrouillons: number;
  actualitesTotal: number;
  guideDocuments: number;
  guideSections: number;
  partenairesActifs: number;
  partenairesTotal: number;
}

interface RessortissantsStats {
  total: number;
  par_statut: Record<string, number>;
  par_ville: Record<string, number>;
}

interface DashboardDemandes {
  demandes: { a_traiter: number; pretes: number; en_retard: number };
  encaissements: { jour: number; mois: number; devise: string };
}

const FORMAT_XOF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [points, setPoints] = useState<PointCarte[] | null>(null);
  const [demandes, setDemandes] = useState<DashboardDemandes | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Séparé du reste : un dossier de traitement ne doit pas empêcher le
  // reste du tableau de bord de s'afficher si cet appel échoue seul.
  const [erreurDemandes, setErreurDemandes] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<DashboardDemandes>('/v1/admin/dashboard')
      .then((res) => !cancelled && setDemandes(res))
      .catch(() => !cancelled && setErreurDemandes(true));

    (async () => {
      try {
        const [messages, ressortissantsStats, actualites, guide, partenairesActifs, partenairesInactifs, carte] =
          await Promise.all([
            api.get<Message[]>('/v1/messages'),
            api.get<RessortissantsStats>('/v1/admin/ressortissants/statistiques'),
            api.get<Actualite[]>('/v1/actualites?all=1'),
            api.get<GuideSection[]>('/v1/guide?all=1'),
            api.get<Partenaire[]>('/v1/partenaires?statut=actif'),
            api.get<Partenaire[]>('/v1/partenaires?statut=inactif'),
            api.get<{ par_quartier: unknown[]; points: PointCarte[] }>('/v1/admin/ressortissants/carte'),
          ]);

        if (cancelled) return;

        setData({
          messagesNonLus: messages.filter((m) => m.statut === 'non_lu').length,
          messagesTotal: messages.length,
          ressortissantsTotal: ressortissantsStats.total,
          ressortissantsParStatut: ressortissantsStats.par_statut,
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
        setPoints(carte.points);
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

      {erreurDemandes && (
        <div className="mb-5 rounded-xl bg-brand-red-50 border border-brand-red-200 text-brand-red-700 text-sm px-4 py-3">
          Impossible de charger les chiffres des demandes.
        </div>
      )}

      {demandes && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Demandes</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Link to="/admin/demandes">
              <StatCard
                label="Dossiers à traiter"
                value={demandes.demandes.a_traiter}
                icon={FileClock}
                tone={demandes.demandes.a_traiter > 0 ? 'gold' : 'green'}
              />
            </Link>
            <Link to="/admin/demandes">
              <StatCard label="Prêts à retirer" value={demandes.demandes.pretes} icon={PackageCheck} tone="green" />
            </Link>
            <Link to="/admin/demandes">
              <StatCard
                label="En retard"
                value={demandes.demandes.en_retard}
                icon={AlertTriangle}
                tone={demandes.demandes.en_retard > 0 ? 'red' : 'green'}
              />
            </Link>
            <div className="bg-white border border-brand-green-100 rounded-xl p-[18px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Encaissé aujourd'hui</span>
                <Wallet className="w-4 h-4 text-brand-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {FORMAT_XOF.format(demandes.encaissements.jour)}
                <span className="text-sm font-normal text-slate-400"> {demandes.encaissements.devise}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {FORMAT_XOF.format(demandes.encaissements.mois)} {demandes.encaissements.devise} ce mois-ci
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <StatCard label="Ressortissants inscrits" value={data.ressortissantsTotal} icon={BookUser} tone="green" />
            <StatCard
              label="Messages non lus"
              value={data.messagesNonLus}
              icon={Mail}
              tone={data.messagesNonLus > 0 ? 'red' : 'green'}
            />
            <StatCard
              label="Actualités en brouillon"
              value={data.actualitesBrouillons}
              icon={Newspaper}
              tone={data.actualitesBrouillons > 0 ? 'gold' : 'green'}
            />
            <StatCard label="Partenaires actifs" value={data.partenairesActifs} icon={Handshake} tone="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2 bg-white border border-brand-green-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-brand-green-600" /> Registre — carte des ressortissants
                </h2>
                <Link to="/admin/carte" className="text-xs text-brand-green-600 hover:underline flex items-center gap-1">
                  Carte complète <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div style={{ height: 300 }}>
                {points === null ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : points.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-8">
                    Aucun ressortissant géolocalisé pour l'instant.
                  </div>
                ) : (
                  <MapContainer center={CENTRE_COTONOU} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {points.map((p) => (
                      <CircleMarker
                        key={p.id}
                        center={[p.latitude, p.longitude]}
                        radius={6}
                        pathOptions={{
                          color: STATUT_COULEUR[p.statut] ?? '#94a3b8',
                          fillColor: STATUT_COULEUR[p.statut] ?? '#94a3b8',
                          fillOpacity: 0.8,
                        }}
                      />
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-brand-green-100 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Registre par statut</h2>
              <div className="space-y-3">
                {(['actif', 'inactif', 'suspendu'] as const).map((statut) => (
                  <div key={statut} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 capitalize">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COULEUR[statut] }} />
                      {statut}
                    </span>
                    <span className="font-semibold text-slate-900">{data.ressortissantsParStatut[statut] ?? 0}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/registre"
                className="mt-5 inline-flex items-center gap-1 text-xs text-brand-green-600 hover:underline"
              >
                Voir le registre <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Modules
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
