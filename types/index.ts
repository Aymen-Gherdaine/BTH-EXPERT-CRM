export type UserRole = 'admin' | 'charge_projet' | 'commercial';

export type TitreContact = "M." | "Mme" | "Dr." | "Pr.";

export type TypeEtude =
  | "EIE+Dangers"
  | "Notice+ProduitsDangereux"
  | "Audit"
  | "Audit+RapportProduits"
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
  groupe: string;
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
  versement_recu: number;
  statut: StatutSoumission;
  // Optionnel : présent uniquement sur la page détail (GET /api/soumissions/[id]).
  // Les vues LISTE l'excluent volontairement du select (payload) — voir
  // SOUMISSION_LIST_SELECT dans lib/queries.ts.
  contexte_genere?: string;
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
  nombre_mandats_acceptes: number;
  total_mandats_acceptes: number;
  taux_acceptation: number;
  total_versements_recus: number;
}

export type StatutProspect = 'actif' | 'sans_suite' | 'converti';
export type EtapeProspect =
  | 'client_potentiel'
  | 'contacte'
  | 'soumission_en_cours'
  | 'soumission_envoyee'
  | 'gagne'
  | 'perdu';
export type ResultatVisite =
  | 'soumission_demandee'
  | 'rappel_planifie'
  | 'visite_expert_demandee'
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
  etape: EtapeProspect;
  raison_perte: string | null;
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

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

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

export type EditablePreview = {
  // Client info
  titre: string;
  nom_contact: string;
  poste_contact: string;
  entreprise: string;
  adresse: string;
  ville: string;
  // Offer info
  numero_offre: string;
  date_offre: string;
  titre_projet: string;
  // Intro paragraph (editable, preview-only — template constructs its own)
  intro_paragraphe: string;
  // AI sections
  contexte_paragraphe_1: string;
  contexte_paragraphe_2: string;
  objectif_1: string;
  objectif_2: string;
  objectif_3: string;
  objectif_4: string;
  livrable_1: string;
  livrable_2: string;
  livrable_3: string;
  hypothese_specifique: string;
  description_echeancier: string;
  inclusions_specifiques: string;
  exclusions_specifiques: string;
  // Budget lines (editable, replaces step3.lignes as source of truth)
  lignes_budget: LigneBudget[];
  callout_objectif?: string | null;
  perimetre_items?: Array<{ item: string }> | null;
};
