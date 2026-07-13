import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CategorieDepense } from "@/types";

/* ── types ──────────────────────────────────────────────────── */
export type SoumissionOption = {
  id: string;
  titre_projet: string;
  numero_offre: string;
};

export type FormState = {
  categorie: CategorieDepense | "";
  montant: string;
  description: string;
  date_depense: string;
  projet_lie: string;
};

export type CatConfig = {
  value: CategorieDepense;
  label: string;
  abbr: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
};

export type DepenseFormProps = {
  form: FormState;
  onChange: Dispatch<SetStateAction<FormState>>;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  photo: File | null;
  onPhoto: (file: File | null) => void;
  soumissions: SoumissionOption[];
  submitLabel: string;
};

/* ── constants ──────────────────────────────────────────────── */
export const CATEGORIES: CatConfig[] = [
  { value: "mission", label: "Mission", abbr: "MIS", bg: "#eef6fb", text: "#2b668b", dot: "#3a7ca5", border: "#bdd9ea" },
  { value: "vehicule", label: "Véhicule", abbr: "VEH", bg: "#fff7df", text: "#8b6a24", dot: "#C9A96E", border: "#f3dfa0" },
  { value: "repas", label: "Repas", abbr: "REP", bg: "#edf7ef", text: "#1f6b3a", dot: "#3a7a50", border: "#c1d9c6" },
  { value: "materiel", label: "Matériel", abbr: "MAT", bg: "#f5f0e8", text: "#635c54", dot: "#887f74", border: "#d0c9be" },
  { value: "communication", label: "Communication", abbr: "COM", bg: "#f2f7f3", text: "#2b5c3c", dot: "#5d9a6e", border: "#c1d9c6" },
  { value: "autre", label: "Autre", abbr: "AUT", bg: "#fbfaf7", text: "#635c54", dot: "#b0a898", border: "#e8e2d8" },
];

export const EMPTY_FORM: FormState = {
  categorie: "",
  montant: "",
  description: "",
  date_depense: new Date().toISOString().slice(0, 10),
  projet_lie: "",
};

export const I = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  edit: ["M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5", "M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash: ["M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7", "M10 11v6M14 11v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16"],
  paperclip: "M15.172 7l-6.586 6.586a2 2 0 1 0 2.828 2.828l6.414-6.586a4 4 0 0 0-5.656-5.656l-6.415 6.585a6 6 0 1 0 8.486 8.486L20.5 13",
  project: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8M8 17h5"],
};

/* ── helpers ────────────────────────────────────────────────── */
export function catCfg(cat: string): CatConfig {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatDateShort(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
  });
}

export function formatMontantCompact(amount: number) {
  return Math.round(amount).toLocaleString("fr-DZ");
}

export function projectLabel(project?: SoumissionOption) {
  if (!project) return null;
  return `${project.numero_offre} - ${project.titre_projet}`;
}
