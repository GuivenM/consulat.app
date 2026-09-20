import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Badge } from '../../components/ui/badge';
import type { PointCarte, QuartierAgregat, StatutRessortissant } from '../types';

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

interface CarteData {
  par_quartier: QuartierAgregat[];
  points: PointCarte[];
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
        setData({ par_quartier: [], points: [] });
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
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ height: 520 }}>
          {pointsAffiches.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-8">
              Aucun ressortissant géolocalisé pour l'instant — les points apparaîtront ici dès que
              des coordonnées seront renseignées au registre.
            </div>
          ) : (
            <MapContainer center={CENTRE_COTONOU} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
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
        </div>
      </div>
    </div>
  );
}
