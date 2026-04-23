export type UserRole = 'admin' | 'locataire' | 'candidat'

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  telephone: string
  date_naissance?: string
  role: UserRole
  created_at: string
}

export interface Logement {
  id: string
  adresse: string
  ville: string
  cp: string
  surface: number
  nb_pieces: number
  etage?: number
  loyer_hc: number
  charges: number
  description?: string
  actif: boolean
  created_at: string
}

export type StatutBail = 'en_attente' | 'signe' | 'resilie' | 'archive'

export interface Bail {
  id: string
  user_id: string
  logement_id: string
  date_debut: string
  date_fin?: string
  loyer_hc: number
  charges: number
  depot_garantie: number
  statut_signature: StatutBail
  date_signature?: string
  lien_bail_url?: string
  created_at: string
  user?: User
  logement?: Logement
}

export type StatutLoyer = 'en_attente' | 'paye' | 'retard'

export interface Loyer {
  id: string
  bail_id: string
  mois: number
  annee: number
  montant: number
  charges: number
  statut: StatutLoyer
  date_paiement?: string
  created_at: string
  bail?: Bail
}

export type TypeDocument =
  | 'identite'
  | 'bulletin_salaire'
  | 'avis_imposition'
  | 'justificatif_domicile'
  | 'contrat_travail'
  | 'bail'
  | 'quittance'
  | 'autre'

export interface Document {
  id: string
  user_id: string
  nom: string
  type: TypeDocument
  url: string
  taille?: number
  date_upload: string
  bail_id?: string
}

export type StatutCandidature =
  | 'incomplet'
  | 'en_analyse'
  | 'accepte'
  | 'refuse'
  | 'signe'

export interface Candidature {
  id: string
  logement_id: string | null
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance?: string
  situation?: string
  revenus: number
  type_contrat?: string
  employeur?: string
  statut: StatutCandidature
  ordre_priorite: number
  garant_nom?: string
  garant_prenom?: string
  garant_email?: string
  garant_revenus?: number
  documents_urls?: string[]
  created_at: string
  logement?: Logement
}

export type StatutDemande = 'ouvert' | 'en_cours' | 'resolu' | 'ferme'
export type CategorieDemande =
  | 'reparation'
  | 'plomberie'
  | 'electricite'
  | 'serrurerie'
  | 'autre'

export interface Demande {
  id: string
  user_id: string
  titre: string
  description: string
  categorie: CategorieDemande
  statut: StatutDemande
  date_creation: string
  date_resolution?: string
  photos_urls?: string[]
  user?: User
}

export interface Message {
  id: string
  user_id: string
  expediteur: 'locataire' | 'admin'
  contenu: string
  date_envoi: string
  lu: boolean
  demande_id?: string
}

export interface EmailTemplate {
  id: string
  nom: string
  cle: EmailTemplateCle
  objet: string
  contenu: string
  variables: string[]
  updated_at: string
}

export type EmailTemplateCle =
  | 'confirmation_reception'
  | 'dossier_incomplet'
  | 'acceptation_candidature'
  | 'ouverture_espace_locataire'
  | 'rappel_bail_non_signe'
  | 'quittance_disponible'
  | 'rappel_echeance_loyer'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface StepInfo {
  id: number
  label: string
  description: string
}

export interface StatCardData {
  label: string
  value: string | number
  icon: string
  trend?: {
    value: number
    positive: boolean
  }
  color?: 'blue' | 'orange' | 'green' | 'red'
}
