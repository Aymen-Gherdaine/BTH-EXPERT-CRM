"use client";

import { useEffect, useState, useCallback, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Soumission, StatutSoumission, LigneBudget, UserRole } from "@/types";
import { formatMontant, formatDateFr } from "@/lib/utils";

/* ── Scrollbar + skeleton ────────────────────────────────────── */
const CSS = `
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

/* ── Breakpoint ─────────────────────────────────────────────── */
type Bp = "mobile" | "tablet" | "desktop";
function useBp(): Bp {
  const [bp, set] = useState<Bp>("mobile");
  useEffect(() => {
    const h = () => set(
      window.innerWidth >= 1024 ? "desktop"
      : window.innerWidth >= 640 ? "tablet"
      : "mobile"
    );
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

/* ── Formatters ─────────────────────────────────────────────── */
const fmtInt = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/* ── Status config ──────────────────────────────────────────── */
type StCfg = { accent: string; bgBadge: string; textBadge: string; dot: string; border: string };
const ST: Record<StatutSoumission, StCfg> = {
  Brouillon: { accent: "#94a3b8", bgBadge: "#f8fafc", textBadge: "#475569", dot: "#94a3b8", border: "#e2e8f0" },
  Envoyée:   { accent: "#3b82f6", bgBadge: "#eff6ff", textBadge: "#2563eb", dot: "#3b82f6", border: "#bfdbfe" },
  Acceptée:  { accent: "#16a34a", bgBadge: "#f0fdf4", textBadge: "#15803d", dot: "#22c55e", border: "#bbf7d0" },
  Refusée:   { accent: "#e11d48", bgBadge: "#fff1f2", textBadge: "#be123c", dot: "#f43f5e", border: "#fecdd3" },
};

const NEXT_ST: Record<StatutSoumission, StatutSoumission[]> = {
  Brouillon: ["Envoyée"],
  Envoyée:   ["Acceptée", "Refusée", "Brouillon"],
  Acceptée:  ["Envoyée"],
  Refusée:   ["Envoyée"],
};

/* ── Icon ───────────────────────────────────────────────────── */
function Ic({ d, z = 18, s = "currentColor", f = "none", w = 1.6 }: {
  d: string | string[]; z?: number; s?: string; f?: string; w?: number;
}) {
  return (
    <svg width={z} height={z} viewBox="0 0 24 24" fill={f} stroke={s}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const I = {
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

/* ── StatusBadge ────────────────────────────────────────────── */
function StatusBadge({ st, sm = false }: { st: StatutSoumission; sm?: boolean }) {
  const c = ST[st];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 7px" : "3px 10px",
      borderRadius: 9999,
      background: c.bgBadge,
      border: `1px solid ${c.border}`,
      color: c.textBadge,
      fontSize: sm ? 10.5 : 11.5, fontWeight: 600, whiteSpace: "nowrap",
      letterSpacing: 0,
    }}>
      <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {st}
    </span>
  );
}

/* ── Avatar ─────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#1a2e1e","#2d5a3d","#1a3a4e","#3d6b4f","#4a3a1e","#2a4a3e","#3a2e4e"];
const avatarCache: Record<string, string> = {};
function avatarColor(name: string): string {
  if (avatarCache[name]) return avatarCache[name];
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (avatarCache[name] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(name || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: Math.floor(size * 0.38),
      flexShrink: 0, letterSpacing: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ── SoumissionView ─────────────────────────────────────────── */
type SoumissionView = Soumission & { _cn: string; _contact: string };
type ApiListResponse<T> = { data?: T[] };
type MeResponse = { role?: UserRole };

/* ── FilterDropdown ─────────────────────────────────────────── */
function FilterDropdown({ active, set, counts }: {
  active: StatutSoumission | null;
  set: (v: StatutSoumission | null) => void;
  counts: Partial<Record<StatutSoumission, number>>;
}) {
  const [open, setOpen] = useState(false);
  const opts: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];
  return (
    <div className="submission-filter-wrap" style={{ position: "relative" }}>
      <motion.button whileTap={{ scale: .96 }} onClick={() => setOpen(o => !o)} style={{
        height: 36, padding: "0 13px", borderRadius: 9999,
        border: `1.5px solid ${active ? "#1a2e1e" : "#e5e7eb"}`,
        background: active ? "#edf5ee" : "white",
        color: active ? "#1a2e1e" : "#6b7280",
        fontWeight: 500, fontSize: 13,
        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
      }}>
        <Ic d={I.filter} z={13} />
        Statut
        {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a2e1e" }} />}
        <Ic d={I.chevD} z={12} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .15 }}
              style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                boxShadow: "0 8px 32px rgba(0,0,0,.10)", minWidth: 190, padding: 6,
              }}>
              <button onClick={() => { set(null); setOpen(false); }} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
                background: !active ? "#edf5ee" : "transparent",
                color: !active ? "#1a2e1e" : "#6b7280",
                fontSize: 13, fontWeight: !active ? 600 : 400,
                textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
              }}>
                Tous les statuts {!active && <Ic d={I.check} z={12} />}
              </button>
              {opts.map(o => {
                const c = ST[o]; const sel = active === o;
                return (
                  <button key={o} onClick={() => { set(sel ? null : o); setOpen(false); }} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
                    background: sel ? "#edf5ee" : "transparent",
                    color: sel ? "#1a2e1e" : "#6b7280",
                    fontSize: 13, fontWeight: sel ? 600 : 400,
                    textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
                      {o}
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>({counts[o] ?? 0})</span>
                    </span>
                    {sel && <Ic d={I.check} z={12} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pager ──────────────────────────────────────────────────── */
function Pager({ page, total, perPage, onPage, hideWhenSinglePage = false }: {
  page: number; total: number; perPage: number; onPage: Dispatch<SetStateAction<number>>; hideWhenSinglePage?: boolean;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (hideWhenSinglePage && pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div style={{
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 24px", borderTop: "1px solid #e8e2d8",
      background: "#fffdfa",
    }} className="submission-pager">
      <span style={{ fontSize: 12, color: "#6b7280" }}>
        <strong style={{ color: "#111827" }}>{from}–{to}</strong>
        {" "}sur{" "}
        <strong style={{ color: "#111827" }}>{total}</strong>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page <= 1}
          style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page <= 1 ? "#d0c9be" : "#1a2e1e", cursor: page <= 1 ? "default" : "pointer" }}
        >
          <Ic d={I.chevL} z={13} />
        </motion.button>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 76, textAlign: "center", userSelect: "none" }}>
          Page {page} / {pages}
        </span>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => onPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
          style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page >= pages ? "#d0c9be" : "#1a2e1e", cursor: page >= pages ? "default" : "pointer" }}
        >
          <Ic d={I.chevR} z={13} />
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CARD VIEW
══════════════════════════════════════════════════════════════ */

function SoumissionCard({ o, idx, isAdmin, onClick, isActive }: {
  o: SoumissionView; idx: number; isAdmin: boolean; onClick: () => void; isActive: boolean;
}) {
  const c = ST[o.statut];
  const pct = o.total_ttc > 0 ? Math.min(100, ((o.versement_recu ?? 0) / o.total_ttc) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="card-hover submission-card"
        onClick={onClick}
        style={{
          background: isActive ? "#f2f7f3" : "linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)",
          borderRadius: 8,
          border: `1px solid ${isActive ? "rgba(26,46,30,.32)" : "#e8e2d8"}`,
          boxShadow: isActive ? "0 14px 34px rgba(26,46,30,0.10)" : "0 8px 24px rgba(26,46,30,0.05)",
          cursor: "pointer",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: c.accent, flexShrink: 0 }} />

        {/* Body */}
        <div className="submission-card-body" style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Badge + Ref */}
          <div className="submission-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
            <StatusBadge st={o.statut} />
            <span style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10.5, color: "#887f74", letterSpacing: 0,
            }}>
              {o.numero_offre}
            </span>
          </div>

          {/* Titre */}
          <h3 className="submission-card-title" style={{
            fontSize: 15, fontWeight: 700, color: "#101c12",
            letterSpacing: 0, lineHeight: 1.35, marginBottom: 8,
          }}>
            {o.titre_projet}
          </h3>

          {/* Description */}
          {o.description_projet && (
            <p className="submission-card-desc" style={{
              fontSize: 12.5, color: "#635c54", lineHeight: 1.55, marginBottom: 12,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {o.description_projet}
            </p>
          )}

          {/* Secteur tag */}
          {o.secteur_activite && (
            <div style={{ marginBottom: 14 }}>
              <span className="submission-sector" style={{
                display: "inline-block", padding: "3px 10px", borderRadius: 9999,
                background: "#f5f0e8", color: "#635c54",
                fontSize: 11, fontWeight: 500,
              }}>
                {o.secteur_activite}
              </span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Client row + montant */}
          <div className="submission-card-meta" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: pct > 0 ? 14 : 0,
            gap: 12, flexWrap: "wrap",
          }}>
            <div className="submission-card-client" style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar name={o._cn} size={28} />
              <div>
                <p className="submission-card-client-name" style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{o._cn}</p>
                {o.delai_jours > 0 && (
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{o.delai_jours} j de délai</p>
                )}
              </div>
            </div>
            {isAdmin && o.total_ttc > 0 && (
              <div className="submission-card-total" style={{ textAlign: "right" }}>
                <div className="submission-card-total-row" style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
                  <span className="submission-card-total-value" style={{
                    fontVariantNumeric: "tabular-nums", fontSize: 14.5, fontWeight: 750,
                    color: "#101c12", letterSpacing: 0,
                  }}>
                    {fmtInt(o.total_ttc)}
                  </span>
                  <span className="submission-card-currency" style={{ fontSize: 10, color: "#9ca3af" }}>DZD</span>
                </div>
                {pct > 0 && (
                  <p style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, marginTop: 1 }}>
                    {pct.toFixed(0)}% versé
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {pct > 0 && (
            <div style={{ height: 5, borderRadius: 9999, background: "#f5f0e8", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: idx * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 9999, background: c.accent }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CardGrid({ items, isAdmin, onOpen, selId, px }: {
  items: SoumissionView[]; isAdmin: boolean;
  onOpen: (o: SoumissionView) => void; selId: string | null; px: number;
}) {
  return (
    <div className="submission-card-grid" style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
      gap: 16,
      padding: `20px ${px}px 28px`,
      alignItems: "start",
    }}>
      {items.map((o, i) => (
        <SoumissionCard
          key={o.id} o={o} idx={i} isAdmin={isAdmin}
          onClick={() => onOpen(o)} isActive={selId === o.id}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TABLE VIEW
══════════════════════════════════════════════════════════════ */

type SortCol = "numero_offre" | "client" | "titre_projet" | "statut" | "total_ttc" | "date_offre";

function PremiumTableRow({
  o, isAdmin, onClick, isActive, isSelected, onToggle,
  GRID, onDuplicate, onDelete, idx,
}: {
  o: SoumissionView; isAdmin: boolean; onClick: () => void;
  isActive: boolean; isSelected: boolean; onToggle: (id: string) => void;
  GRID: string; onDuplicate: (s: SoumissionView) => void;
  onDelete: (s: SoumissionView) => void; idx: number;
}) {
  const [hov, setHov] = useState(false);
  const pct = o.total_ttc > 0 ? Math.min(100, ((o.versement_recu ?? 0) / o.total_ttc) * 100) : 0;
  const highlighted = hov || isActive || isSelected;
  const D = "1px solid #eee7dc";

  const bg = isActive
    ? "#f2f7f3"
    : isSelected
    ? "#f7fbf8"
    : hov
    ? "#fffdfa"
    : "#ffffff";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.025, duration: 0.18, ease: "easeOut" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: GRID,
        minHeight: 66, alignItems: "stretch",
        borderBottom: "1px solid #f1ece4",
        cursor: "pointer", background: bg,
        boxShadow: highlighted ? "inset 3px 0 0 #1a2e1e, 0 10px 22px rgba(26,46,30,0.04)" : "inset 3px 0 0 transparent",
        transition: "background 0.12s, box-shadow 0.12s",
      }}
    >
      {/* Checkbox */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: D }}
        onClick={e => { e.stopPropagation(); onToggle(o.id); }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: 9999,
          border: isSelected ? "none" : `1.5px solid ${hov ? "#887f74" : "#d0c9be"}`,
          background: isSelected ? "#1a2e1e" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.12s",
        }}>
          {isSelected && <Ic d={I.check} z={10} s="white" w={2.5} />}
        </div>
      </div>

      {/* Ref + date */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 4, paddingRight: 8, borderRight: D }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2e1e", fontFamily: "var(--font-inter)", letterSpacing: 0 }}>
          {o.numero_offre}
        </p>
        <p style={{ fontSize: 10.5, color: "#887f74", marginTop: 2, fontWeight: 400 }}>
          {formatDateFr(o.date_offre)}
        </p>
      </div>

      {/* Client */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, paddingLeft: 4, paddingRight: 12, borderRight: D }}>
        <Avatar name={o._cn} size={28} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: "#101c12",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {o._cn}
          </p>
          <p style={{
            fontSize: 10.5, color: "#887f74", marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {o._contact}
          </p>
        </div>
      </div>

      {/* Titre + secteur */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 4, paddingRight: 16, minWidth: 0, borderRight: D }}>
        <p style={{ fontSize: 13, color: "#101c12", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {o.titre_projet}
        </p>
        {o.secteur_activite && (
          <p style={{ fontSize: 10.5, color: "#887f74", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {o.secteur_activite}
          </p>
        )}
      </div>

      {/* Statut */}
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 4, borderRight: isAdmin ? D : "none" }}>
        <StatusBadge st={o.statut} sm />
      </div>

      {isAdmin && (
        <>
          {/* Délai */}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 10, borderRight: D }}>
            {o.delai_jours > 0 && (
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{o.delai_jours}</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: "#887f74" }}>jours</span>
              </span>
            )}
          </div>

          {/* Montant + progress */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingRight: 16, borderRight: D }}>
            {o.total_ttc > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 2 }}>
                  <span style={{
                    fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 700,
                    color: "#101c12", letterSpacing: 0,
                  }}>
                    {fmtInt(o.total_ttc)}
                  </span>
                  <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 500 }}>DZD</span>
                </div>
                {pct > 0 && (
                  <div style={{ marginTop: 5, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <div style={{ height: 3, borderRadius: 9999, background: "#f5f0e8", overflow: "hidden", width: 68 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: idx * 0.02 + 0.25, duration: 0.5, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 9999, background: "#3a7a50" }}
                      />
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: "#15803d", fontVariantNumeric: "tabular-nums" }}>
                      {fmtInt(o.versement_recu ?? 0)} versé
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 3,
        justifyContent: "flex-end", paddingRight: 12,
        opacity: 1,
      }}>
        <Link href={`/soumissions/${o.id}`} onClick={e => e.stopPropagation()}>
          <span title="Ouvrir" style={{
            width: 30, height: 30, borderRadius: 9999,
            background: "#fffdfa", border: "1px solid #e8e2d8",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#374151", cursor: "pointer",
          }}>
            <Ic d={I.eye} z={13} />
          </span>
        </Link>
        {isAdmin && (
          <>
            <button title="Dupliquer" onClick={e => { e.stopPropagation(); onDuplicate(o); }} style={{
              width: 30, height: 30, borderRadius: 9999,
              background: "#fffdfa", border: "1px solid #e8e2d8",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#374151", cursor: "pointer",
            }}>
              <Ic d={I.copy} z={13} />
            </button>
            <button title="Supprimer" onClick={e => { e.stopPropagation(); onDelete(o); }} style={{
              width: 30, height: 30, borderRadius: 9999,
              background: "#fff1f2", border: "1px solid #fecdd3",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#e11d48", cursor: "pointer",
            }}>
              <Ic d={I.trash} z={13} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function PremiumTable({ items, isAdmin, onOpen, selId, selected, onToggle, onDuplicate, onDelete, page, total, perPage, onPage }: {
  items: SoumissionView[]; isAdmin: boolean; onOpen: (o: SoumissionView) => void;
  selId: string | null; selected: string[]; onToggle: (id: string) => void;
  onDuplicate: (s: SoumissionView) => void; onDelete: (s: SoumissionView) => void;
  page: number; total: number; perPage: number; onPage: Dispatch<SetStateAction<number>>;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("date_offre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sorted = [...items].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sortCol === "client") { va = a._cn.toLowerCase(); vb = b._cn.toLowerCase(); }
    else if (sortCol === "total_ttc") { va = a.total_ttc; vb = b.total_ttc; }
    else { va = (a[sortCol] as string).toLowerCase(); vb = (b[sortCol] as string).toLowerCase(); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const GRID = isAdmin
    ? "52px 130px 190px 1fr 110px 80px 150px 110px"
    : "52px 130px 190px 1fr 110px 100px";

  const totalRow = sorted.reduce((s, o) => s + o.total_ttc, 0);

  const HD = "1px solid #e8e2d8"; // header divider

  function TH({ id, label, align = "left" }: { id?: SortCol; label: string; align?: string }) {
    const active = sortCol === id;
    return (
      <div onClick={id ? () => handleSort(id) : undefined} style={{
        display: "flex", alignItems: "center", gap: 4, height: "100%",
        cursor: id ? "pointer" : "default",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        userSelect: "none",
      }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
          color: active ? "#1a2e1e" : "#887f74",
          transition: "color 0.15s",
        }}>
          {label}
        </span>
        {id && active && (
          <Ic d={sortDir === "asc" ? I.sortU : I.sortD} z={10} s="#1a2e1e" />
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Sticky header — premium light */}
      <div style={{
        display: "grid", gridTemplateColumns: GRID,
        height: 48, alignItems: "stretch",
        background: "#f5f0e8",
        borderBottom: "1px solid #e8e2d8",
        position: "sticky", top: 0, zIndex: 5, flexShrink: 0,
      }}>
        <div style={{ borderRight: HD }} />
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 4, borderRight: HD }}><TH id="numero_offre" label="Référence" /></div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 4, borderRight: HD }}><TH id="client" label="Client" /></div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 4, borderRight: HD }}><TH id="titre_projet" label="Soumission" /></div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 4, borderRight: isAdmin ? HD : "none" }}><TH id="statut" label="Statut" /></div>
        {isAdmin && (
          <>
            <div style={{ display: "flex", alignItems: "center", paddingLeft: 8, borderRight: HD }}><TH label="Délai" /></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 16, borderRight: HD }}><TH id="total_ttc" label="Montant" align="right" /></div>
          </>
        )}
        <div />
      </div>

      {/* Rows */}
      <div className="submission-table-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map((o, idx) => (
          <PremiumTableRow
            key={o.id} o={o} isAdmin={isAdmin} onClick={() => onOpen(o)}
            isActive={selId === o.id} isSelected={selected.includes(o.id)}
            onToggle={onToggle} GRID={GRID} onDuplicate={onDuplicate}
            onDelete={onDelete} idx={idx}
          />
        ))}
      </div>

      {/* Footer: count + pagination + total */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isAdmin ? "1fr auto 1fr" : "auto 1fr",
        alignItems: "center", gap: 12,
        borderTop: "1px solid #e8e2d8",
        background: "#fffdfa", flexShrink: 0,
        padding: "0 16px", height: 48,
      }}>
        {/* Count */}
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          <strong style={{ color: "#374151", fontWeight: 600 }}>{sorted.length}</strong>
          {" "}soumission{sorted.length > 1 ? "s" : ""}
        </span>

        {/* Pagination */}
        {Math.max(1, Math.ceil(total / perPage)) > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8",
                background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                color: page <= 1 ? "#d0c9be" : "#1a2e1e", cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              <Ic d={I.chevL} z={13} />
            </motion.button>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 80, textAlign: "center", userSelect: "none" }}>
              Page {page} / {Math.max(1, Math.ceil(total / perPage))}
            </span>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onPage(p => Math.min(Math.max(1, Math.ceil(total / perPage)), p + 1))}
              disabled={page >= Math.max(1, Math.ceil(total / perPage))}
              style={{
                width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8",
                background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                color: page >= Math.max(1, Math.ceil(total / perPage)) ? "#d0c9be" : "#1a2e1e",
                cursor: page >= Math.max(1, Math.ceil(total / perPage)) ? "default" : "pointer",
              }}
            >
              <Ic d={I.chevR} z={13} />
            </motion.button>
          </div>
        )}

        {/* Total */}
        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Total TTC
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: 0 }}>
                {fmtInt(totalRow)}
              </span>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>DZD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════════════════════════════ */

function DetailPanel({ o, onClose, isAdmin, onStatusChange, onVersement, onDelete, isDesktop, loading }: {
  o: SoumissionView | null; onClose: () => void; isAdmin: boolean;
  onStatusChange: (id: string, s: StatutSoumission) => void;
  onVersement: (s: SoumissionView) => void;
  onDelete: (s: SoumissionView) => void;
  isDesktop: boolean; loading: boolean;
}) {
  const pct = o && o.total_ttc > 0 ? ((o.versement_recu ?? 0) / o.total_ttc) * 100 : 0;
  const next = o ? (NEXT_ST[o.statut] ?? []) : [];

  const sk = (h: number) => (
    <div style={{ height: h, borderRadius: 10, background: "#f3f4f6" }} className="sk" />
  );

  const body = (
    <div className="sc submission-detail-body" style={{ flex: 1, overflowY: "auto", padding: "20px 22px 40px" }}>
      {loading || !o ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sk(72)}{sk(180)}{sk(120)}{sk(140)}
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ flex: 1, paddingRight: 10, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em" }}>{o.numero_offre}</span>
                <StatusBadge st={o.statut} sm />
              </div>
              <p style={{ fontWeight: 700, fontSize: 17, color: "#111827", letterSpacing: 0, lineHeight: 1.3, marginBottom: 10 }}>
                {o.titre_projet}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={o._cn} size={28} />
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{o._cn}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{o._contact} · {formatDateFr(o.date_offre)}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, background: "#f6f6f4",
              border: "1px solid #e5e7eb", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#6b7280", flexShrink: 0, cursor: "pointer",
            }}>
              <Ic d={I.x} z={13} w={2.5} />
            </button>
          </div>

          {/* Status change */}
          {isAdmin && next.length > 0 && (
            <div style={{ background: "#f6f6f4", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                Changer le statut
              </p>
              <div className="submission-status-actions" style={{ display: "flex", gap: 7 }}>
                {next.map(s => {
                  const ns = ST[s];
                  return (
                    <motion.button key={s} whileTap={{ scale: .95 }} onClick={() => onStatusChange(o.id, s)} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: `1.5px solid ${ns.dot}60`, background: ns.bgBadge, color: ns.textBadge,
                      fontWeight: 600, fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer",
                    }}>
                      <Ic d={I.check} z={11} />Marquer {s}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Finances (admin only) */}
          {isAdmin && (
            <div style={{ background: "#f6f6f4", borderRadius: 10, padding: 14, marginBottom: 14, border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>
                Finances
              </p>
              {([
                { l: "Total HT",  v: o.total_ht,  muted: true },
                { l: "TVA 19%",   v: o.tva,       muted: true },
                { l: "Total TTC", v: o.total_ttc, muted: false },
              ] as const).map(({ l, v, muted }, i) => (
                <div key={l} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0", borderBottom: i < 2 ? "1px solid #e5e7eb" : "none",
                }}>
                  <span style={{ fontSize: 13, color: muted ? "#6b7280" : "#111827", fontWeight: muted ? 400 : 600 }}>{l}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, color: muted ? "#6b7280" : "#111827", fontWeight: muted ? 500 : 700 }}>
                    {formatMontant(v)} DZD
                  </span>
                </div>
              ))}
              {pct > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: "#6b7280" }}>Versements</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#2d5a3d" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "#e5e7eb", overflow: "hidden", marginBottom: 8 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .6 }}
                      style={{ height: "100%", borderRadius: 6, background: "#2d5a3d" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: "#2d5a3d", fontWeight: 600 }}>{formatMontant(o.versement_recu ?? 0)} DZD versé</span>
                    <span style={{ fontSize: 11.5, color: "#9ca3af" }}>Reste : {formatMontant(o.total_ttc - (o.versement_recu ?? 0))}</span>
                  </div>
                </div>
              )}
              {o.statut === "Acceptée" && (
                <motion.button whileTap={{ scale: .96 }} onClick={() => onVersement(o)} style={{
                  marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 8,
                  background: "#edf5ee", border: "1.5px solid #4ade8060",
                  color: "#16a34a", fontWeight: 600, fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                }}>
                  <Ic d={I.wallet} z={13} />
                  {(o.versement_recu ?? 0) > 0 ? "Modifier le versement" : "Saisir un versement"}
                </motion.button>
              )}
            </div>
          )}

          {/* Lignes budgétaires */}
          <p style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
            Lignes budgétaires
          </p>
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 16 }}>
            {(o.lignes_budget ?? []).length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>Aucune ligne</div>
            ) : (o.lignes_budget ?? []).map((l: LigneBudget, i: number) => (
              <div key={l.id ?? i} className="submission-budget-row" style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                background: i % 2 === 0 ? "white" : "#f6f6f4",
                borderBottom: i < (o.lignes_budget?.length ?? 0) - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, flexShrink: 0, width: 14, fontWeight: 600 }}>{l.numero}</span>
                <p style={{ flex: 1, fontSize: 13, color: "#111827", lineHeight: 1.5 }}>{l.designation}</p>
                {isAdmin && (
                  <span className="submission-budget-amount" style={{ fontVariantNumeric: "tabular-nums", fontSize: 12.5, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>
                    {formatMontant(l.prix_unitaire * l.quantite)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href={`/soumissions/${o.id}`}>
              <motion.button whileTap={{ scale: .96 }} style={{
                width: "100%", padding: "12px 0", borderRadius: 10,
                background: "#1a2e1e", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                boxShadow: "0 2px 10px rgba(26,46,30,.2)",
              }}>
                <Ic d={I.eye} z={15} />Ouvrir la soumission
              </motion.button>
            </Link>
            {isAdmin && (
              <motion.button whileTap={{ scale: .96 }} onClick={() => onDelete(o)} style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                background: "#fee2e2", border: "1.5px solid #f8717140",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                color: "#dc2626", fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                <Ic d={I.trash} z={15} />Supprimer
              </motion.button>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.10)" }} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 440, zIndex: 201,
          background: "white", borderLeft: "1px solid #e5e7eb",
          boxShadow: "-8px 0 40px rgba(0,0,0,.07)", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", letterSpacing: "-0.3px" }}>Détail soumission</p>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}>
            <Ic d={I.x} z={12} w={2.5} />
          </button>
        </div>
        {body}
      </motion.div>
    </>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.38)", backdropFilter: "blur(4px)" }} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "white", borderRadius: "20px 20px 0 0", maxHeight: "min(90dvh, 760px)", display: "flex", flexDirection: "column" }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "12px auto 0", flexShrink: 0 }} />
        {body}
      </motion.div>
    </>
  );
}

/* ── Modal states ───────────────────────────────────────────── */
interface VersementState { open: boolean; id: string; titre: string; ttc: number; current: number }
const V0: VersementState = { open: false, id: "", titre: "", ttc: 0, current: 0 };
interface DeleteState { open: boolean; id: string; label: string }
const D0: DeleteState = { open: false, id: "", label: "" };

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */

export default function SoumissionsClient() {
  const router = useRouter();
  const bp = useBp();
  const isDesktop = bp === "desktop";

  const { data: soumissionsRes, isLoading: soumissionsLoading, mutate: mutateSoumissions } =
    useSWR<ApiListResponse<Soumission>>("/api/soumissions");
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me");

  const role = meRes?.role ?? "admin";
  const isAdmin = role === "admin" || role === "charge_projet";

  /* View toggle — persisted in localStorage */
  const [view, setView] = useState<"cards" | "table">("cards");
  useEffect(() => {
    const saved = localStorage.getItem("soum-view");
    if (saved === "table" || saved === "cards") setView(saved);
  }, []);
  function switchView(v: "cards" | "table") {
    setView(v);
    localStorage.setItem("soum-view", v);
  }

  const PER_PAGE = !isDesktop ? 6 : view === "cards" ? 9 : 12;

  const soumissions = soumissionsRes?.data ?? [];
  const loading = (soumissionsLoading && !soumissionsRes) || (meLoading && !meRes);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<StatutSoumission | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [selDetail, setSelDetail] = useState<SoumissionView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [versement, setVersement] = useState<VersementState>(V0);
  const [versementInput, setVersementInput] = useState("");
  const [savingVersement, setSavingVersement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toView = useCallback((s: Soumission): SoumissionView => ({
    ...s,
    _cn: s.client?.entreprise ?? "—",
    _contact: s.client ? `${s.client.titre} ${s.client.nom_contact}` : "—",
  }), []);

  useEffect(() => { setPage(1); }, [filtre, q, view]);

  const filtered: SoumissionView[] = soumissions.filter(s => {
    const mF = !filtre || s.statut === filtre;
    const mQ = !q
      || s.titre_projet.toLowerCase().includes(q.toLowerCase())
      || (s.client?.entreprise ?? "").toLowerCase().includes(q.toLowerCase())
      || s.numero_offre.toLowerCase().includes(q.toLowerCase());
    return mF && mQ;
  }).map(toView);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const hasMobilePagination = !isDesktop && filtered.length > 0 && totalPages > 1;

  const counts = Object.fromEntries(
    (["Brouillon", "Envoyée", "Acceptée", "Refusée"] as StatutSoumission[]).map(s => [
      s, soumissions.filter(x => x.statut === s).length,
    ])
  ) as Partial<Record<StatutSoumission, number>>;

  const totalTTC   = soumissions.reduce((s, o) => s + o.total_ttc, 0);
  const nbAccepted = soumissions.filter(o => o.statut === "Acceptée").length;
  const totalVerse = soumissions.reduce((s, o) => s + (o.versement_recu ?? 0), 0);

  const updateSoumissions = useCallback((updater: (items: Soumission[]) => Soumission[]) => {
    mutateSoumissions(
      current => ({ data: updater(current?.data ?? []) }),
      { revalidate: false }
    );
  }, [mutateSoumissions]);

  async function openDetail(o: SoumissionView) {
    setSelId(o.id);
    setSelDetail(o);
    setDetailLoading(true);
    const res = await fetch(`/api/soumissions/${o.id}`);
    const json = await res.json();
    if (json.data) setSelDetail(toView(json.data));
    setDetailLoading(false);
  }

  function closeDetail() { setSelId(null); setSelDetail(null); }

  async function handleStatut(id: string, statut: StatutSoumission) {
    await fetch(`/api/soumissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    updateSoumissions(prev => prev.map(s => s.id === id ? { ...s, statut } : s));
    if (selDetail?.id === id) setSelDetail(prev => prev ? { ...prev, statut } : null);
    if (statut === "Acceptée") {
      const s = soumissions.find(x => x.id === id);
      openVersementFor(id, s?.titre_projet ?? "", s?.total_ttc ?? 0, s?.versement_recu ?? 0);
    }
  }

  function openVersementFor(id: string, titre: string, ttc: number, current: number) {
    setVersementInput(current ? String(current) : "");
    setVersement({ open: true, id, titre, ttc, current });
  }

  async function handleSaveVersement() {
    const montant = parseFloat(versementInput.replace(/\s/g, "").replace(",", ".")) || 0;
    setSavingVersement(true);
    await fetch(`/api/soumissions/${versement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versement_recu: montant }),
    });
    updateSoumissions(prev => prev.map(s => s.id === versement.id ? { ...s, versement_recu: montant } : s));
    if (selDetail?.id === versement.id) setSelDetail(prev => prev ? { ...prev, versement_recu: montant } : null);
    setSavingVersement(false);
    setVersement(V0);
  }

  function handleDelete(s: SoumissionView) {
    setDeleteConfirm({ open: true, id: s.id, label: s.titre_projet });
  }

  async function confirmDelete() {
    setDeletingId(deleteConfirm.id);
    await fetch(`/api/soumissions/${deleteConfirm.id}`, { method: "DELETE" });
    updateSoumissions(prev => prev.filter(s => s.id !== deleteConfirm.id));
    if (selId === deleteConfirm.id) closeDetail();
    setDeletingId(null);
    setDeleteConfirm(D0);
  }

  const handleDuplicate = (s: SoumissionView) => router.push(`/soumissions/${s.id}?duplicate=1`);
  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const px = isDesktop ? 32 : 14;

  return (
    <>
      <style>{CSS}</style>
      <div className={`submission-page-shell ${hasMobilePagination ? "has-mobile-pagination" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%", background: "#faf9f7" }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="submission-hero" style={{
          background: "white", borderBottom: "1px solid #ededeb",
          padding: `24px ${px}px 20px`, flexShrink: 0,
        }}>
          <div className="submission-hero-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isAdmin ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="submission-title" style={{
                fontWeight: 700, fontSize: isDesktop ? 25 : 22, color: "#111827",
                letterSpacing: 0, lineHeight: 1,
              }}>
                Soumissions
              </h1>
              <span style={{
                height: 24, minWidth: 24, padding: "0 8px",
                background: "#f3f4f6", borderRadius: 9999,
                border: "1px solid #e5e7eb",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, color: "#6b7280",
              }}>
                {soumissions.length}
              </span>
            </div>

            <div className="submission-hero-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isAdmin && (
                <a href="/api/soumissions/export" target="_blank" rel="noreferrer">
                  <motion.button whileTap={{ scale: .94 }} style={{
                    height: 36, padding: "0 13px", borderRadius: 9999,
                    border: "1.5px solid #e5e7eb", background: "white",
                    display: "flex", alignItems: "center", gap: 6,
                    color: "#6b7280", fontWeight: 500, fontSize: 13, cursor: "pointer",
                  }}>
                    <Ic d={I.excel} z={13} />
                    {isDesktop && "Excel"}
                  </motion.button>
                </a>
              )}
              {isAdmin && (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .94 }} style={{
                    height: 36, padding: isDesktop ? "0 16px" : "0 13px",
                    borderRadius: 9999, background: "#1a2e1e", border: "none",
                    display: "flex", alignItems: "center", gap: 6,
                    color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(26,46,30,.20)", whiteSpace: "nowrap",
                  }}>
                    <Ic d={I.plus} z={14} />
                    {isDesktop ? "Nouvelle soumission" : "Nouvelle"}
                  </motion.button>
                </Link>
              )}
            </div>
          </div>

          {/* KPI chips (admin) */}
          {isAdmin && (
            <div className="submission-kpis" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Total TTC",  value: `${fmtInt(totalTTC)} DZD`,   icon: I.wallet },
                { label: "Acceptées",  value: String(nbAccepted),            icon: I.check },
                { label: "Versements", value: `${fmtInt(totalVerse)} DZD`,  icon: I.trend },
              ].map(chip => (
                <div key={chip.label} className="submission-kpi" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 13px", borderRadius: 9999,
                  background: "#f3f4f6", border: "1px solid #ededeb",
                }}>
                  <Ic d={chip.icon} z={13} s="#6b7280" />
                  <span className="submission-kpi-label" style={{ fontSize: 11.5, color: "#6b7280" }}>{chip.label}</span>
                  <span className="submission-kpi-value" style={{ fontSize: 12.5, color: "#111827", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {chip.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter + view toggle bar ──────────────────────────── */}
        <div className="submission-tools" style={{
          background: "white", borderBottom: "1px solid #ededeb",
          padding: `12px ${px}px`,
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div className="submission-search" style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", pointerEvents: "none" }}>
              <Ic d={I.search} z={14} />
            </span>
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher client, projet, N° offre…"
              style={{
                width: "100%", paddingLeft: 36, paddingRight: 12, height: 38,
                border: "1.5px solid #e5e7eb", borderRadius: 9999,
                fontSize: 13, color: "#111827", background: "white", outline: "none",
              }}
            />
          </div>

          <FilterDropdown active={filtre} set={setFiltre} counts={counts} />

          {/* View toggle — desktop only */}
          {isDesktop && (
            <div style={{ display: "flex", gap: 2, padding: 3, background: "#f3f4f6", borderRadius: 10, border: "1px solid #ededeb" }}>
              {([
                { id: "cards" as const, icon: I.cards, title: "Vue cards" },
                { id: "table" as const, icon: I.table, title: "Vue tableau" },
              ]).map(btn => (
                <button key={btn.id} title={btn.title} onClick={() => switchView(btn.id)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: view === btn.id ? "white" : "transparent",
                  border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: view === btn.id ? "#1a2e1e" : "#9ca3af",
                  cursor: "pointer",
                  boxShadow: view === btn.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>
                  <Ic d={btn.icon} z={15} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {loading ? (
            /* Skeleton */
            <div style={{ padding: `24px ${px}px`, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 220, borderRadius: 16, background: "white", border: "1px solid #ededeb" }} className="sk" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Ic d={I.file} z={32} s="#9ca3af" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 8, letterSpacing: 0 }}>Aucune soumission</p>
              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>
                {q || filtre
                  ? "Aucun résultat pour ces critères."
                  : isAdmin
                  ? "Créez votre première soumission."
                  : "Aucune soumission disponible."}
              </p>
              {isAdmin && !q && !filtre && (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .96 }} style={{
                    padding: "11px 22px", borderRadius: 9999, background: "#1a2e1e",
                    border: "none", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(26,46,30,.18)",
                  }}>
                    Nouvelle soumission
                  </motion.button>
                </Link>
              )}
            </div>
          ) : (
            /* Views */
            <>
              {(!isDesktop || view === "cards") ? (
                /* Card grid */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                  <div style={{ flex: 1, overflowY: "auto" }} className="sc">
                    <CardGrid
                      items={pageItems} isAdmin={isAdmin} onOpen={openDetail} selId={selId} px={px}
                    />
                  </div>
                  <Pager page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} hideWhenSinglePage={true} />
                </div>
              ) : (
                /* Premium table */
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
                  background: "linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)",
                  margin: "16px 32px 20px",
                  borderRadius: 8,
                  border: "1px solid #e8e2d8",
                  overflow: "hidden",
                  boxShadow: "0 18px 48px rgba(26,46,30,0.07)",
                }}>
                  <PremiumTable
                    items={pageItems} isAdmin={isAdmin} onOpen={openDetail}
                    selId={selId} selected={selected} onToggle={toggleSel}
                    onDuplicate={handleDuplicate} onDelete={handleDelete}
                    page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Detail panel ─────────────────────────────────────── */}
        <AnimatePresence>
          {selId && (
            <DetailPanel
              o={selDetail} onClose={closeDetail} isAdmin={isAdmin}
              onStatusChange={handleStatut}
              onVersement={s => openVersementFor(s.id, s.titre_projet, s.total_ttc, s.versement_recu ?? 0)}
              onDelete={handleDelete} isDesktop={isDesktop} loading={detailLoading}
            />
          )}
        </AnimatePresence>

        {/* ── Delete modal ──────────────────────────────────────── */}
        <AnimatePresence>
          {deleteConfirm.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(D0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
                >
                  <div style={{ padding: "24px 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic d={I.trash} z={20} s="#dc2626" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer cette soumission ?</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280" }}>
                      Cette action est <strong>irréversible</strong>. La soumission et ses lignes budgétaires seront définitivement supprimées.
                    </p>
                  </div>
                  <div className="submission-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(D0)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                      Annuler
                    </button>
                    <motion.button whileTap={{ scale: .97 }} onClick={confirmDelete} disabled={!!deletingId} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}>
                      {deletingId ? "Suppression…" : "Supprimer"}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* ── Versement modal ───────────────────────────────────── */}
        <AnimatePresence>
          {versement.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVersement(V0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
                >
                  <div style={{ padding: "24px 24px 0" }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Versement reçu</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>{versement.titre}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "#f6f6f4", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Montant TTC</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatMontant(versement.ttc)} DZD</span>
                    </div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Montant versé (DZD)</label>
                    <input
                      type="number" value={versementInput} onChange={e => setVersementInput(e.target.value)}
                      placeholder="Ex : 500000" min={0} autoFocus
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", marginBottom: 6 }}
                    />
                    <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 20 }}>Acompte ou paiement partiel reçu du client.</p>
                  </div>
                  <div className="submission-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setVersement(V0)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                      Annuler
                    </button>
                    <motion.button whileTap={{ scale: .97 }} onClick={handleSaveVersement} disabled={savingVersement} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#1a2e1e", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: savingVersement ? .7 : 1 }}>
                      {savingVersement ? "Enregistrement…" : "Enregistrer"}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
