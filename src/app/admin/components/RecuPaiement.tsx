import { useEffect, useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../components/ui/dialog';

interface RecuData {
  numero_recu: string;
  date_encaissement: string;
  montant: number;
  devise: string;
  mode_label: string;
  nom_payeur: string | null;
  telephone_payeur: string | null;
  numero_dossier: string;
  type_demande: string;
  agent: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  carte_consulaire: 'Carte consulaire',
  laissez_passer: 'Laissez-passer',
};

/**
 * Reçu imprimable pour un paiement au guichet. Pas de PDF côté serveur :
 * la mise en page est faite ici et imprimée avec window.print() — la
 * classe `print-recu` (voir index.css) masque tout le reste de la page
 * pendant l'impression, pour n'imprimer que le reçu lui-même.
 */
export function RecuPaiement({ paiementId, onClose }: { paiementId: number; onClose: () => void }) {
  const [recu, setRecu] = useState<RecuData | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    api
      .get<RecuData>(`/v1/admin/paiements/${paiementId}`)
      .then((r) => !annule && setRecu(r))
      .catch((err) => !annule && setErreur(err instanceof ApiError ? err.message : 'Impossible de charger le reçu.'));
    return () => {
      annule = true;
    };
  }, [paiementId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogTitle className="sr-only">Reçu de paiement</DialogTitle>
        {!recu ? (
          <div className="flex justify-center py-14 text-slate-400">
            {erreur ? <p className="text-sm text-brand-red-600 px-6 text-center">{erreur}</p> : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
        ) : (
          <>
            <div id="recu-imprimable" className="print-recu p-6 text-sm">
              <div className="text-center mb-4">
                <p className="font-bold text-slate-900">Consulat Honoraire de la République du Congo au Bénin</p>
                <p className="text-slate-500 text-xs mt-0.5">Reçu de paiement</p>
              </div>
              <div className="border-y border-slate-200 py-3 space-y-1.5">
                <Ligne label="N° de reçu" valeur={recu.numero_recu} />
                <Ligne label="Date" valeur={recu.date_encaissement} />
                <Ligne label="Dossier" valeur={recu.numero_dossier} />
                <Ligne label="Nature" valeur={TYPE_LABEL[recu.type_demande] ?? recu.type_demande} />
                {recu.nom_payeur && <Ligne label="Payeur" valeur={recu.nom_payeur} />}
                <Ligne label="Mode" valeur={recu.mode_label} />
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="font-bold text-slate-900">Montant</span>
                <span className="font-bold text-lg text-slate-900">
                  {recu.montant.toLocaleString('fr-FR')} {recu.devise}
                </span>
              </div>
              {recu.agent && <p className="text-xs text-slate-400 mt-4">Encaissé par {recu.agent}</p>}
            </div>
            <div className="flex gap-2 p-4 pt-0 print:hidden">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                <X className="w-4 h-4 mr-2" /> Fermer
              </Button>
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Imprimer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{valeur}</span>
    </div>
  );
}
