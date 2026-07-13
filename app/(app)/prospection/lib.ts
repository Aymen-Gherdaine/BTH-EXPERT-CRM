import type { EtapeProspect, Prospect, StatutProspect, Visite } from "@/types";

/* ── types ──────────────────────────────────────────────────── */
export type Tab = "planning" | "kanban" | "tous";
export type Urgency = "retard" | "aujourd_hui" | "semaine" | "non_planifie";
export type SortCol = "date_visite" | "entreprise" | "resultat" | "date_action";
export type SortDir = "asc" | "desc";
export type ToastState = { message: string } | null;
export type LossReason =
  | "Budget insuffisant"
  | "Concurrent choisi"
  | "Projet annulé"
  | "À recontacter plus tard"
  | "Autre";
export type PendingLossMove = { prospectId: string } | null;

export type RCfg = { bg: string; text: string; dot: string; border: string };
export type EtapeCfg = {
  value: EtapeProspect;
  label: string;
  description: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
  width: number;
};
export type ProspectPatchPayload = {
  etape: EtapeProspect;
  statut_global?: StatutProspect;
  raison_perte?: string | null;
};

/* ── constants ──────────────────────────────────────────────── */
export const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee:    "Demande de soumission",
  rappel_planifie:        "À rappeler",
  visite_expert_demandee: "Visite expert demandée",
  pas_interesse:          "Pas intéressé",
  absent:                 "Absent",
  autre:                  "Autre",
};

export const RCFG: Record<string, RCfg> = {
  soumission_demandee:    { bg: "#f2f7f3", text: "#1f4429", dot: "#3a7a50", border: "#c1d9c6" },
  rappel_planifie:        { bg: "#fefaef", text: "#7c6238", dot: "#C9A96E", border: "#f3dfa0" },
  visite_expert_demandee: { bg: "#eef5f8", text: "#2f6689", dot: "#3a7ca5", border: "#cbdde8" },
  pas_interesse:          { bg: "#fff4f1", text: "#9c3c30", dot: "#c44a3a", border: "#efc8bf" },
  absent:                 { bg: "#fbf4e8", text: "#7c6238", dot: "#a8874e", border: "#ead7b3" },
  autre:                  { bg: "#f5f0e8", text: "#635c54", dot: "#887f74", border: "#d0c9be" },
};

export const KANBAN_ETAPES: EtapeCfg[] = [
  {
    value: "client_potentiel",
    label: "Client potentiel",
    description: "Pas encore contacté",
    bg: "#f5f0e8",
    text: "#635c54",
    dot: "#b0a898",
    border: "#d0c9be",
    width: 260,
  },
  {
    value: "contacte",
    label: "Contacté",
    description: "Premier contact fait",
    bg: "#eef5f8",
    text: "#2f6689",
    dot: "#3a7ca5",
    border: "#cbdde8",
    width: 260,
  },
  {
    value: "soumission_en_cours",
    label: "Soumission en cours",
    description: "Offre en préparation",
    bg: "#fefaef",
    text: "#7c6238",
    dot: "#C9A96E",
    border: "#f3dfa0",
    width: 260,
  },
  {
    value: "soumission_envoyee",
    label: "Soumission envoyée",
    description: "En attente de réponse",
    bg: "#f2f7f3",
    text: "#1f4429",
    dot: "#3a7a50",
    border: "#c1d9c6",
    width: 260,
  },
  {
    value: "gagne",
    label: "Gagné",
    description: "Mandat accepté",
    bg: "#ecfdf3",
    text: "#1f6f35",
    dot: "#2f8f46",
    border: "#badfc3",
    width: 220,
  },
  {
    value: "perdu",
    label: "Perdu",
    description: "Sans suite",
    bg: "#fff4f1",
    text: "#9c3c30",
    dot: "#c44a3a",
    border: "#efc8bf",
    width: 220,
  },
];

export const LOSS_REASONS: LossReason[] = [
  "Budget insuffisant",
  "Concurrent choisi",
  "Projet annulé",
  "À recontacter plus tard",
  "Autre",
];

const DEFAULT_ETAPE: EtapeProspect = "client_potentiel";

const LEGACY_STATUS_ETAPE: Record<StatutProspect, EtapeProspect> = {
  actif: "client_potentiel",
  converti: "gagne",
  sans_suite: "perdu",
};

const KNOWN_ETAPES = new Set<EtapeProspect>(KANBAN_ETAPES.map(e => e.value));

export const PAGE_SIZE = 15;

export const D = "1px solid #eee8df";
export const GRID = "64px minmax(210px, .9fr) minmax(260px, 1.5fr) minmax(160px, .75fr) minmax(138px, .65fr) minmax(185px, .75fr) minmax(170px, .8fr)";

const AV_COLORS = ["#1a2e1e", "#1f4429", "#3a7a50", "#3a7ca5", "#7c6238", "#45403a"];

/* ── helpers ────────────────────────────────────────────────── */
export function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function getLocalToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getLastVisite(p: Prospect): Visite | null {
  if (!p.visites?.length) return null;
  return [...p.visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

export function getDateAction(p: Prospect): Date | null {
  const v = getLastVisite(p);
  if (!v?.date_prochaine_action) return null;
  return parseLocalDate(v.date_prochaine_action);
}

export function isProspectOverdue(p: Prospect, today: Date): boolean {
  const d = getDateAction(p);
  return !!d && d < today;
}

function isEtapeProspect(value: string): value is EtapeProspect {
  return KNOWN_ETAPES.has(value as EtapeProspect);
}

export function getProspectEtape(p: Prospect): EtapeProspect {
  const etape = p.etape as EtapeProspect | undefined;
  if (etape && isEtapeProspect(etape)) return etape;
  return LEGACY_STATUS_ETAPE[p.statut_global] ?? DEFAULT_ETAPE;
}

export function getEtapeCfg(etape: EtapeProspect): EtapeCfg {
  return KANBAN_ETAPES.find(s => s.value === etape) ?? KANBAN_ETAPES[0];
}

export function prospectMatchesFilters(p: Prospect, query: string, resultat: string): boolean {
  const q = query.toLowerCase();
  const matchSearch = !q ||
    p.entreprise.toLowerCase().includes(q) ||
    p.nom_contact.toLowerCase().includes(q) ||
    p.secteur_activite.toLowerCase().includes(q);
  const matchResultat = !resultat || getLastVisite(p)?.resultat === resultat;
  return matchSearch && matchResultat;
}

export function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function prospectRef(i: number): string {
  return `#PR-${String(i + 1).padStart(3, "0")}`;
}

export async function exportProspects() {
  const res = await fetch("/api/prospects/export");
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospects_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function avColor(n: string) {
  return AV_COLORS[n.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
