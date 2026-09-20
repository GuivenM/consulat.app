import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, IdCard, FileCheck2, CheckCircle2 } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { FileUploadField } from './FileUploadField';
import type { Demande, DemandeConfiguration, DelaiDemande, TypeDemande } from './types';

const TYPES: { value: TypeDemande; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'carte_consulaire',
    label: 'Carte consulaire',
    icon: <IdCard className="w-6 h-6" />,
    description: "Document d'identification pour les ressortissants inscrits au registre.",
  },
  {
    value: 'laissez_passer',
    label: 'Laissez-passer',
    icon: <FileCheck2 className="w-6 h-6" />,
    description: 'Document de voyage temporaire, notamment en cas de passeport perdu ou expiré.',
  },
];

export function NouvelleDemande() {
  const navigate = useNavigate();
  const [type, setType] = useState<TypeDemande | null>(null);
  const [config, setConfig] = useState<DemandeConfiguration | null>(null);
  const [delai, setDelai] = useState<DelaiDemande | null>(null);
  const [demande, setDemande] = useState<Demande | null>(null);
  const [chargementConfig, setChargementConfig] = useState(false);
  const [depot, setDepot] = useState(false);

  useEffect(() => {
    if (!type) return;
    setChargementConfig(true);
    setConfig(null);
    setDelai(null);
    ressortissantApi
      .get<DemandeConfiguration>(`/v1/ressortissant/demandes/configuration/${type}`)
      .then(setConfig)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Ce type de demande est indisponible pour le moment.'))
      .finally(() => setChargementConfig(false));
  }, [type]);

  async function deposer() {
    if (!type || !delai) return;
    setDepot(true);
    try {
      const nouvelleDemande = await ressortissantApi.post<Demande>('/v1/ressortissant/demandes', { type, delai });
      setDemande(nouvelleDemande);
      toast.success('Demande enregistrée — envoyez à présent vos pièces.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec du dépôt de la demande.');
    } finally {
      setDepot(false);
    }
  }

  async function rafraichirDemande() {
    if (!demande) return;
    try {
      const fraiche = await ressortissantApi.get<Demande>(`/v1/ressortissant/demandes/${demande.id}`);
      setDemande(fraiche);
    } catch {
      // pas bloquant : l'utilisateur peut réessayer une action
    }
  }

  // ===== Étape 3 : dossier créé, upload des pièces =====
  if (demande && config) {
    const documentsObligatoiresManquants = config.documents_requis.some((docCfg) => {
      if (!docCfg.obligatoire) return false;
      const fournis = (demande.documents ?? []).filter(
        (d) => d.code_document === docCfg.code_document && d.statut !== 'rejete'
      );
      return fournis.length < docCfg.nombre_requis;
    });

    return (
      <div className="max-w-2xl">
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-green-600 shrink-0" />
          <div className="text-sm text-brand-green-800">
            Dossier <strong>{demande.numero_dossier}</strong> créé — montant à régler : {demande.montant.toLocaleString('fr-FR')} {demande.devise}
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-1">Pièces à fournir</h1>
        <p className="text-slate-500 text-sm mb-6">Envoyez chaque pièce ci-dessous pour compléter votre dossier.</p>

        <div className="space-y-4">
          {config.documents_requis.map((docCfg) => (
            <FileUploadField
              key={docCfg.code_document}
              demandeId={demande.id}
              config={docCfg}
              documents={demande.documents ?? []}
              onChange={rafraichirDemande}
            />
          ))}
        </div>

        <Button
          className="w-full mt-6 bg-brand-green-600 hover:bg-brand-green-700"
          disabled={documentsObligatoiresManquants}
          onClick={() => navigate(`/espace-consulaire/demandes/${demande.id}`)}
        >
          {documentsObligatoiresManquants ? 'Pièces obligatoires manquantes' : 'Voir le suivi de mon dossier'}
        </Button>
      </div>
    );
  }

  // ===== Étape 2 : choix du délai (une fois le type choisi) =====
  if (type) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setType(null)} className="text-sm text-slate-500 hover:text-slate-700 mb-4">
          ← Changer de type de demande
        </button>
        <h1 className="text-xl font-bold text-slate-900 mb-6">
          {TYPES.find((t) => t.value === type)?.label} — choisir un délai
        </h1>

        {chargementConfig ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : !config || config.tarifs.length === 0 ? (
          <p className="text-slate-500">Ce type de demande n'est pas disponible actuellement.</p>
        ) : (
          <div className="space-y-3">
            {config.tarifs.map((t) => (
              <button
                key={t.delai}
                onClick={() => setDelai(t.delai)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-colors ${
                  delai === t.delai ? 'border-brand-green-500 bg-brand-green-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="font-medium text-slate-800">{t.delai_label}</span>
                <span className="font-bold text-slate-900">{t.montant.toLocaleString('fr-FR')} {t.devise}</span>
              </button>
            ))}

            <Button
              className="w-full mt-4 bg-brand-green-600 hover:bg-brand-green-700"
              disabled={!delai || depot}
              onClick={deposer}
            >
              {depot ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Déposer la demande'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ===== Étape 1 : choix du type de demande =====
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Quel type de demande souhaitez-vous déposer ?</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className="text-left p-6 rounded-2xl border border-slate-200 bg-white hover:border-brand-green-400 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-green-50 text-brand-green-600 flex items-center justify-center mb-4">
              {t.icon}
            </div>
            <div className="font-bold text-slate-900 mb-1">{t.label}</div>
            <p className="text-sm text-slate-500">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
