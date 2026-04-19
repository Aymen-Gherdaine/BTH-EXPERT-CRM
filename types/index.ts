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
