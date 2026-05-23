export const DARK_BLUE = "#192D38";
export const MID_BLUE = "#3C7C95";
export const LIGHT_BLUE = "#72AFC7";
export const BTH_GREEN = "var(--color-bth-green-800)";

export const SECTION_ENTITY = {
  destinataire: "client",
  objet: "soumission",
  intro: "local",
  contexte: "ai",
  objectifs: "ai",
  livrables: "ai",
  hypotheses: "ai",
  echeancier: "ai",
  perimetre: "ai",
  budget: "budget",
} as const;

export type SectionId = keyof typeof SECTION_ENTITY;

export const AI_SECTIONS: SectionId[] = [
  "contexte",
  "objectifs",
  "livrables",
  "hypotheses",
  "echeancier",
  "perimetre",
];
