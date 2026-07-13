import type { Client, Soumission, StatutSoumission } from "@/types";

/* ── types ──────────────────────────────────────────────── */
export interface ClientWithSoumissions extends Client {
  soumissions?: Soumission[];
}

export type ApiListResponse<T> = { data?: T[] };
export type ClientsPageResponse = { data?: ClientWithSoumissions[]; total?: number; cityCount?: number };

export type StCfg = { dot: string; bgBadge: string; textBadge: string; border: string; accentBar: string };

export interface DeleteState { open: boolean; id: string; label: string }
export const D0: DeleteState = { open: false, id: "", label: "" };

/* ── grid / border constants ────────────────────────────── */
export const SOUM_GRID = "130px 1fr 110px 60px 140px";
export const SOUM_D    = "1px solid #f0ebe3";
export const SOUM_HD   = "1px solid #e8e2d8";

export const CT_GRID = "220px 1fr 120px 130px 88px";
export const CT_D    = "1px solid #f0ebe3";
export const CT_HD   = "1px solid #e8e2d8";

/* ── status config ──────────────────────────────────────── */
// Palette de marque — alignée sur les statuts soumissions (constants.ts ST) et le dashboard.
export const ST: Record<StatutSoumission, StCfg> = {
  Brouillon: { dot: "#b0a898", bgBadge: "#f5f0e8", textBadge: "#635c54", border: "#e8e2d8", accentBar: "#b0a898" },
  Envoyée:   { dot: "#3a7ca5", bgBadge: "#eaf2f7", textBadge: "#3a7ca5", border: "#d3e3ee", accentBar: "#3a7ca5" },
  Acceptée:  { dot: "#3a7a50", bgBadge: "#eaf3ed", textBadge: "#3a7a50", border: "#d2e4d8", accentBar: "#3a7a50" },
  Refusée:   { dot: "#c44a3a", bgBadge: "#f9eeec", textBadge: "#c44a3a", border: "#f0d3ce", accentBar: "#c44a3a" },
};

/* ── icon paths ─────────────────────────────────────────── */
export const I = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  x:        "M18 6L6 18M6 6l12 12",
  chevD:    "M6 9l6 6 6-6",
  chevL:    "M15 18l-6-6 6-6",
  chevR:    "M9 18l6-6-6-6",
  trash:    ["M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"] as string[],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] as string[],
  user:     ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"] as string[],
  file:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"] as string[],
  mapPin:   ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", "M12 7a3 3 0 100 6 3 3 0 000-6z"] as string[],
  calendar: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"] as string[],
  building: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"] as string[],
};

/* ── helpers ────────────────────────────────────────────── */
export function fmtInt(n: number) {
  return Math.round(n).toLocaleString("fr-DZ", { maximumFractionDigits: 0 });
}

const AVATAR_COLORS = ["#1a2e1e", "#2d5a3d", "#1a3a4e", "#3d6b4f", "#4a3a1e", "#2a4a3e", "#3a2e4e"];
const aCache: Record<string, string> = {};
export function aColor(n: string) {
  if (aCache[n]) return aCache[n];
  const h = n.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (aCache[n] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}
