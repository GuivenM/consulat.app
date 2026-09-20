import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FileUploadField } from './FileUploadField';
import type { Demande, DemandeConfiguration, StatutDemande } from './types';

const STATUT_COULEUR: Record<StatutDemande, string> = {
  recu: 'bg-slate-100 text-slate-600 border-slate-200',
  en_traitement: 'bg-brand-gold-50 text-brand-gold-700 border-brand-gold-200',
  pret: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  retire: 'bg-slate-100 text-slate-500 border-slate-200',
  rejete: 'bg-brand-red-50 text-brand-red-700 border-brand-red-200',
};

const ETAPES: { statut: StatutDemande; label: string }[] = [
  { statut: 'recu', label: 'Reçue' },
  { statut: 'en_traitement', label: 'En traitement' },
  { statut: 'pret', label: 'Prête' },
  { statut: 'retire', label: 'Retirée' },
];

export function DemandeDetail() {
  const { id } = useParams<{ id: string }>();
  const [demande, setDemande] = useState<Demande | null>(null);
  const [config, setConfig] = useState<DemandeConfiguration | null>(null);

  const charger = useCallback(async () => {
    try {
      const d = await ressortissantApi.get<Demande>(`/v1/ressortissant/demandes/${id}`);
      setDemande(d);
      const c = await ressortissantApi.get<DemandeConfiguration>(`/v1/ressortissant/demandes/configuration/${d.type}`);
      setConfig(c);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger cette demande.');
    }
  }, [id]);

  useEffect(() => { charger(); }, [charger]);

  if (!demande) {
    return <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const etapeActuelle = demande.statut === 'rejete' ? -1 : ETAPES.findIndex((e) => e.statut === demande.statut);

  return (
    <div className="max-w-2xl">
      <Link to="/espace-consulaire" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à mes demandes
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="font-mono text-xs text-slate-400">{demande.numero_dossier}</div>
            <h1 className="text-xl font-bold text-slate-900">
              {demande.type === 'carte_consulaire' ? 'Carte consulaire' : 'Laissez-passer'}
            </h1>
          </div>
          <Badge variant="outline" className={STATUT_COULEUR[demande.statut]}>{demande.statut_label}</Badge>
        </div>

        {demande.statut === 'rejete' ? (
          <div className="flex items-start gap-2 bg-brand-red-50 text-brand-red-700 text-sm rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>Demande rejetée{demande.motif_rejet ? ` : ${demande.motif_rejet}` : '.'}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {ETAPES.map((etape, i) => (
              <React.Fragment key={etape.statut}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i <= etapeActuelle ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {i < etapeActuelle ? <CheckCircle2 className="w-4 h-4" /> : i === etapeActuelle ? <Clock className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] text-slate-500 text-center">{etape.label}</span>
                </div>
                {i < ETAPES.length - 1 && (
                  <div className={`flex-1 h-0.5 -mt-5 ${i < etapeActuelle ? 'bg-brand-green-600' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-400">Délai choisi</div>
            <div className="text-slate-800 font-medium">{demande.delai_label}</div>
          </div>
          <div>
            <div className="text-slate-400">Montant</div>
            <div className="text-slate-800 font-medium">
              {demande.montant.toLocaleString('fr-FR')} {demande.devise} — {demande.paiement_statut === 'paye' ? 'payé' : 'en attente de paiement'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Déposée le</div>
            <div className="text-slate-800 font-medium">{demande.date_depot ?? '—'}</div>
          </div>
          <div>
            <div className="text-slate-400">Disponibilité prévue</div>
            <div className="text-slate-800 font-medium">{demande.date_disponibilite_prevue ?? '—'}</div>
          </div>
        </div>
      </div>

      {config && !['retire', 'rejete'].includes(demande.statut) && (
        <>
          <h2 className="font-bold text-slate-800 mb-3">Pièces du dossier</h2>
          <div className="space-y-4">
            {config.documents_requis.map((docCfg) => (
              <FileUploadField
                key={docCfg.code_document}
                demandeId={demande.id}
                config={docCfg}
                documents={demande.documents ?? []}
                onChange={charger}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
