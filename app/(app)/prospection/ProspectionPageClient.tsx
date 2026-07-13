"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import type { EtapeProspect, Prospect, StatutProspect, Visite } from "@/types";
import {
  KANBAN_ETAPES,
  LOSS_REASONS,
  RESULTAT_LABELS,
  exportProspects,
  getDateAction,
  getLastVisite,
  getLocalToday,
  getProspectEtape,
  parseLocalDate,
  prospectMatchesFilters,
  type LossReason,
  type PendingLossMove,
  type ProspectPatchPayload,
  type Tab,
  type ToastState,
} from "./lib";
import { PlanningSection } from "./views/PlanningView";

/* ── global CSS ─────────────────────────────────────────────── */
const CSS = `
  .prospection-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    background:
      linear-gradient(180deg, rgba(255,255,255,.72) 0%, rgba(250,248,245,.96) 42%),
      #faf8f5;
  }
  .prospection-header {
    flex-shrink: 0;
    padding: clamp(18px, 3vw, 28px) clamp(16px, 3vw, 32px) clamp(16px, 2vw, 22px);
    background: linear-gradient(180deg, #ffffff 0%, #fbfaf7 100%);
    border-bottom: 1px solid #e8e2d8;
  }
  .prospection-header-inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }
  .prospection-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #7c6238;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .28em;
    text-transform: uppercase;
  }
  .prospection-eyebrow::before {
    content: "";
    width: 26px;
    height: 1px;
    background: #C9A96E;
  }
  .prospection-title {
    margin: 0;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: clamp(26px, 3vw, 34px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0;
  }
  .prospection-subtitle {
    margin-top: 8px;
    color: #887f74;
    font-size: 13px;
    line-height: 1.45;
  }
  .prospection-urgent {
    margin-left: 8px;
    color: #c44a3a;
    font-weight: 700;
  }
  .prospection-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }
  .prospection-btn {
    height: 40px;
    padding: 0 14px;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color var(--bth-dur-fast) var(--bth-ease-micro), border-color var(--bth-dur-fast) var(--bth-ease-micro), transform var(--bth-dur-instant) var(--bth-ease-micro);
  }
  .prospection-btn-secondary {
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
  }
  .prospection-btn-primary {
    border: 1px solid #1a2e1e;
    background: #1a2e1e;
    color: #ffffff;
    box-shadow: 0 12px 26px rgba(26,46,30,.18);
  }
  .prospection-controls {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(210px, 250px) auto;
    gap: 12px;
    align-items: center;
    padding: 14px clamp(16px, 3vw, 32px);
    background: rgba(255,255,255,.82);
    border-bottom: 1px solid #e8e2d8;
    backdrop-filter: blur(12px);
  }
  .prospection-field,
  .prospection-select {
    height: 40px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #1a1714;
    font-size: 13px;
    outline: none;
    transition: border-color var(--bth-dur-fast) var(--bth-ease-micro), box-shadow var(--bth-dur-fast) var(--bth-ease-micro), background-color var(--bth-dur-fast) var(--bth-ease-micro);
  }
  .prospection-field:focus,
  .prospection-select:focus {
    border-color: #1a2e1e;
    box-shadow: 0 0 0 4px rgba(26,46,30,.10);
  }
  .prospection-tabs {
    display: inline-grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
    border: 1px solid #e8e2d8;
    border-radius: 9999px;
    background: #f5f0e8;
  }
  .prospection-tab {
    min-height: 32px;
    padding: 0 12px;
    border: 0;
    border-radius: 9999px;
    color: #635c54;
    background: transparent;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color var(--bth-dur-fast) var(--bth-ease-micro), color var(--bth-dur-fast) var(--bth-ease-micro);
  }
  .prospection-tab.is-active {
    background: #1a2e1e;
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(26,46,30,.14);
  }
  .sc { overflow-y:auto; scrollbar-width:thin; scrollbar-color:#d0c9be transparent; }
  .sc::-webkit-scrollbar { width:4px; }
  .sc::-webkit-scrollbar-thumb { background:#d0c9be; border-radius:4px; }
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
  .hist-row { cursor:pointer; transition: background-color var(--bth-dur-fast) var(--bth-ease-micro), box-shadow var(--bth-dur-fast) var(--bth-ease-micro); }
  .hist-row:hover { background:#fffdfa !important; box-shadow: inset 3px 0 0 #C9A96E; }
  .history-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin: clamp(14px, 2vw, 22px) clamp(16px, 3vw, 32px) clamp(18px, 3vw, 28px);
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e8e2d8;
    overflow: hidden;
    box-shadow: 0 18px 46px rgba(26,46,30,.07);
  }
  .history-card-scroll { flex: 1; overflow: auto; }
  .history-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 48px;
    border-top: 1px solid #e8e2d8;
    background: #fbfaf7;
    flex-shrink: 0;
  }
  .history-count {
    font-size: 12px;
    color: #887f74;
  }
  .history-pager {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-self: center;
  }
  .history-page-button {
    width: 30px;
    height: 30px;
    border-radius: 9999px;
    border: 1px solid #e8e2d8;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--bth-dur-fast) var(--bth-ease-micro), background-color var(--bth-dur-fast) var(--bth-ease-micro), transform var(--bth-dur-instant) var(--bth-ease-micro);
  }
  .history-page-label {
    min-width: 80px;
    text-align: center;
    user-select: none;
    font-size: 12px;
    color: #2e2a26;
    font-weight: 600;
  }
  .history-footer-spacer {
    min-width: 1px;
  }
  .plan-card { cursor:pointer; transition: transform var(--bth-dur-normal) var(--bth-ease-out), box-shadow var(--bth-dur-normal) var(--bth-ease-out), border-color var(--bth-dur-fast) var(--bth-ease-micro); }
  .plan-card:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(26,46,30,.10) !important; border-color:#d0c9be !important; }
  .planning-scroll { flex: 1; overflow-y: auto; padding: clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px) 32px; }
  .planning-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
  .planning-section {
    margin-bottom: 0;
    padding: 16px;
    border: 1px solid #e8e2d8;
    border-radius: 12px;
    background: rgba(255,255,255,.78);
    box-shadow: 0 10px 28px rgba(26,46,30,.045);
  }
  .kanban-shell {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px) 24px;
  }
  .kanban-board {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 14px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 18px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    cursor: grab;
    user-select: none;
  }
  .kanban-board.is-panning { cursor: grabbing; }
  .kanban-board::-webkit-scrollbar { display: none; }
  .kanban-column {
    flex: 0 0 var(--kanban-column-width, 260px);
    width: var(--kanban-column-width, 260px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #e8e2d8;
    border-radius: 12px;
    background: #faf8f5;
    overflow: hidden;
    transition: background-color 200ms var(--bth-ease-out), border-color 200ms var(--bth-ease-out), box-shadow 200ms var(--bth-ease-out);
  }
  .kanban-column.is-over {
    background: #f2f7f3;
    border: 1px dashed #3a7a50;
    box-shadow: 0 14px 32px rgba(26,46,30,.08);
  }
  .kanban-column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #e8e2d8;
    background: rgba(255,255,255,.74);
  }
  .kanban-column-title {
    margin: 0;
    color: #1a2e1e;
    font-size: 14px;
    font-weight: 500;
  }
  .kanban-column-description {
    margin-top: 1px;
    color: #887f74;
    font-size: 11px;
  }
  .kanban-column-list {
    flex: 1;
    min-height: 120px;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .kanban-add {
    min-height: 44px;
    margin: 10px;
    border-radius: 8px;
    border: 1px dashed #d0c9be;
    background: #ffffff;
    color: #635c54;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 150ms var(--bth-ease-micro), color 150ms var(--bth-ease-micro), border-color 150ms var(--bth-ease-micro);
  }
  .kanban-add:hover {
    background: #f2f7f3;
    color: #1a2e1e;
    border-color: #90bb9a;
  }
  .kanban-card {
    display: block;
    text-decoration: none;
    background: #ffffff;
    border: 1px solid #e8e2d8;
    border-left-width: 3px;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 8px 22px rgba(26,46,30,.055);
    cursor: grab;
    transition: transform 200ms ease-out, box-shadow 200ms ease-out, opacity 200ms ease-out;
  }
  .kanban-card:active { cursor: grabbing; }
  .kanban-card.is-dragging {
    opacity: .9;
    transform: scale(1.02);
    box-shadow: 0 16px 36px rgba(26,46,30,.14);
  }
  .kanban-note {
    margin-top: 8px;
    color: #635c54;
    font-size: 12px;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kanban-dots {
    display: none;
    justify-content: center;
    gap: 7px;
    padding-top: 10px;
  }
  .kanban-dot {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    border: 0;
    background: #d0c9be;
    cursor: pointer;
    transition: width 200ms var(--bth-ease-out), background-color 200ms var(--bth-ease-out);
  }
  .kanban-dot.is-active {
    width: 18px;
    background: #1a2e1e;
  }
  .prospection-toast {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 60;
    max-width: min(360px, calc(100vw - 32px));
    border-radius: 8px;
    background: #c44a3a;
    color: #ffffff;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 14px 34px rgba(26,46,30,.18);
  }
  .kanban-loss-popover {
    position: fixed;
    right: 18px;
    bottom: 78px;
    z-index: 70;
    width: min(320px, calc(100vw - 32px));
    border: 1px solid #e8e2d8;
    border-radius: 10px;
    background: #ffffff;
    padding: 14px;
    box-shadow: 0 18px 44px rgba(26,46,30,.16);
  }
  .kanban-loss-title {
    margin: 0 0 10px;
    color: #1a2e1e;
    font-size: 14px;
    font-weight: 650;
  }
  .kanban-loss-options {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .kanban-loss-option {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #45403a;
    font-size: 12px;
    font-weight: 500;
  }
  .kanban-loss-option input {
    accent-color: #1a2e1e;
  }
  .kanban-loss-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 13px;
  }
  .kanban-loss-btn {
    height: 32px;
    border-radius: 8px;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .kanban-loss-btn-secondary {
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
  }
  .kanban-loss-btn-primary {
    border: 1px solid #1a2e1e;
    background: #1a2e1e;
    color: #ffffff;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    text-align: center;
  }
  @media (min-width: 1100px) {
    .planning-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 860px) {
    .prospection-shell {
      height: auto;
      min-height: 100%;
      display: block;
    }
    .prospection-header {
      padding: 14px 14px 12px;
    }
    .prospection-header-inner { flex-direction: column; }
    .prospection-eyebrow {
      margin-bottom: 6px;
      font-size: 9px;
      gap: 8px;
    }
    .prospection-eyebrow::before { width: 22px; }
    .prospection-title {
      font-size: 24px;
      line-height: 1.04;
    }
    .prospection-subtitle {
      margin-top: 5px;
      font-size: 12.5px;
    }
    .prospection-actions {
      width: 100%;
      display: grid;
      grid-template-columns: minmax(86px, .34fr) minmax(0, 1fr);
      gap: 8px;
      margin-top: -2px;
    }
    .prospection-actions a, .prospection-actions button { flex: 1; }
    .prospection-btn {
      height: 36px;
      padding: 0 12px;
      font-size: 12.5px;
    }
    .prospection-btn-primary {
      box-shadow: 0 8px 18px rgba(26,46,30,.16);
    }
    .prospection-controls {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 12px 14px;
      background: #faf8f5;
      backdrop-filter: none;
    }
    .prospection-field,
    .prospection-select {
      height: 36px;
      font-size: 13px;
    }
    .prospection-tabs { width: 100%; }
    .prospection-tab { min-height: 34px; }
    .kanban-shell {
      flex: none;
      min-height: 0;
      padding: 12px 0 86px;
    }
    .kanban-board {
      flex: none;
      min-height: 520px;
      gap: 12px;
      padding: 0 12px 12px;
      scroll-snap-type: x mandatory;
      scroll-padding: 12px;
    }
    .kanban-column {
      flex-basis: calc(100vw - 24px);
      width: calc(100vw - 24px);
      --kanban-column-width: calc(100vw - 24px) !important;
      scroll-snap-align: center;
      max-height: none;
    }
    .kanban-dots {
      display: flex;
    }
    .kanban-loss-popover {
      right: 14px;
      bottom: 74px;
    }
    .history-shell {
      flex: none;
      min-height: 0;
      margin: 12px 14px 18px;
      overflow: visible;
    }
    .history-card-scroll {
      flex: none;
      overflow: visible;
    }
    .history-footer {
      grid-template-columns: 1fr auto;
      height: 46px;
      padding: 0 14px;
    }
    .history-pager {
      justify-self: end;
    }
    .history-footer-spacer {
      display: none;
    }
    .planning-scroll {
      flex: none;
      overflow: visible;
      padding: 12px 14px 86px;
    }
    .history-head { display: none !important; }
    .history-card-scroll { padding: 10px; background: #faf8f5; }
    .hist-row {
      display: block !important;
      min-height: 0 !important;
      margin-bottom: 12px;
      border: 1px solid #e8e2d8;
      border-radius: 14px;
      background: linear-gradient(180deg, #ffffff 0%, #fffdfa 100%);
      overflow: hidden;
      box-shadow: 0 12px 28px rgba(26,46,30,.06);
    }
    .hist-row > div { border-right: 0 !important; border-bottom: 0 !important; }
    .hist-icon { display: none !important; }
    .hist-enterprise {
      padding: 16px 16px 10px !important;
      align-items: flex-start !important;
      gap: 11px !important;
      background: #ffffff;
    }
    .hist-sector, .hist-contact, .hist-date, .hist-result, .hist-action {
      padding: 5px 16px !important;
      min-height: 0;
    }
    .hist-sector {
      display: block !important;
      padding-top: 0 !important;
    }
    .hist-contact {
      display: block !important;
    }
    .hist-date {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: baseline;
      gap: 10px;
      padding-top: 9px !important;
      margin: 4px 16px 0;
      padding-left: 0 !important;
      padding-right: 0 !important;
      border-top: 1px solid #f0ebe3;
    }
    .hist-result {
      display: flex !important;
      align-items: center !important;
      padding-top: 10px !important;
    }
    .hist-action {
      padding-bottom: 16px !important;
      display: block !important;
    }
    .plan-card { border-radius: 14px !important; padding: 15px !important; }
    .plan-main { gap: 10px !important; }
    .plan-top { display: block !important; }
    .plan-status { margin-top: 10px; flex-wrap: wrap; }
    .plan-contact { align-items: flex-start !important; line-height: 1.4; }
  }
  @media (max-width: 520px) {
    .prospection-title { font-size: 23px; }
    .prospection-actions { align-items: stretch; }
    .prospection-btn { width: 100%; }
    .prospection-tab { padding: 0 8px; font-size: 11.5px; }
    .prospection-controls {
      padding: 10px 12px;
    }
    .history-shell {
      margin: 10px 12px 18px;
      border-radius: 14px;
    }
    .history-card-scroll {
      padding: 10px;
    }
    .hist-enterprise,
    .hist-sector,
    .hist-contact,
    .hist-result,
    .hist-action {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }
    .hist-date {
      margin-left: 14px;
      margin-right: 14px;
    }
    .planning-scroll {
      padding-left: 12px;
      padding-right: 12px;
    }
    .planning-section {
      padding: 12px;
      border-radius: 14px;
    }
  }
`;

/* ── lazy views ────────────────────────────────────────────── */
function ViewLoading() {
  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="sk" style={{ height: 72, borderRadius: 14, background: "white", border: "1px solid #e5e7eb" }} />
      ))}
    </div>
  );
}

// Vues lourdes chargées à la demande : seule la vue de l'onglet actif est
// montée. Kanban embarque tout @dnd-kit ; Historique son tableau trié/paginé.
// Elles sortent donc du bundle initial de /prospection (onglet Planning par défaut).
const KanbanView = dynamic(
  () => import("./views/KanbanView").then((m) => m.KanbanView),
  { ssr: false, loading: ViewLoading }
);
const HistoryTable = dynamic(
  () => import("./views/HistoryView").then((m) => m.HistoryTable),
  { ssr: false, loading: ViewLoading }
);

function LossReasonPopover({ pending, reason, onReasonChange, onConfirm, onCancel }: {
  pending: PendingLossMove;
  reason: LossReason;
  onReasonChange: (reason: LossReason) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          className="kanban-loss-popover"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
        >
          <p className="kanban-loss-title">Raison de la perte ?</p>
          <div className="kanban-loss-options">
            {LOSS_REASONS.map((option) => (
              <label key={option} className="kanban-loss-option">
                <input
                  type="radio"
                  name="raison_perte"
                  checked={reason === option}
                  onChange={() => onReasonChange(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <div className="kanban-loss-actions">
            <button type="button" className="kanban-loss-btn kanban-loss-btn-secondary bth-focus" onClick={onCancel}>
              Annuler
            </button>
            <button type="button" className="kanban-loss-btn kanban-loss-btn-primary bth-focus" onClick={onConfirm}>
              Confirmer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProspectionPageClient({
  initialProspects = [],
  initialKanbanProspects = [],
}: {
  initialProspects?: Prospect[];
  initialKanbanProspects?: Prospect[];
}) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [kanbanProspects, setKanbanProspects] = useState<Prospect[]>(initialKanbanProspects);
  const hasInitialData = initialProspects.length > 0 || initialKanbanProspects.length > 0;
  const [loading, setLoading] = useState(!hasInitialData);
  const [tab, setTab] = useState<Tab>("planning");
  const [search, setSearch] = useState("");
  const [filterResultat, setFilterResultat] = useState("");
  const [histPage, setHistPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [kanbanIndex, setKanbanIndex] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingLossMove, setPendingLossMove] = useState<PendingLossMove>(null);
  const [lossReason, setLossReason] = useState<LossReason>("Budget insuffisant");
  const kanbanScrollRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasInitialData) return;
    Promise.all([
      fetch("/api/prospects?statut=actif").then(r => r.json()),
      fetch("/api/prospects").then(r => r.json()),
    ]).then(([activeJson, allJson]) => {
      setProspects(activeJson.data ?? []);
      setKanbanProspects(allJson.data ?? []);
      setLoading(false);
    });
  }, []);

  /* Reset pagination on filter change */
  useEffect(() => { setHistPage(1); }, [search, filterResultat]);

  /* Stable ref numbering */
  const prospectRefMap = useMemo(() => {
    const sorted = [...prospects].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const m = new Map<string, number>();
    sorted.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [prospects]);

  const kanbanRefMap = useMemo(() => {
    const sorted = [...kanbanProspects].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const m = new Map<string, number>();
    sorted.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [kanbanProspects]);

  /* Planning groups */
  const today = useMemo(getLocalToday, []);
  const tomorrow = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; }, [today]);
  const nextWeek = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }, [today]);

  const planningGroups = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = prospects.filter(p => {
      if (!q) return true;
      return p.entreprise.toLowerCase().includes(q) ||
        p.nom_contact.toLowerCase().includes(q) ||
        p.secteur_activite.toLowerCase().includes(q);
    }).filter(p => {
      if (!filterResultat) return true;
      return getLastVisite(p)?.resultat === filterResultat;
    });

    const retard: Prospect[] = [], auj: Prospect[] = [], sem: Prospect[] = [], rien: Prospect[] = [];
    filtered.forEach(p => {
      const d = getDateAction(p);
      if (!d) { rien.push(p); return; }
      if (d < today) retard.push(p);
      else if (d.getTime() === today.getTime()) auj.push(p);
      else if (d > today && d <= nextWeek) sem.push(p);
      else rien.push(p);
    });
    return { retard, auj, sem, rien };
  }, [prospects, search, filterResultat, today, nextWeek]);

  const totalUrgent = planningGroups.retard.length + planningGroups.auj.length;

  /* History feed (all visits, sorted, filtered) */
  const histEntries = useMemo(() => {
    const q = search.toLowerCase();
    const entries: { visite: Visite; prospect: Prospect }[] = [];
    prospects.forEach(p => {
      (p.visites ?? []).forEach(v => {
        const matchSearch = !q ||
          p.entreprise.toLowerCase().includes(q) ||
          p.nom_contact.toLowerCase().includes(q) ||
          p.secteur_activite.toLowerCase().includes(q);
        const matchResultat = !filterResultat || v.resultat === filterResultat;
        if (matchSearch && matchResultat) entries.push({ visite: v, prospect: p });
      });
    });
    return entries.sort((a, b) =>
      parseLocalDate(b.visite.date_visite).getTime() - parseLocalDate(a.visite.date_visite).getTime() ||
      new Date(b.visite.created_at).getTime() - new Date(a.visite.created_at).getTime()
    );
  }, [prospects, search, filterResultat]);

  /* Filter options */
  const resultatsInData = useMemo(() => {
    const s = new Set<string>();
    prospects.forEach(p => (p.visites ?? []).forEach(v => s.add(v.resultat)));
    return [...s];
  }, [prospects]);

  const filteredKanbanProspects = useMemo(() => {
    return kanbanProspects.filter(p => prospectMatchesFilters(p, search, filterResultat));
  }, [kanbanProspects, search, filterResultat]);

  function resolveDropEtape(id: UniqueIdentifier): EtapeProspect | null {
    const raw = String(id);
    const direct = KANBAN_ETAPES.find(s => s.value === raw);
    if (direct) return direct.value;
    const prospect = kanbanProspects.find(p => p.id === raw);
    return prospect ? getProspectEtape(prospect) : null;
  }

  function showToast(message: string) {
    setToast({ message });
    window.setTimeout(() => setToast(null), 3000);
  }

  function updateActiveProspects(previousStatus: StatutProspect, nextStatus: StatutProspect, updated: Prospect) {
    setProspects((current) => {
      if (previousStatus === "actif" && nextStatus !== "actif") {
        return current.filter(p => p.id !== updated.id);
      }
      if (previousStatus !== "actif" && nextStatus === "actif") {
        return [updated, ...current.filter(p => p.id !== updated.id)]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      if (previousStatus === "actif" && nextStatus === "actif") {
        return current.map(p => p.id === updated.id ? updated : p);
      }
      return current;
    });
  }

  async function moveProspectToEtape(prospectId: string, nextEtape: EtapeProspect, raisonPerte?: LossReason) {
    const current = kanbanProspects.find(p => p.id === prospectId);
    if (!current || getProspectEtape(current) === nextEtape) return;

    const previousKanban = kanbanProspects;
    const previousActive = prospects;
    const nextStatus: StatutProspect = nextEtape === "gagne" ? "converti" : current.statut_global;
    const updated: Prospect = {
      ...current,
      etape: nextEtape,
      statut_global: nextStatus,
      raison_perte: nextEtape === "perdu" ? (raisonPerte ?? null) : current.raison_perte,
      updated_at: new Date().toISOString(),
    };
    const payload: ProspectPatchPayload = { etape: nextEtape };
    if (nextEtape === "gagne") payload.statut_global = "converti";
    if (nextEtape === "perdu") payload.raison_perte = raisonPerte ?? null;

    setKanbanProspects(prev => prev.map(p => p.id === prospectId ? updated : p));
    updateActiveProspects(current.statut_global, nextStatus, updated);

    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Étape non enregistrée");
    } catch {
      setKanbanProspects(previousKanban);
      setProspects(previousActive);
      showToast("L'étape n'a pas pu être mise à jour.");
    }
  }

  function handleKanbanDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleKanbanDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;
    const prospectId = String(active.id);
    const nextEtape = resolveDropEtape(over.id);
    const current = kanbanProspects.find(p => p.id === prospectId);
    if (!nextEtape || !current || getProspectEtape(current) === nextEtape) return;
    if (nextEtape === "perdu") {
      setLossReason("Budget insuffisant");
      setPendingLossMove({ prospectId });
      return;
    }
    void moveProspectToEtape(prospectId, nextEtape);
  }

  function confirmLossMove() {
    if (!pendingLossMove) return;
    const { prospectId } = pendingLossMove;
    setPendingLossMove(null);
    void moveProspectToEtape(prospectId, "perdu", lossReason);
  }

  function cancelLossMove() {
    setPendingLossMove(null);
  }

  function handleKanbanScroll() {
    const el = kanbanScrollRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    setKanbanIndex(Math.min(KANBAN_ETAPES.length - 1, Math.max(0, Math.round(el.scrollLeft / width))));
  }

  function handleKanbanDotClick(index: number) {
    const el = kanbanScrollRef.current;
    if (!el) return;
    const target = el.children[index] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setKanbanIndex(index);
  }

  const px = 28;

  return (
    <>
      <style>{CSS}</style>
      <div className="prospection-shell">

        {/* ── HEADER ── */}
        <div className="prospection-header">
          <div className="prospection-header-inner">
            <div>
              <div className="prospection-eyebrow">Prospection</div>
              <h1 className="prospection-title">
                Journal d&rsquo;Activité
              </h1>
              <p className="prospection-subtitle">
                {loading ? "…" : `${prospects.length} prospect${prospects.length !== 1 ? "s" : ""} actif${prospects.length !== 1 ? "s" : ""}`}
                {totalUrgent > 0 && (
                  <span className="prospection-urgent">
                    · {totalUrgent} urgent{totalUrgent > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            <div className="prospection-actions">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="prospection-btn prospection-btn-secondary bth-focus"
                onClick={async () => { setExporting(true); await exportProspects(); setExporting(false); }}
                disabled={exporting}
                style={{
                  opacity: exporting ? 0.6 : 1,
                }}
              >
                <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? "…" : "Excel"}
              </motion.button>

              <Link href="/prospection/nouveau">
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className="prospection-btn prospection-btn-primary bth-focus"
                >
                  <svg width={13} height={13} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nouveau prospect
                </motion.div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="prospection-controls">
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#887f74", display: "flex", pointerEvents: "none" }}>
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher entreprise, contact, secteur..."
              className="prospection-field"
              style={{ width: "100%", paddingLeft: 36, paddingRight: search ? 36 : 12 }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}
              >
                <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Résultat filter */}
          <div style={{ position: "relative" }}>
            <select
              value={filterResultat}
              onChange={e => setFilterResultat(e.target.value)}
              className="prospection-select bth-focus"
              style={{
                width: "100%", padding: "0 32px 0 14px",
                background: filterResultat ? "#f2f7f3" : "white",
                color: filterResultat ? "#1a2e1e" : "#635c54",
                fontWeight: 600, cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="">Tous les résultats</option>
              {resultatsInData.map(r => (
                <option key={r} value={r}>{RESULTAT_LABELS[r] ?? r}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", color: filterResultat ? "#1a2e1e" : "#9ca3af" }}>
              <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Tabs — in filter bar */}
          <div className="prospection-tabs">
            {([["planning", "Planning"], ["kanban", "Kanban"], ["tous", "Tous (Historique)"]] as [Tab, string][]).map(([t, lbl]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`prospection-tab bth-focus${tab === t ? " is-active" : ""}`}
              >
                {lbl}
                {t === "planning" && totalUrgent > 0 && (
                  <span style={{ marginLeft: 6, background: "#ef4444", color: "white", fontSize: 10, borderRadius: 9999, padding: "1px 5px", fontWeight: 700 }}>
                    {totalUrgent}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ padding: `24px ${px}px`, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="sk" style={{ height: 72, borderRadius: 14, background: "white", border: "1px solid #e5e7eb" }} />
            ))}
          </div>
        ) : tab === "kanban" ? (

          <KanbanView
            prospects={filteredKanbanProspects}
            prospectRefMap={kanbanRefMap}
            today={today}
            activeId={activeDragId}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleKanbanDragEnd}
            scrollRef={kanbanScrollRef}
            activeIndex={kanbanIndex}
            onScroll={handleKanbanScroll}
            onDotClick={handleKanbanDotClick}
          />

        ) : tab === "tous" ? (

          /* ── TOUS: premium table ── */
          histEntries.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width={28} height={28} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6 }}>Aucune activité</p>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                {prospects.length === 0 ? "Ajoutez votre premier prospect pour commencer." : "Aucun résultat pour ces filtres."}
              </p>
              {prospects.length === 0 && (
                <Link href="/prospection/nouveau">
                  <motion.div whileTap={{ scale: 0.96 }} style={{ padding: "10px 20px", borderRadius: 9999, background: "#1a2e1e", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Ajouter un prospect
                  </motion.div>
                </Link>
              )}
            </div>
          ) : (
            <div className="history-shell">
              <HistoryTable
                entries={histEntries}
                prospectRefMap={prospectRefMap}
                page={histPage}
                onPage={setHistPage}
              />
            </div>
          )

        ) : (

          /* ── PLANNING: sectioned cards ── */
          prospects.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width={28} height={28} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6 }}>Aucun prospect actif</p>
              <Link href="/prospection/nouveau">
                <motion.div whileTap={{ scale: 0.96 }} style={{ marginTop: 8, padding: "10px 20px", borderRadius: 9999, background: "#1a2e1e", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Ajouter un prospect
                </motion.div>
              </Link>
            </div>
          ) : (
            <div className="sc planning-scroll">

              {planningGroups.retard.length > 0 && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff4f1", border: "1px solid #efc8bf", borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}
                  >
                    <svg width={14} height={14} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p style={{ fontSize: 13, color: "#9c3c30" }}>
                      <strong>{planningGroups.retard.length} prospect{planningGroups.retard.length > 1 ? "s" : ""} non traité{planningGroups.retard.length > 1 ? "s" : ""}</strong>
                      {" "}— date de relance dépassée
                    </p>
                  </motion.div>
                </AnimatePresence>
              )}
              <div className="planning-grid">
              <PlanningSection
                title="Non traités - ASAP"
                prospects={planningGroups.retard}
                prospectRefMap={prospectRefMap}
                urgency="retard"
                dotColor="#c44a3a"
                emptyText="Aucun prospect en retard"
              />
              <PlanningSection
                title="Aujourd'hui"
                prospects={planningGroups.auj}
                prospectRefMap={prospectRefMap}
                urgency="aujourd_hui"
                dotColor="#3a7ca5"
                emptyText="Aucune action prévue aujourd'hui"
              />
              <PlanningSection
                title="Cette semaine"
                prospects={planningGroups.sem}
                prospectRefMap={prospectRefMap}
                urgency="semaine"
                dotColor="#C9A96E"
                emptyText="Aucune relance planifiée cette semaine"
              />
              <PlanningSection
                title="Sans relance planifiée"
                prospects={planningGroups.rien}
                prospectRefMap={prospectRefMap}
                urgency="non_planifie"
                dotColor="#b0a898"
                emptyText="Tous les prospects ont une relance planifiée"
              />
              </div>

            </div>
          )
        )}

        <LossReasonPopover
          pending={pendingLossMove}
          reason={lossReason}
          onReasonChange={setLossReason}
          onConfirm={confirmLossMove}
          onCancel={cancelLossMove}
        />

        <AnimatePresence>
          {toast && (
            <motion.div
              className="prospection-toast"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
