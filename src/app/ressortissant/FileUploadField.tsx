import React, { useRef, useState } from 'react';
import { Loader2, Upload, CheckCircle2, XCircle, Trash2, FileText } from 'lucide-react';
import { ressortissantApi, ApiError } from '../../lib/ressortissantApi';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import type { DemandeDocument, DocumentRequisConfiguration } from './types';

interface FileUploadFieldProps {
  demandeId: number;
  config: DocumentRequisConfiguration;
  documents: DemandeDocument[];
  onChange: () => void;
}

export function FileUploadField({ demandeId, config, documents, onChange }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const existants = documents.filter((d) => d.code_document === config.code_document);
  const peutAjouterEncore = existants.length < config.nombre_requis
    || existants.some((d) => d.statut === 'rejete');

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('code_document', config.code_document);
      formData.append('fichier', file);
      await ressortissantApi.postForm(`/v1/ressortissant/demandes/${demandeId}/documents`, formData);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'envoi du fichier.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function supprimer(documentId: number) {
    try {
      await ressortissantApi.delete(`/v1/ressortissant/demandes/${demandeId}/documents/${documentId}`);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Échec de la suppression.');
    }
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-medium text-slate-800">
            {config.label} {config.obligatoire && <span className="text-brand-red-500">*</span>}
          </div>
          {config.aide && <p className="text-xs text-slate-400 mt-0.5">{config.aide}</p>}
          <p className="text-xs text-slate-400 mt-0.5">
            {config.formats_acceptes.join(', ').toUpperCase()} · max {Math.round(config.taille_max_ko / 1024)} Mo
            {config.nombre_requis > 1 && ` · ${config.nombre_requis} fichiers attendus`}
          </p>
        </div>
      </div>

      {existants.length > 0 && (
        <div className="space-y-2 mb-3">
          {existants.map((d) => (
            <div key={d.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 truncate">{d.nom_original}</span>
              {d.statut === 'valide' && <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0" />}
              {d.statut === 'rejete' && <XCircle className="w-4 h-4 text-brand-red-500 shrink-0" />}
              {d.statut === 'en_attente' && (
                <button type="button" onClick={() => supprimer(d.id)} title="Retirer">
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-brand-red-500 shrink-0" />
                </button>
              )}
            </div>
          ))}
          {existants.some((d) => d.statut === 'rejete' && d.motif_rejet) && (
            <p className="text-xs text-brand-red-600">
              Rejeté : {existants.find((d) => d.statut === 'rejete')?.motif_rejet}
            </p>
          )}
        </div>
      )}

      {peutAjouterEncore && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={config.formats_acceptes.map((f) => `.${f}`).join(',')}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Envoi…' : 'Choisir un fichier'}
          </Button>
        </>
      )}
    </div>
  );
}
