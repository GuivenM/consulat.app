import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, FilePlus2, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { Demande, StatutDemande } from './types';

const STATUT_COULEUR: Record<StatutDemande, string> = {
  recu: 'bg-slate-100 text-slate-600 border-slate-200',
  en_traitement: 'bg-brand-gold-50 text-brand-gold-700 border-brand-gold-200',
  pret: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  retire: 'bg-slate-100 text-slate-500 border-slate-200',
  rejete: 'bg-brand-red-50 text-brand-red-700 border-brand-red-200',
};

const TYPE_LABEL: Record<string, string> = {
  carte_consulaire: 'Carte consulaire',
  laissez_passer: 'Laissez-passer',
};

export function RessortissantDashboard() {
  const { ressortissant } = useRessortissantAuth();
  const [demandes, setDemandes] = useState<Demande[] | null>(null);

  useEffect(() => {
    ressortissantApi
      .get<Demande[]>('/v1/ressortissant/demandes')
      .then(setDemandes)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Impossible de charger vos demandes.'));
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour {ressortissant?.prenom}</h1>
          <p className="text-slate-500 text-sm mt-1">Voici l'état de vos démarches consulaires.</p>
        </div>
        <Link to="/espace-consulaire/nouvelle-demande">
          <Button className="bg-brand-green-600 hover:bg-brand-green-700">
            <FilePlus2 className="w-4 h-4 mr-2" /> Nouvelle demande
          </Button>
        </Link>
      </div>

      {demandes === null ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : demandes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Vous n'avez encore déposé aucune demande.</p>
          <Link to="/espace-consulaire/nouvelle-demande">
            <Button variant="outline">Déposer une première demande</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100">
          {demandes.map((d) => (
            <Link
              key={d.id}
              to={`/espace-consulaire/demandes/${d.id}`}
              className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{TYPE_LABEL[d.type] ?? d.type}</div>
                <div className="text-xs text-slate-400 font-mono">{d.numero_dossier} · déposée le {d.date_depot}</div>
              </div>
              {(d.pieces_a_corriger ?? 0) > 0 && !['retire', 'rejete'].includes(d.statut) && (
                <Badge variant="outline" className="bg-brand-red-50 text-brand-red-700 border-brand-red-200 gap-1">
                  <AlertCircle className="w-3 h-3" /> {d.pieces_a_corriger} pièce(s) à corriger
                </Badge>
              )}
              <Badge variant="outline" className={STATUT_COULEUR[d.statut]}>{d.statut_label}</Badge>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
