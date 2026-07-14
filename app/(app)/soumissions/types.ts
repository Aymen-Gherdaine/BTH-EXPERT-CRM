import { Soumission, StatutSoumission, UserRole } from "@/types";

export type StCfg = {
  accent: string;
  bgBadge: string;
  textBadge: string;
  dot: string;
  border: string;
};

export type SoumissionView = Soumission & { _cn: string; _contact: string };
export type ApiListResponse<T> = { data?: T[] };
export type MeResponse = { role?: UserRole };

// KPIs globaux renvoyés par le serveur (mode paginé). `totalTTC`/`totalVerse`
// sont `null` pour un commercial (montants masqués).
export type SoumissionKpis = {
  counts: Partial<Record<StatutSoumission, number>>;
  totalTTC: number | null;
  totalVerse: number | null;
};

// Réponse paginée de GET /api/soumissions?page=…
export type SoumissionsPage = {
  data: Soumission[];
  total: number;
  kpis: SoumissionKpis;
};
export type SortCol =
  | "numero_offre"
  | "client"
  | "titre_projet"
  | "statut"
  | "total_ttc"
  | "date_offre";

export interface VersementState {
  open: boolean;
  id: string;
  titre: string;
  ttc: number;
  current: number;
}
export const V0: VersementState = { open: false, id: "", titre: "", ttc: 0, current: 0 };

export interface DeleteState {
  open: boolean;
  id: string;
  label: string;
}
export const D0: DeleteState = { open: false, id: "", label: "" };
