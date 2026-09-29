import { useEffect, useState } from 'react';
import { Loader2, Wallet, Printer } from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface LignePaiement {
  id: number;
  heure: string;
  numero_recu: string;
  numero_dossier: string;
  ressortissant: string;
  mode: string;
  mode_label: string;
  montant: number;
  agent: string;
}

interface Recapitulatif {
  date: string;
  paiements: LignePaiement[];
  par_mode: Record<string, { nombre: number; total: number }>;
  total: number;
  devise: string;
}

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Clôture de caisse : les encaissements au guichet d'une journée, avec le
 * total par mode de paiement. Un agent ne voit que ses propres
 * encaissements (l'API impose déjà ce filtre côté serveur, indépendamment
 * de ce que cet écran affiche) ; un admin voit tout le monde.
 */
export function AdminCaisse() {
  const { user } = useAuth();
  const [date, setDate] = useState(aujourdhui());
  const [data, setData] = useState<Recapitulatif | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function load() {
    setData(null);
    try {
      const res = await api.get<Recapitulatif>(`/v1/admin/paiements/recapitulatif?date=${date}`);
      setData(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger le récapitulatif.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-slate-400" /> Caisse
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === 'agent' ? 'Vos encaissements au guichet, par journée.' : 'Encaissements au guichet, par journée.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px]" />
          <Button variant="outline" onClick={() => window.print()} disabled={!data || data.paiements.length === 0}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="print-recap">
          <div className="hidden print:block mb-4">
            <p className="font-bold text-slate-900">Consulat Honoraire de la République du Congo au Bénin</p>
            <p className="text-sm text-slate-500">
              Récapitulatif de caisse — {new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {data.paiements.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100 print:border-0 print:bg-transparent">
              Aucun encaissement ce jour-là.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden print:border-0 print:rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Heure</TableHead>
                      <TableHead>Reçu</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Ressortissant</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="print:hidden">Agent</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paiements.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-slate-500">{p.heure}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{p.numero_recu}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{p.numero_dossier}</TableCell>
                        <TableCell className="text-slate-800">{p.ressortissant}</TableCell>
                        <TableCell className="text-slate-600">{p.mode_label}</TableCell>
                        <TableCell className="text-slate-500 print:hidden">{p.agent}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {p.montant.toLocaleString('fr-FR')} {data.devise}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 justify-between items-start">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(data.par_mode).map(([mode, v]) => (
                    <div key={mode} className="text-sm">
                      <div className="text-slate-400">{data.paiements.find((p) => p.mode === mode)?.mode_label ?? mode}</div>
                      <div className="font-medium text-slate-800">
                        {v.total.toLocaleString('fr-FR')} {data.devise}
                        <span className="text-slate-400 font-normal"> ({v.nombre})</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-sm">Total du jour</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {data.total.toLocaleString('fr-FR')} {data.devise}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
