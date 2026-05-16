"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";

/* ── global CSS ─────────────────────────────────────────────── */
const CSS = `
  .sc { overflow-y:auto; scrollbar-width:thin; scrollbar-color:#e5e7eb transparent; }
  .sc::-webkit-scrollbar { width:4px; }
  .sc::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
  .hist-row { cursor:pointer; transition: background 0.1s, box-shadow 0.1s; }
  .hist-row:hover { background:#fafcfb !important; box-shadow: inset 3px 0 0 #1a2e1e; }
  .plan-card { cursor:pointer; transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s; }
  .plan-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.09) !important; }
`;

/* ── types ──────────────────────────────────────────────────── */
type Tab = "planning" | "tous";
type Urgency = "retard" | "aujourd_hui" | "semaine" | "non_planifie";
type SortCol = "date_visite" | "entreprise" | "resultat" | "date_action";
type SortDir = "asc" | "desc";

/* ── constants ──────────────────────────────────────────────── */
const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee:    "Demande de soumission",
  rappel_planifie:        "À rappeler",
  visite_expert_demandee: "Visite expert demandée",
  pas_interesse:          "Pas intéressé",
  absent:                 "Absent",
  autre:                  "Autre",
};

type RCfg = { bg: string; text: string; dot: string; border: string };
const RCFG: Record<string, RCfg> = {
  soumission_demandee:    { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e", border: "#bbf7d0" },
  rappel_planifie:        { bg: "#fff7ed", text: "#c2410c", dot: "#f97316", border: "#fed7aa" },
  visite_expert_demandee: { bg: "#faf5ff", text: "#7c3aed", dot: "#a855f7", border: "#e9d5ff" },
  pas_interesse:          { bg: "#fff1f2", text: "#be123c", dot: "#f43f5e", border: "#fecdd3" },
  absent:                 { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b", border: "#fde68a" },
  autre:                  { bg: "#f8fafc", text: "#475569", dot: "#94a3b8", border: "#e2e8f0" },
};

const PAGE_SIZE = 15;

/* ── helpers ────────────────────────────────────────────────── */
function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function getLocalToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLastVisite(p: Prospect): Visite | null {
  if (!p.visites?.length) return null;
  return [...p.visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

function getDateAction(p: Prospect): Date | null {
  const v = getLastVisite(p);
  if (!v?.date_prochaine_action) return null;
  return parseLocalDate(v.date_prochaine_action);
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function prospectRef(i: number): string {
  return `#PR-${String(i + 1).padStart(3, "0")}`;
}

async function exportProspects() {
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

/* ── sub-components ─────────────────────────────────────────── */

function ResultatBadge({ resultat, sm }: { resultat: string; sm?: boolean }) {
  const c = RCFG[resultat] ?? RCFG.autre;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 7px" : "3px 10px", borderRadius: 5,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: sm ? 10.5 : 11.5, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {RESULTAT_LABELS[resultat] ?? resultat}
    </span>
  );
}

const AV_COLORS = ["#1a2e1e", "#2d5a3d", "#1a3a4e", "#3d6b4f", "#4a3a1e", "#2a4a3e"];
function avColor(n: string) { return AV_COLORS[n.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]; }
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: avColor(name || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: Math.floor(size * 0.38), flexShrink: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function ActionIcon({ r }: { r: string }) {
  const p = r === "soumission_demandee"
    ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    : r === "rappel_planifie"
    ? "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    : r === "visite_expert_demandee"
    ? "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    : "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
  return (
    <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={p} />
    </svg>
  );
}

/* ── HISTORY TABLE ──────────────────────────────────────────── */

const D = "1px solid #f0f2f5";
const GRID = "52px 200px 1fr 150px 120px 180px 165px";

function TH({ label, id, sortCol, sortDir, onSort, align = "left" }: {
  label: string; id?: SortCol; sortCol: SortCol; sortDir: SortDir;
  onSort: (c: SortCol) => void; align?: string;
}) {
  const active = id && sortCol === id;
  return (
    <div
      onClick={id ? () => onSort(id) : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 4, height: "100%",
        cursor: id ? "pointer" : "default",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        userSelect: "none",
      }}
    >
      <span style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        color: active ? "#1a2e1e" : "#9ca3af",
      }}>
        {label}
      </span>
      {active && (
        <svg width={10} height={10} fill="none" stroke="#1a2e1e" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </svg>
      )}
    </div>
  );
}

function HistRow({ visite, prospect, refCode, idx }: {
  visite: Visite; prospect: Prospect; refCode: string; idx: number;
}) {
  const cfg = RCFG[visite.resultat] ?? RCFG.autre;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.018, duration: 0.16 }}
    >
      <Link href={`/prospection/${prospect.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          className="hist-row"
          style={{ display: "grid", gridTemplateColumns: GRID, minHeight: 58, alignItems: "stretch", borderBottom: "1px solid #f1f5f9" }}
        >
          {/* Icon */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: D }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.text }}>
              <ActionIcon r={visite.resultat} />
            </div>
          </div>

          {/* Entreprise */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, paddingLeft: 12, paddingRight: 12, borderRight: D }}>
            <Avatar name={prospect.entreprise} size={28} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prospect.entreprise}
              </p>
              <p style={{ fontSize: 10.5, color: "#9ca3af", fontFamily: "ui-monospace,monospace", letterSpacing: "0.04em" }}>
                {refCode}
              </p>
            </div>
          </div>

          {/* Secteur */}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 12, borderRight: D }}>
            <p style={{ fontSize: 12.5, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prospect.secteur_activite}
            </p>
          </div>

          {/* Contact */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 12, paddingRight: 12, borderRight: D }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prospect.nom_contact}
            </p>
            {prospect.poste_contact && (
              <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>{prospect.poste_contact}</p>
            )}
          </div>

          {/* Date visite */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 12, borderRight: D }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{formatDateFr(visite.date_visite)}</p>
            <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>{fmt(visite.created_at)}</p>
          </div>

          {/* Résultat */}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: D }}>
            <ResultatBadge resultat={visite.resultat} sm />
          </div>

          {/* Prochaine action */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 12, paddingRight: 16 }}>
            {visite.date_prochaine_action ? (
              <>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                  {formatDateFr(visite.date_prochaine_action)}
                </p>
                {visite.action_requise && (
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {visite.action_requise}
                  </p>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function HistoryTable({
  entries, prospectRefMap, page, onPage,
}: {
  entries: { visite: Visite; prospect: Prospect }[];
  prospectRefMap: Map<string, number>;
  page: number;
  onPage: (p: number) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("date_visite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortCol === "date_visite") {
        va = parseLocalDate(a.visite.date_visite).getTime();
        vb = parseLocalDate(b.visite.date_visite).getTime();
      } else if (sortCol === "entreprise") {
        va = a.prospect.entreprise.toLowerCase();
        vb = b.prospect.entreprise.toLowerCase();
      } else if (sortCol === "resultat") {
        va = a.visite.resultat;
        vb = b.visite.resultat;
      } else {
        va = a.visite.date_prochaine_action ?? "";
        vb = b.visite.date_prochaine_action ?? "";
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [entries, sortCol, sortDir]);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const HD = "1px solid #eaecef";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Sticky header */}
      <div style={{
        display: "grid", gridTemplateColumns: GRID, height: 44, alignItems: "stretch",
        background: "#fafafa", borderBottom: "1.5px solid #e5e7eb",
        position: "sticky", top: 0, zIndex: 5, flexShrink: 0,
      }}>
        <div style={{ borderRight: HD }} />
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="entreprise" label="Entreprise" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH label="Secteur" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH label="Contact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="date_visite" label="Date visite" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="resultat" label="Résultat" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12 }}>
          <TH id="date_action" label="Prochaine action" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
      </div>

      {/* Rows */}
      <div className="sc" style={{ flex: 1, overflowY: "auto" }}>
        {paged.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            Aucun résultat pour ces filtres
          </div>
        ) : (
          paged.map(({ visite, prospect }, i) => (
            <HistRow
              key={visite.id}
              visite={visite}
              prospect={prospect}
              refCode={prospectRef(prospectRefMap.get(prospect.id) ?? 0)}
              idx={i}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 48, borderTop: "1.5px solid #e5e7eb",
        background: "#fafafa", flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          <strong style={{ color: "#374151", fontWeight: 600 }}>{total}</strong>{" "}
          visite{total !== 1 ? "s" : ""}
        </span>
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page <= 1 ? "#d1d5db" : "#374151", cursor: page <= 1 ? "default" : "pointer" }}
            >
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 80, textAlign: "center", userSelect: "none" }}>
              Page {page} / {pages}
            </span>
            <button
              onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page >= pages ? "#d1d5db" : "#374151", cursor: page >= pages ? "default" : "pointer" }}
            >
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PLANNING CARD ──────────────────────────────────────────── */

function PlanningCard({ prospect, refCode, urgency, idx }: {
  prospect: Prospect; refCode: string; urgency: Urgency; idx: number;
}) {
  const lastV = getLastVisite(prospect);
  const r = lastV?.resultat ?? "autre";
  const cfg = RCFG[r] ?? RCFG.autre;
  const isOverdue = urgency === "retard";

  const timeEl = isOverdue ? (
    <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "2px 9px", borderRadius: 9999, border: "1px solid #fecaca" }}>
      ASAP
    </span>
  ) : urgency === "aujourd_hui" && lastV ? (
    <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>{fmt(lastV.created_at)}</span>
  ) : lastV?.date_prochaine_action ? (
    <span style={{ fontSize: 11, color: "#6b7280" }}>
      {parseLocalDate(lastV.date_prochaine_action).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
    </span>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.22 }}
    >
      <Link href={`/prospection/${prospect.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          className="plan-card"
          style={{
            background: "white",
            borderRadius: 14,
            border: `1px solid ${isOverdue ? "#fecaca" : "#e5e7eb"}`,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: isOverdue ? "#fef2f2" : cfg.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isOverdue ? "#ef4444" : cfg.text,
            }}>
              <ActionIcon r={r} />
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{prospect.entreprise}</span>
                    <span style={{ fontSize: 10.5, color: "#9ca3af", fontFamily: "ui-monospace,monospace" }}>{refCode}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{prospect.secteur_activite}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <ResultatBadge resultat={r} sm />
                  {timeEl}
                </div>
              </div>

              {/* Contact line */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                <svg width={11} height={11} fill="none" stroke="#9ca3af" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span style={{ fontSize: 11.5, color: "#6b7280" }}>
                  <strong style={{ color: "#374151" }}>{prospect.nom_contact}</strong>
                  {prospect.poste_contact && <span style={{ color: "#9ca3af" }}> · {prospect.poste_contact}</span>}
                </span>
                {prospect.telephone && (
                  <>
                    <span style={{ color: "#d1d5db", fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{prospect.telephone}</span>
                  </>
                )}
              </div>

              {/* Note / action requise */}
              {(lastV?.action_requise || lastV?.notes_visite) && (
                <p style={{
                  marginTop: 10, fontSize: 12, color: "#6b7280", fontStyle: "italic",
                  lineHeight: 1.5, paddingLeft: 10, borderLeft: "2px solid #e5e7eb",
                }}>
                  &ldquo;{lastV.action_requise || lastV.notes_visite}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PlanningSection({ title, prospects, prospectRefMap, urgency, dotColor, emptyText }: {
  title: string; prospects: Prospect[]; prospectRefMap: Map<string, number>;
  urgency: Urgency; dotColor: string; emptyText: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", background: "#f3f4f6", padding: "1px 8px", borderRadius: 9999 }}>
          {prospects.length}
        </span>
      </div>

      {prospects.length === 0 ? (
        <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", paddingLeft: 16 }}>{emptyText}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prospects.map((p, i) => (
            <PlanningCard
              key={p.id}
              prospect={p}
              refCode={prospectRef(prospectRefMap.get(p.id) ?? 0)}
              urgency={urgency}
              idx={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */

export default function ProspectionPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("planning");
  const [search, setSearch] = useState("");
  const [filterResultat, setFilterResultat] = useState("");
  const [histPage, setHistPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/prospects?statut=actif")
      .then(r => r.json())
      .then(json => { setProspects(json.data ?? []); setLoading(false); });
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

  const px = 28;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#faf9f7" }}>

        {/* ── HEADER ── */}
        <div style={{ background: "white", borderBottom: "1px solid #ededeb", padding: `20px ${px}px 16px`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 26, color: "#111827", letterSpacing: "-0.8px", lineHeight: 1 }}>
                Journal d&rsquo;Activité
              </h1>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                {loading ? "…" : `${prospects.length} prospect${prospects.length !== 1 ? "s" : ""} actif${prospects.length !== 1 ? "s" : ""}`}
                {totalUrgent > 0 && (
                  <span style={{ marginLeft: 6, color: "#ef4444", fontWeight: 600 }}>
                    · {totalUrgent} urgent{totalUrgent > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={async () => { setExporting(true); await exportProspects(); setExporting(false); }}
                disabled={exporting}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 9999,
                  border: "1.5px solid #e5e7eb", background: "white",
                  display: "flex", alignItems: "center", gap: 6,
                  color: "#6b7280", fontWeight: 500, fontSize: 13, cursor: exporting ? "default" : "pointer",
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
                  style={{
                    height: 36, padding: "0 16px", borderRadius: 9999,
                    background: "#1a2e1e", display: "flex", alignItems: "center", gap: 6,
                    color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(26,46,30,.20)", whiteSpace: "nowrap",
                  }}
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
        <div style={{
          background: "white", borderBottom: "1px solid #ededeb",
          padding: `10px ${px}px`,
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", pointerEvents: "none" }}>
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher entreprise, contact, secteur…"
              style={{
                width: "100%", paddingLeft: 36, paddingRight: search ? 36 : 12, height: 36,
                border: "1.5px solid #e5e7eb", borderRadius: 9999,
                fontSize: 13, color: "#111827", background: "white", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#1a2e1e")}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
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
              style={{
                height: 36, padding: "0 32px 0 14px", borderRadius: 9999,
                border: `1.5px solid ${filterResultat ? "#1a2e1e" : "#e5e7eb"}`,
                background: filterResultat ? "#edf5ee" : "white",
                color: filterResultat ? "#1a2e1e" : "#6b7280",
                fontWeight: 500, fontSize: 13, cursor: "pointer", outline: "none",
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
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {([["planning", "Planning (À faire)"], ["tous", "Tous (Historique)"]] as [Tab, string][]).map(([t, lbl]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  height: 34, padding: "0 14px", borderRadius: 9999,
                  background: tab === t ? "#1a2e1e" : "#f3f4f6",
                  color: tab === t ? "white" : "#6b7280",
                  fontWeight: 600, fontSize: 12.5, border: "none", cursor: "pointer",
                  transition: "all 0.15s",
                }}
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
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
              margin: `16px ${px}px 20px`,
              background: "white", borderRadius: 16, border: "1px solid #ededeb",
              overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
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
            <div className="sc" style={{ flex: 1, overflowY: "auto", padding: `20px ${px}px 28px` }}>

              {planningGroups.retard.length > 0 && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}
                  >
                    <svg width={14} height={14} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p style={{ fontSize: 13, color: "#b91c1c" }}>
                      <strong>{planningGroups.retard.length} prospect{planningGroups.retard.length > 1 ? "s" : ""} non traité{planningGroups.retard.length > 1 ? "s" : ""}</strong>
                      {" "}— date de relance dépassée
                    </p>
                  </motion.div>
                </AnimatePresence>
              )}

              <PlanningSection
                title="Non traités — ASAP"
                prospects={planningGroups.retard}
                prospectRefMap={prospectRefMap}
                urgency="retard"
                dotColor="#ef4444"
                emptyText="Aucun prospect en retard ✓"
              />
              <PlanningSection
                title="Aujourd'hui"
                prospects={planningGroups.auj}
                prospectRefMap={prospectRefMap}
                urgency="aujourd_hui"
                dotColor="#3b82f6"
                emptyText="Aucune action prévue aujourd'hui"
              />
              <PlanningSection
                title="Cette semaine"
                prospects={planningGroups.sem}
                prospectRefMap={prospectRefMap}
                urgency="semaine"
                dotColor="#9ca3af"
                emptyText="Aucune relance planifiée cette semaine"
              />
              <PlanningSection
                title="Sans relance planifiée"
                prospects={planningGroups.rien}
                prospectRefMap={prospectRefMap}
                urgency="non_planifie"
                dotColor="#d1d5db"
                emptyText="Tous les prospects ont une relance planifiée ✓"
              />

            </div>
          )
        )}

      </div>
    </>
  );
}
