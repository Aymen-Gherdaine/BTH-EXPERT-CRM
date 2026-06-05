import { StatutSoumission } from "@/types";
import { StCfg } from "./types";

export const CSS = `
  .sc { overflow-y:auto; scrollbar-width:thin; scrollbar-color:#C9A96E #f5f0e8; }
  .sc::-webkit-scrollbar { width:4px; }
  .sc::-webkit-scrollbar-thumb { background:#C9A96E; border-radius:9999px; }
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
  .card-hover { transition: transform 0.18s cubic-bezier(.2,0,0,1), box-shadow 0.18s cubic-bezier(.2,0,0,1), border-color 0.18s, background 0.18s; }
  .card-hover:hover { transform: translateY(-1px); box-shadow: 0 14px 36px rgba(26,46,30,0.08) !important; }
  .row-hover { transition: background 0.1s, box-shadow 0.1s; }
  .action-fade { opacity: 0; transition: opacity 0.15s; }
  tr:hover .action-fade, div:hover .action-fade { opacity: 1; }
  .submission-table-scroll { overflow:auto; scrollbar-width:thin; scrollbar-color:#C9A96E #f5f0e8; }
  .submission-table-scroll::-webkit-scrollbar { width:8px; height:8px; }
  .submission-table-scroll::-webkit-scrollbar-track { background:#f5f0e8; }
  .submission-table-scroll::-webkit-scrollbar-thumb { background:#C9A96E; border-radius:9999px; }
  @media (max-width: 639px) {
    .submission-page-shell { min-height: 100%; height: auto !important; }
    .submission-hero { padding: 16px 14px 14px !important; }
    .submission-hero-top { align-items: flex-start !important; gap: 12px !important; }
    .submission-hero-actions { flex-shrink: 0; }
    .submission-title { font-size: 23px !important; line-height: 1.08 !important; }
    .submission-kpis {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      overflow: visible;
      gap: 10px !important;
      padding: 2px 0 4px;
    }
    .submission-kpi {
      min-height: 72px;
      border-radius: 12px !important;
      padding: 11px 12px !important;
      display: grid !important;
      grid-template-columns: 16px minmax(0, 1fr);
      align-content: center;
      align-items: start !important;
      column-gap: 7px !important;
      row-gap: 7px;
      min-width: 0;
    }
    .submission-kpi:first-child { grid-column: 1 / -1; }
    .submission-kpi svg { margin-top: 1px; }
    .submission-kpi-label {
      display: block;
      font-size: 11px !important;
      line-height: 1.25;
      white-space: normal;
    }
    .submission-kpi-value {
      grid-column: 1 / -1;
      display: block;
      margin-top: 0;
      font-size: 12.5px !important;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .submission-tools {
      padding: 10px 14px 12px !important;
      gap: 8px !important;
      align-items: stretch !important;
    }
    .submission-search { flex-basis: 100%; min-width: 0 !important; order: 1; }
    .submission-filter-wrap { order: 2; }
    .submission-card-grid { gap: 12px !important; padding: 14px 14px 18px !important; }
    .submission-card {
      border-radius: 10px !important;
      box-shadow: 0 12px 30px rgba(26,46,30,.07) !important;
    }
    .submission-card-body { padding: 16px 14px 15px !important; }
    .submission-card-head { margin-bottom: 14px !important; }
    .submission-card-title {
      font-size: 14.5px !important;
      line-height: 1.32 !important;
      letter-spacing: 0 !important;
      margin-bottom: 9px !important;
    }
    .submission-card-desc {
      font-size: 13px !important;
      line-height: 1.5 !important;
      color: #6b6258 !important;
      margin-bottom: 12px !important;
    }
    .submission-sector {
      max-width: 100%;
      padding: 4px 10px !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .submission-card-meta {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center !important;
      gap: 10px !important;
      padding-top: 13px;
      border-top: 1px solid #f0ebe3;
    }
    .submission-card-client { min-width: 0; }
    .submission-card-client-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .submission-card-total { text-align: right !important; margin-top: 0 !important; width: auto !important; }
    .submission-card-total-row { justify-content: flex-end !important; white-space: nowrap; }
    .submission-card-total-value { font-size: 15.5px !important; }
    .submission-card-currency { font-size: 9.5px !important; }
    .submission-page-shell.has-mobile-pagination {
      padding-bottom: calc(62px + env(safe-area-inset-bottom));
    }
    .submission-pager {
      padding: 10px 14px calc(12px + env(safe-area-inset-bottom)) !important;
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(56px + env(safe-area-inset-bottom));
      z-index: 19;
      box-shadow: 0 -10px 28px rgba(26,46,30,.06);
    }
    .submission-detail-body { padding: 18px 16px calc(28px + env(safe-area-inset-bottom)) !important; }
    .submission-status-actions { flex-direction: column; }
    .submission-budget-row { display: grid !important; grid-template-columns: 18px minmax(0, 1fr); gap: 8px !important; }
    .submission-budget-amount { grid-column: 2; justify-self: start; }
    .submission-modal-actions { flex-direction: column-reverse; }
  }
`;

// Palette de marque — alignée sur dashboard STATUS_CLASSES (bth-info/success/error,
// tints ~12% sur blanc). Remplace les anciennes couleurs Tailwind froides hors-charte.
export const ST: Record<StatutSoumission, StCfg> = {
  Brouillon: { accent: "#887f74", bgBadge: "#f5f0e8", textBadge: "#635c54", dot: "#b0a898", border: "#e8e2d8" },
  Envoyée:   { accent: "#3a7ca5", bgBadge: "#eaf2f7", textBadge: "#3a7ca5", dot: "#3a7ca5", border: "#d3e3ee" },
  Acceptée:  { accent: "#3a7a50", bgBadge: "#eaf3ed", textBadge: "#3a7a50", dot: "#3a7a50", border: "#d2e4d8" },
  Refusée:   { accent: "#c44a3a", bgBadge: "#f9eeec", textBadge: "#c44a3a", dot: "#c44a3a", border: "#f0d3ce" },
};

export const NEXT_ST: Record<StatutSoumission, StatutSoumission[]> = {
  Brouillon: ["Envoyée"],
  Envoyée:   ["Acceptée", "Refusée", "Brouillon"],
  Acceptée:  ["Envoyée"],
  Refusée:   ["Envoyée"],
};

export const I = {
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  x:       "M18 6L6 18M6 6l12 12",
  plus:    "M12 5v14M5 12h14",
  chevR:   "M9 18l6-6-6-6",
  chevL:   "M15 18l-6-6 6-6",
  chevD:   "M6 9l6 6 6-6",
  sortU:   "M18 15l-6-6-6 6",
  sortD:   "M6 9l6 6 6-6",
  filter:  "M4 6h16M7 12h10M10 18h4",
  cards:   ["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"] as string[],
  table:   ["M3 5h18M3 10h18M3 15h18M3 20h18"] as string[],
  file:    ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6"] as string[],
  check:   "M20 6L9 17l-5-5",
  trash:   ["M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"] as string[],
  wallet:  ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M1 10h22"] as string[],
  trend:   ["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"] as string[],
  eye:     ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"] as string[],
  copy:    ["M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"] as string[],
  excel:   ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M8 13h2m4 0h2M8 17h8"] as string[],
};

export const fmtInt = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const btnStyle = {
  width: 30, height: 30, borderRadius: 9999,
  border: "1px solid #e8e2d8",
  background: "#fffdfa",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#374151", cursor: "pointer",
} as const;
