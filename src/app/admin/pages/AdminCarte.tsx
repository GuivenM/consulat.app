import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Badge } from '../../components/ui/badge';
import type { PointCarte, PositionApproximative, QuartierAgregat, StatutRessortissant } from '../types';

// Centre approximatif de Cotonou — le point de départ le plus utile tant que
// la grande majorité des ressortissants inscrits y résident.
const CENTRE_COTONOU: [number, number] = [6.3703, 2.3912];

const STATUT_COULEUR: Record<StatutRessortissant, string> = {
  actif: '#009739',    // brand-green-500
  inactif: '#94a3b8',  // slate-400
  suspendu: '#ef3340', // brand-red-500
};

const STATUT_LABEL: Record<StatutRessortissant, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
};

// Couleurs des repères approximatifs (sans GPS) : bleu = centre du quartier,
// ambre = centre de la commune (quartier inconnu ou non renseigné).
const COULEUR_APPROX = { quartier: '#2563eb', ville: '#f59e0b' };

interface CarteData {
  par_quartier: QuartierAgregat[];
  points: PointCarte[];
  approximatifs?: PositionApproximative[];
  sans_position?: number;
}

export function AdminCarte() {
  const [data, setData] = useState<CarteData | null>(null);
  const [filtreVille, setFiltreVille] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<CarteData>('/v1/admin/ressortissants/carte');
        setData(res);
      } catch (err) {
        // Pas de toast bloquant ici : la page reste utilisable vide plutôt
        // que de planter si la géolocalisation n'est pas encore renseignée.
        console.error(err instanceof ApiError ? err.message : err);
        setData({ par_quartier: [], points: [], approximatifs: [], sans_position: 0 });
      }
    })();
  }, []);

  const villes = useMemo(
    () => Array.from(new Set((data?.par_quartier ?? []).map((q) => q.ville))).sort(),
    [data]
  );

  const quartiersAffiches = useMemo(
    () => (data?.par_quartier ?? []).filter((q) => !filtreVille || q.ville === filtreVille),
    [data, filtreVille]
  );

  const pointsAffiches = useMemo(
    () => (data?.points ?? []).filter((p) => !filtreVille || p.ville === filtreVille),
    [data, filtreVille]
  );

  const approxAffiches = useMemo(
    () => (data?.approximatifs ?? []).filter((p) => !filtreVille || p.ville === filtreVille),
    [data, filtreVille]
  );

  if (data === null) {
    return <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-slate-400" /> Carte du registre
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Vue interne, non anonymisée — la vitrine publique n'affiche qu'une agrégation par ville.
          Les ressortissants sans position GPS apparaissent au centre de leur quartier (position approximative).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ height: 520 }}>
          {pointsAffiches.length === 0 && approxAffiches.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-8">
              Aucun ressortissant à afficher pour l'instant — ils apparaîtront ici dès qu'une ville ou
              une position sera renseignée au registre.
            </div>
          ) : (
            <MapContainer center={CENTRE_COTONOU} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {approxAffiches.map((p) => {
                const couleur = COULEUR_APPROX[p.precision];
                return (
                  <CircleMarker
                    key={`${p.ville}-${p.quartier ?? '*'}`}
                    center={[p.latitude, p.longitude]}
                    radius={Math.min(32, 10 + Math.sqrt(p.total) * 4)}
                    pathOptions={{ color: couleur, fillColor: couleur, fillOpacity: 0.3, dashArray: '4 4' }}
                  >
                    <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none font-bold">
                      {p.total}
                    </Tooltip>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">
                          {p.precision === 'quartier' ? `${p.quartier} (${p.ville})` : `${p.ville} · quartiers sans position`}
                        </div>
                        <div className="text-slate-500">
                          {p.total} ressortissant{p.total > 1 ? 's' : ''} sans GPS — position approximative
                        </div>
                        <div className="mt-1">
                          {(Object.keys(STATUT_LABEL) as StatutRessortissant[])
                            .filter((s) => p.par_statut[s])
                            .map((s) => `${STATUT_LABEL[s]} : ${p.par_statut[s]}`)
                            .join(' · ')}
                        </div>
                        {p.precision === 'ville' && Object.keys(p.quartiers).length > 0 && (
                          <ul className="mt-1 text-slate-500 list-disc pl-4">
                            {Object.entries(p.quartiers).map(([nom, n]) => (
                              <li key={nom}>{nom} ({n})</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              {pointsAffiches.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[p.latitude, p.longitude]}
                  radius={7}
                  pathOptions={{ color: STATUT_COULEUR[p.statut], fillColor: STATUT_COULEUR[p.statut], fillOpacity: 0.8 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{p.nom_complet}</div>
                      <div className="text-slate-500">{p.ville}{p.quartier ? ` · ${p.quartier}` : ''}</div>
                      <div className="mt-1">{STATUT_LABEL[p.statut]}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-col" style={{ maxHeight: 520 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Par quartier</h2>
            <select
              className="text-sm border border-slate-200 rounded-lg px-2 py-1"
              value={filtreVille ?? ''}
              onChange={(e) => setFiltreVille(e.target.value || null)}
            >
              <option value="">Toutes les villes</option>
              {villes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {quartiersAffiches.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée pour l'instant.</p>
          ) : (
            <div className="overflow-y-auto space-y-1.5 pr-1">
              {quartiersAffiches.map((q) => (
                <div key={`${q.ville}-${q.quartier}`} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-slate-800">{q.quartier}</div>
                    <div className="text-xs text-slate-400">{q.ville}</div>
                  </div>
                  <Badge variant="outline">{q.total}</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            {(Object.keys(STATUT_LABEL) as StatutRessortissant[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COULEUR[s] }} />
                {STATUT_LABEL[s]}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ borderColor: COULEUR_APPROX.quartier, backgroundColor: `${COULEUR_APPROX.quartier}55` }} />
              Sans GPS : centre du quartier (approximatif)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ borderColor: COULEUR_APPROX.ville, backgroundColor: `${COULEUR_APPROX.ville}55` }} />
              Sans GPS : quartier inconnu, centre de la commune
            </div>
            {!!data.sans_position && (
              <div>{data.sans_position} ressortissant(s) non localisable(s) (commune sans coordonnées)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
