export type StatutAdhesion = 'en_attente' | 'approuvee' | 'rejetee';

export interface Adhesion {
  id: number;
  // Nationalité & pièces
  nationalite: string;
  est_congolais: boolean;
  possede_carte_consulaire: boolean | null;
  carte_consulaire_fichier: string | null;
  carte_consulaire_fichier_url: string | null;
  duree_au_benin: string | null;
  possede_cipr: boolean | null;
  cipr_fichier: string | null;
  cipr_fichier_url: string | null;
  // Identité & état civil
  nom: string;
  prenom: string;
  nom_marital: string | null;
  sexe: 'masculin' | 'feminin' | null;
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  ville: string;
  situation_matrimoniale: 'marie' | 'divorce' | 'union_libre' | 'celibataire' | 'veuf' | null;
  nombre_enfants_charge: number | null;
  photo: string | null;
  photo_url: string | null;
  // Coordonnées
  email: string;
  telephone: string;
  autre_telephone: string | null;
  // Statut professionnel
  profession: string;
  profession_autre: string | null;
  niveau_etude: string;
  niveau_etude_autre: string | null;
  dernier_diplome: string | null;
  dernier_diplome_autre: string | null;
  // Entrepreneur
  entrepreneur_domaine: string | null;
  entrepreneur_domaine_autre: string | null;
  entrepreneur_duree: string | null;
  entrepreneur_nom_entreprise: string | null;
  entrepreneur_fonction: string | null;
  // Étudiant
  etablissement: string | null;
  etudiant_filiere: string | null;
  etudiant_annee: string | null;
  // Compétences, intérêts, langues
  competences: string[] | null;
  competences_autre: string | null;
  centres_interet: string[] | null;
  domaines_interet_autre: string | null;
  loisirs: string[] | null;
  loisirs_autre: string | null;
  disponibilite: string | null;
  langues: string[] | null;
  // Engagement associatif
  comment_connu: string | null;
  comment_connu_autre: string | null;
  recommande_par: string | null;
  motivation: string | null;
  experience_associative: boolean | null;
  experience_associative_details: string | null;
  commissions_souhaitees: string[] | null;
  attentes: string | null;
  // Déclaration
  declarant_nom_complet: string | null;
  accepte_conditions: boolean;
  souhaite_recevoir_actualites: boolean | null;
  lettre_demande_fichiers: string[] | null;
  lettre_demande_fichiers_urls: string[] | null;
  // Divers / traitement
  commentaire: string | null;
  statut: StatutAdhesion;
  date_traitement: string | null;
  commentaire_traitement: string | null;
  traite_par: number | null;
  created_at: string;
  updated_at: string;
}

export type StatutCotisation = 'payee' | 'impayee' | 'anterieure_adhesion';
export type ModePaiement = 'especes' | 'mobile_money' | 'virement' | 'autre';

export interface CotisationMembre {
  membre_id: number;
  nom_complet: string;
  photo_url: string | null;
  ville: string | null;
  mois: string;
  cotisation_id: number | null;
  montant: number | null;
  statut: StatutCotisation;
  date_paiement: string | null;
  mode_paiement: ModePaiement | null;
  commentaire: string | null;
}

export interface CotisationStats {
  mois: string;
  nb_membres: number;
  nb_payees: number;
  nb_impayees: number;
  taux_a_jour: number;
  montant_collecte: number;
  montant_attendu: number;
}

export interface CotisationHistoriqueEntry {
  mois: string;
  statut: StatutCotisation;
  date_paiement: string | null;
  montant: number | null;
}

export type StatutEvenement = 'publie' | 'brouillon' | 'annule';

export interface Evenement {
  id: number;
  titre: string;
  description: string | null;
  contenu: string | null;
  image: string | null;
  image_url: string | null;
  date_debut: string;
  date_fin: string;
  heure_debut: string | null;
  heure_fin: string | null;
  lieu: string | null;
  adresse: string | null;
  ville: string | null;
  type: string | null;
  categorie: string | null;
  capacite_max: number | null;
  nombre_inscrits: number;
  prix: number | null;
  devise: string | null;
  lien_billet: string | null;
  organisateur: string | null;
  contact_organisateur: string | null;
  email_contact: string | null;
  telephone_contact: string | null;
  statut: StatutEvenement;
  statut_evenement: 'passé' | 'à_venir' | 'en_cours';
  created_at: string;
  updated_at: string;
}

export type StatutActualite = 'publie' | 'brouillon';
export type TypeActualite = 'actualite' | 'evenement' | 'education' | 'culture';

export interface ActualitePhoto {
  id: number;
  url: string;
}

export interface Actualite {
  id: number;
  titre: string;
  slug: string;
  description: string;
  contenu: string;
  image: string | null;
  image_url: string | null;
  photos: ActualitePhoto[];
  photos_urls: string[];
  type: TypeActualite;
  type_label: string;
  date_evenement: string | null;
  lieu_evenement: string | null;
  auteur: string;
  statut: StatutActualite;
  facebook_post_url: string | null;
  lien_public: string;
  created_at: string;
  updated_at: string;
}

export type StatutGuide = 'publie' | 'brouillon';

export interface GuideDocument {
  id: number;
  sous_section_id: number;
  titre: string;
  description: string | null;
  fichier: string;
  fichier_url: string;
  type_fichier: string;
  taille: number;
  taille_formatee: string;
  telechargements: number;
  statut: StatutGuide;
}

export interface GuideSousSection {
  id: number;
  section_id: number;
  titre: string;
  contenu: string | null;
  image: string | null;
  image_url: string | null;
  ordre: number;
  statut: StatutGuide;
  documents: GuideDocument[];
}

export interface GuideSection {
  id: number;
  titre: string;
  description: string | null;
  categorie: string | null;
  contenu: string | null;
  image: string | null;
  image_url: string | null;
  icone: string | null;
  icone_url: string | null;
  ordre: number;
  statut: StatutGuide;
  sous_sections: GuideSousSection[];
}

export type StatutPartenaire = 'actif' | 'inactif';
export type TypePartenaire = 'institution' | 'ong' | 'entreprise' | 'media' | 'universite' | 'association';
export type NiveauPartenariat = 'or' | 'argent' | 'bronze' | 'institutionnel' | 'technique';

export interface Partenaire {
  id: number;
  nom: string;
  description: string | null;
  logo: string | null;
  logo_url: string | null;
  site_web: string | null;
  type: TypePartenaire | null;
  type_label: string | null;
  secteur_activite: string | null;
  pays: string | null;
  ville: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  date_debut_partenariat: string | null;
  date_fin_partenariat: string | null;
  niveau_partenariat: NiveauPartenariat | null;
  niveau_label: string | null;
  statut: StatutPartenaire;
  created_at: string;
  updated_at: string;
}

export type StatutAction = 'actif' | 'inactif' | 'a_venir' | 'termine';
export type SectionAction = 'solidarite' | 'education' | 'culture' | 'communication';

export interface Action {
  id: number;
  titre: string;
  description: string;
  section: SectionAction;
  section_label: string;
  image: string | null;
  image_url: string | null;
  date_debut: string | null;
  date_fin: string | null;
  date_evenement: string | null;
  lieu: string | null;
  objectifs: string[] | null;
  activites_cles: string[] | null;
  resultats: string[] | null;
  statut: StatutAction;
  statut_label: string;
  created_at: string;
  updated_at: string;
}

export type StatutMembre = 'actif' | 'inactif';

export interface Membre {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  photo: string | null;
  photo_url: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  whatsapp: string | null;
  ville: string | null;
  poste: string | null;
  commission: string | null;
  role: string;
  statut: StatutMembre;
  peut_avoir_acces_admin: boolean;
  a_compte_admin: boolean;
  created_at: string;
  updated_at: string;
}
export type ObjetMessage =
  | 'question'
  | 'partenariat'
  | 'adhesion'
  | 'urgence'
  | 'information'
  | 'reclamation'
  | 'autre';

export interface Message {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  objet: ObjetMessage;
  message: string;
  organisation: string | null;
  type_organisation: TypePartenaire | null;
  secteur_activite: string | null;
  pays: string | null;
  ville: string | null;
  site_web: string | null;
  reponse: string | null;
  date_reponse: string | null;
  statut: StatutMessage;
  lu_le: string | null;
  traite_par: number | null;
  partenaire_id: number | null;
  created_at: string;
  updated_at: string;
}

// ===== Registre consulaire (ressortissants) =====

export type StatutRessortissant = 'actif' | 'inactif' | 'suspendu';

export interface Ressortissant {
  id: number;
  numero_registre: string | null;
  nom: string;
  prenom: string;
  nom_complet: string;
  sexe: string | null;
  photo_url: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  ville: string | null;
  quartier: string | null;
  statut: StatutRessortissant;
  inscription_verifiee: boolean;
  created_at: string;
  // Champs additionnels renvoyés uniquement par la fiche détaillée (show)
  date_naissance?: string | null;
  lieu_naissance?: string | null;
  nationalite?: string | null;
  profession?: string | null;
  situation_matrimoniale?: string | null;
  type_piece?: string | null;
  numero_piece?: string | null;
  date_expiration_piece?: string | null;
  adresse?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  date_arrivee?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_telephone?: string | null;
  motif_inactivation?: string | null;
  derniere_connexion?: string | null;
  demandes?: RessortissantDemandeResume[];
}

export interface RessortissantDemandeResume {
  id: number;
  numero_dossier: string;
  type: string;
  statut: string;
  statut_label: string;
  date_depot: string | null;
}

// ===== Configuration : tarifs & pièces requises =====

export type DelaiDemande = '3_jours' | '24h' | 'meme_jour';

export interface Tarif {
  id: number;
  entity_id: number;
  type_demande: string;
  delai: DelaiDemande;
  montant: number;
  devise: string;
  delai_heures: number | null;
  est_actif: boolean;
}

export interface DocumentTypeRequis {
  id: number;
  entity_id: number;
  type_demande: string;
  code_document: string;
  label: string;
  aide: string | null;
  ordre: number;
  nombre_requis: number;
  formats_acceptes: string;
  taille_max_ko: number;
  obligatoire: boolean;
  est_actif: boolean;
}

// ===== Carte interactive (vue admin) =====

export interface QuartierAgregat {
  ville: string;
  quartier: string;
  total: number;
}

export interface PointCarte {
  id: number;
  nom_complet: string;
  ville: string | null;
  quartier: string | null;
  statut: StatutRessortissant;
  latitude: number;
  longitude: number;
}

export interface RessortissantStats {
  total: number;
  par_statut: Record<string, number>;
  par_ville: Record<string, number>;
}

// ===== Demandes (dépôt de dossier) =====

export type StatutDemande = 'recu' | 'en_traitement' | 'pret' | 'retire' | 'rejete';
export type StatutPaiementDemande = 'en_attente' | 'partiel' | 'paye';

export interface DemandeRessortissantResume {
  id: number;
  nom_complet: string;
  numero_registre: string | null;
  ville: string | null;
  quartier: string | null;
}

export interface Demande {
  id: number;
  numero_dossier: string;
  type: string;
  delai: DelaiDemande;
  delai_label: string;
  statut: StatutDemande;
  statut_label: string;
  motif_rejet: string | null;
  montant: number;
  devise: string;
  paiement_statut: StatutPaiementDemande;
  documents_complets: boolean;
  date_depot: string | null;
  date_disponibilite_prevue: string | null;
  date_pret: string | null;
  date_retrait: string | null;
  ressortissant: DemandeRessortissantResume | null;
  // Renvoyés uniquement par la fiche détaillée (show)
  donnees_specifiques?: Record<string, unknown> | null;
  note_interne?: string | null;
  traite_par?: string | null;
  documents?: DemandeDocumentAdmin[];
  paiements?: PaiementAdmin[];
}

export type ModeGuichet = 'especes' | 'mobile_money' | 'virement' | 'carte';

export interface PaiementAdmin {
  id: number;
  montant: number;
  devise: string;
  statut: string;
  canal: 'en_ligne' | 'guichet';
  canal_label: string;
  mode: ModeGuichet | null;
  mode_label: string | null;
  numero_recu: string | null;
  date_encaissement: string | null;
  created_at: string;
}

export interface DemandeDocumentAdmin {
  id: number;
  code_document: string;
  label: string;
  nom_original: string | null;
  fichier_url: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  statut_label: string;
  motif_rejet: string | null;
  verifie_par: string | null;
  verifie_at: string | null;
  created_at: string;
}
