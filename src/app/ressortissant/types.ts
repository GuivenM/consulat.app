export type TypeDemande = 'carte_consulaire' | 'laissez_passer';
export type DelaiDemande = '3_jours' | '24h' | 'meme_jour';
export type StatutDemande = 'recu' | 'en_traitement' | 'pret' | 'retire' | 'rejete';
export type StatutDocument = 'en_attente' | 'valide' | 'rejete';

export interface DemandeDocument {
  id: number;
  code_document: string;
  label: string;
  nom_original: string;
  statut: StatutDocument;
  statut_label: string;
  motif_rejet: string | null;
  created_at: string;
}

export interface Demande {
  id: number;
  numero_dossier: string;
  type: TypeDemande;
  delai: DelaiDemande;
  delai_label: string;
  statut: StatutDemande;
  statut_label: string;
  motif_rejet: string | null;
  montant: number;
  devise: string;
  paiement_statut: 'en_attente' | 'paye';
  documents_complets: boolean;
  date_depot: string | null;
  date_disponibilite_prevue: string | null;
  date_pret: string | null;
  date_retrait: string | null;
  donnees_specifiques?: Record<string, unknown>;
  documents?: DemandeDocument[];
}

export interface TarifConfiguration {
  delai: DelaiDemande;
  delai_label: string;
  montant: number;
  devise: string;
}

export interface DocumentRequisConfiguration {
  code_document: string;
  label: string;
  aide: string | null;
  nombre_requis: number;
  formats_acceptes: string[];
  taille_max_ko: number;
  obligatoire: boolean;
}

export interface DemandeConfiguration {
  type: TypeDemande;
  tarifs: TarifConfiguration[];
  documents_requis: DocumentRequisConfiguration[];
}
