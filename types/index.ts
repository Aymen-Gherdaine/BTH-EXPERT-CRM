export type UserRole = 'admin' | 'charge_projet' | 'commercial';

export type TitreContact = "M." | "Mme" | "Dr." | "Pr.";

export type TypeEtude =
  | "EIE+Dangers"
  | "Notice+ProduitsDangereux"
  | "Audit"
  | "Autre";

export type StatutSoumission =
  | "Brouillon"
  | "Envoyée"
  | "Acceptée"
  | "Refusée";

export interface Client {
  id: string;
  titre: TitreContact;
  nom_contact: string;
  poste: string;
  entreprise: string;
  adresse: string;
  ville: string;
  created_at: string;
}

export interface LigneBudget {
  id?: string;
  soumission_id?: string;
  numero: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  ordre: number;
}

export interface Soumission {
  id: string;
  numero_offre: string;
  date_offre: string;
  client_id: string;
  client?: Client;
  titre_projet: string;
  secteur_activite: string;
  description_projet: string;
  type_etude: TypeEtude;
  delai_jours: number;
  total_ht: number;
  tva: number;
  total_ttc: number;
  statut: StatutSoumission;
  contexte_genere: string;
  created_at: string;
  lignes_budget?: LigneBudget[];
}

export interface FormDataStep1 {
  titre: TitreContact;
  nom_contact: string;
  poste: string;
  entreprise: string;
  adresse: string;
  ville: string;
}

export interface FormDataStep2 {
  titre_projet: string;
  secteur_activite: string;
  description_projet: string;
  type_etude: TypeEtude;
  delai_jours: number;
}

export interface FormDataStep3 {
  lignes: LigneBudget[];
}

export interface FormDataComplete {
  step1: FormDataStep1;
  step2: FormDataStep2;
  step3: FormDataStep3;
  contexte_genere?: string;
}

export interface DashboardStats {
  soumissions_mois: number;
  total_mandats_acceptes: number;
  taux_acceptation: number;
  montant_total_mois: number;
}

export type StatutProspect = 'actif' | 'sans_suite' | 'converti';
export type ResultatVisite =
  | 'soumission_demandee'
  | 'rappel_planifie'
  | 'pas_interesse'
  | 'absent'
  | 'autre';

export interface Visite {
  id: string;
  prospect_id: string;
  date_visite: string;
  resultat: ResultatVisite;
  notes_visite: string | null;
  date_prochaine_action: string | null;
  action_requise: string | null;
  commercial_id: string;
  created_at: string;
}

export interface Prospect {
  id: string;
  entreprise: string;
  secteur_activite: string;
  nom_contact: string;
  poste_contact: string;
  telephone: string;
  email: string | null;
  adresse: string;
  notes_generales: string | null;
  statut_global: StatutProspect;
  created_by: string;
  created_at: string;
  updated_at: string;
  visites?: Visite[];
}

export type CategorieDepense =
  | 'mission'
  | 'vehicule'
  | 'repas'
  | 'materiel'
  | 'communication'
  | 'autre';

export interface Depense {
  id: string;
  employe_id: string;
  categorie: CategorieDepense;
  montant: number;
  description: string | null;
  date_depense: string;
  justificatif_url: string | null;
  projet_lie: string | null;
  created_at: string;
}
