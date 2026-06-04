"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import useSWR from "swr";
import { Client, Soumission, StatutSoumission, UserRole } from "@/types";
import { formatDateFr } from "@/lib/utils";
import { useDynamicPerPage } from "@/hooks/useDynamicPerPage";
import { useToast } from "@/components/ui/Toast";

/* ── CSS global ─────────────────────────────────────────── */
const CSS = `
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
  .clients-shell {
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 38%, #f7f2ea 100%);
    color: #1a1714;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .clients-header {
    padding: 24px clamp(16px, 3vw, 40px) 18px;
    border-bottom: 1px solid #e8e2d8;
    background: rgba(255,255,255,.92);
    flex-shrink: 0;
  }
  .clients-header-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: start;
  }
  .clients-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #7c6238;
    font-size: 11px;
    font-weight: 800;
  }
  .clients-kicker::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .clients-title {
    margin: 0;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.02;
  }
  .clients-subtitle {
    margin-top: 7px;
    color: #887f74;
    font-size: 13px;
  }
  .clients-export {
    height: 40px;
    padding: 0 15px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 8px 22px rgba(26,46,30,.05);
  }
  .clients-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 18px;
  }
  .clients-stat {
    min-height: 76px;
    border-radius: 14px;
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.78);
    padding: 13px 14px;
    box-shadow: 0 14px 34px rgba(26,46,30,.05);
  }
  .clients-stat-label {
    color: #887f74;
    font-size: 10.5px;
    font-weight: 650;
  }
  .clients-stat-value {
    margin-top: 8px;
    color: #1a2e1e;
    font-size: 17px;
    font-weight: 750;
    line-height: 1;
  }
  .clients-stat-note {
    margin-top: 5px;
    color: #887f74;
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .clients-search-wrap {
    position: relative;
    margin-top: 16px;
  }
  .clients-search-icon,
  .clients-clear {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .clients-search-icon {
    left: 15px;
    color: #887f74;
    pointer-events: none;
  }
  .clients-clear {
    right: 12px;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 9999px;
    background: #f5f0e8;
    color: #887f74;
    cursor: pointer;
  }
  .clients-search {
    width: 100%;
    height: 44px;
    box-sizing: border-box;
    padding: 0 44px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #1a1714;
    font-size: 13px;
    outline: none;
    box-shadow: 0 10px 28px rgba(26,46,30,.04);
  }
  .clients-search:focus {
    border-color: #1a2e1e;
    box-shadow: 0 0 0 4px rgba(26,46,30,.10);
  }
  .clients-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .clients-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 0;
  }
  .clients-empty {
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 42px 20px;
    border: 1px solid #e8e2d8;
    border-radius: 16px;
    background: rgba(255,255,255,.78);
    box-shadow: 0 18px 46px rgba(26,46,30,.06);
  }
  .clients-empty-icon {
    width: 62px;
    height: 62px;
    border-radius: 14px;
    background: #1a2e1e;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
  }
  .clients-table-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
  }
  .clients-table-head {
    background: #fbfaf7;
    border-bottom: 1px solid #e8e2d8;
  }
  .clients-pagination {
    background: #fbfaf7;
    border-top: 1px solid #e8e2d8;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 24px;
    flex-shrink: 0;
  }
  .clients-page-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #e8e2d8;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 150ms, border-color 150ms;
  }
  .clients-page-btn:not(:disabled):hover {
    background: #f0ebe3;
    border-color: #d0c9be;
  }
  @media (max-width: 767px) {
    .clients-shell.clients-has-mobile-pagination {
      padding-bottom: calc(62px + env(safe-area-inset-bottom));
    }
    .clients-header {
      padding: 18px 14px 16px;
    }
    .clients-header-top {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
    }
    .clients-title {
      font-size: 25px;
    }
    .clients-subtitle {
      max-width: 24rem;
      font-size: 13px;
      line-height: 1.45;
    }
    .clients-export {
      width: auto;
      justify-content: center;
      padding: 0 13px;
      height: 38px;
    }
    .clients-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      overflow: visible;
      padding-bottom: 4px;
    }
    .clients-stat {
      min-height: 88px;
      border-radius: 12px;
      padding: 13px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .clients-stat:last-child { grid-column: 1 / -1; }
    .clients-stat-label {
      font-size: 11px;
      line-height: 1.25;
      white-space: nowrap;
    }
    .clients-stat-value {
      margin-top: 9px;
      font-size: 17px;
      line-height: 1.05;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .clients-stat-note {
      margin-top: 7px;
      font-size: 12px;
      line-height: 1.25;
      white-space: nowrap;
    }
    .clients-content {
      padding: 14px 14px 12px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .clients-list {
      gap: 12px;
      padding-bottom: 12px;
    }
    .clients-client-card {
      border-radius: 18px !important;
      box-shadow: 0 14px 34px rgba(26,46,30,.07) !important;
    }
    .clients-card-main {
      display: grid !important;
      grid-template-columns: 48px minmax(0, 1fr) 36px;
      align-items: center !important;
      gap: 10px !important;
      min-height: 90px;
      padding: 16px 12px 16px 16px !important;
    }
    .clients-card-actions {
      align-self: stretch;
      justify-content: center;
      gap: 0 !important;
    }
    .clients-card-delete { display: none !important; }
    .clients-client-card.clients-expanded .clients-card-actions {
      justify-content: space-between;
      gap: 6px !important;
    }
    .clients-client-card.clients-expanded .clients-card-delete { display: flex !important; }
    .clients-card-contact {
      margin-top: 4px !important;
      font-size: 12.5px !important;
      line-height: 1.35 !important;
      color: #6f675e !important;
      white-space: normal !important;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .clients-card-name {
      font-size: 14px !important;
      line-height: 1.2 !important;
      letter-spacing: 0 !important;
    }
    .clients-card-avatar {
      padding: 3px !important;
    }
    .clients-card-chips {
      margin-top: 9px !important;
      gap: 6px !important;
    }
    .clients-card-chip {
      min-height: 21px;
      padding: 3px 8px !important;
      font-size: 10.5px !important;
      max-width: 100%;
    }
    .clients-address-chip {
      max-width: 100%;
      white-space: normal !important;
      line-height: 1.35;
    }
    .clients-pagination {
      grid-template-columns: 1fr auto;
      padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(56px + env(safe-area-inset-bottom));
      z-index: 19;
      box-shadow: 0 -10px 28px rgba(26,46,30,.06);
    }
    .clients-pagination-spacer { display: none; }
    .clients-modal-actions { flex-direction: column-reverse; }
  }
`;


function fmtInt(n: number) {
  return Math.round(n).toLocaleString("fr-DZ", { maximumFractionDigits: 0 });
}

/* ── Soumissions mini-table ─────────────────────────────── */
const SOUM_GRID = "130px 1fr 110px 60px 140px";
const SOUM_D    = "1px solid #f0ebe3";
const SOUM_HD   = "1px solid #e8e2d8";

/* ── Clients table ──────────────────────────────────────── */
const CT_GRID = "220px 1fr 120px 130px 88px";
const CT_D    = "1px solid #f0ebe3";
const CT_HD   = "1px solid #e8e2d8";

function SoumTableRow({ s, canSeeAmounts }: { s: Soumission; canSeeAmounts: boolean }) {
  const [hov, setHov] = useState(false);
  const grid = canSeeAmounts ? SOUM_GRID : "130px 1fr 110px 60px";
  return (
    <Link href={`/soumissions/${s.id}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "grid", gridTemplateColumns: grid,
          minHeight: 52, alignItems: "stretch",
          borderBottom: "1px solid #f1f5f9",
          background: hov ? "#fafafa" : "white",
          boxShadow: hov ? "inset 3px 0 0 #1a2e1e" : "inset 3px 0 0 transparent",
          transition: "background 0.12s, box-shadow 0.12s",
          cursor: "pointer",
        }}
      >
        {/* N° Offre */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRight: SOUM_D }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151",
            fontFamily: "var(--font-inter)", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
            {s.numero_offre}
          </span>
        </div>
        {/* Titre + date */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 14px", borderRight: SOUM_D, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.titre_projet}
          </p>
          <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>
            {formatDateFr(s.date_offre)}
          </p>
        </div>
        {/* Statut */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRight: SOUM_D }}>
          <StatusBadge st={s.statut} />
        </div>
        {/* Délai */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRight: SOUM_D }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              {s.delai_jours}
            </span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af" }}>j</span>
          </span>
        </div>
        {canSeeAmounts && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 14px" }}>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                {fmtInt(s.total_ttc)}
              </span>
              <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 500 }}>DZD</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function SoumissionsTable({ soumissions, canSeeAmounts }: { soumissions: Soumission[]; canSeeAmounts: boolean }) {
  if (soumissions.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "white", borderRadius: 10, border: "1px solid #f1f5f9" }}>
        <Ic d={I.file} z={16} s="#d1d5db" />
        <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
          Aucune soumission pour ce client.
        </p>
      </div>
    );
  }

  const headers = [
    { label: "N° Offre",     right: false },
    { label: "Titre projet", right: false },
    { label: "Statut",       right: false },
    { label: "Délai",        right: false },
    ...(canSeeAmounts ? [{ label: "Montant TTC", right: true }] : []),
  ];
  const grid = canSeeAmounts ? SOUM_GRID : "130px 1fr 110px 60px";
  const minWidth = canSeeAmounts ? 530 : 390;

  return (
    <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", overflowX: "auto" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: grid, minWidth,
        height: 40, alignItems: "stretch",
        background: "#fafafa", borderBottom: "1.5px solid #e5e7eb",
      }}>
        {headers.map(({ label, right }, i) => (
          <div key={label} style={{
            padding: "0 14px", display: "flex", alignItems: "center",
            justifyContent: right ? "flex-end" : "flex-start",
            borderRight: i < headers.length - 1 ? SOUM_HD : "none",
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#9ca3af" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
      {/* Rows */}
      <div style={{ minWidth }}>
        {soumissions.map(s => <SoumTableRow key={s.id} s={s} canSeeAmounts={canSeeAmounts} />)}
      </div>
    </div>
  );
}

/* ── Soumissions mobile list (no horizontal scroll) ─────── */
function SoumMobileList({ soumissions, canSeeAmounts }: { soumissions: Soumission[]; canSeeAmounts: boolean }) {
  if (soumissions.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "white", borderRadius: 10, border: "1px solid #f1f5f9" }}>
        <Ic d={I.file} z={16} s="#d1d5db" />
        <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
          Aucune soumission pour ce client.
        </p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {soumissions.map(s => (
        <Link key={s.id} href={`/soumissions/${s.id}`} onClick={e => e.stopPropagation()}
          style={{ textDecoration: "none", display: "block" }}>
          <div style={{
            background: "white", borderRadius: 10,
            border: "1px solid #f1f5f9", padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "#374151",
                fontFamily: "var(--font-inter)", letterSpacing: "0.02em" }}>
                {s.numero_offre}
              </span>
              <StatusBadge st={s.statut} />
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: "#111827", marginBottom: 4,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.titre_projet}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDateFr(s.date_offre)}</span>
              {canSeeAmounts && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                  {fmtInt(s.total_ttc)}{" "}
                  <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 500 }}>DZD</span>
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

interface ClientWithSoumissions extends Client {
  soumissions?: Soumission[];
}

type ApiListResponse<T> = { data?: T[] };

/* ── Status config ──────────────────────────────────────── */
type StCfg = { dot: string; bgBadge: string; textBadge: string; border: string; accentBar: string };
const ST: Record<StatutSoumission, StCfg> = {
  Brouillon: { dot: "#94a3b8", bgBadge: "#f8fafc", textBadge: "#475569", border: "#e2e8f0", accentBar: "#94a3b8" },
  Envoyée:   { dot: "#3b82f6", bgBadge: "#eff6ff", textBadge: "#2563eb", border: "#bfdbfe", accentBar: "#3b82f6" },
  Acceptée:  { dot: "#22c55e", bgBadge: "#f0fdf4", textBadge: "#15803d", border: "#bbf7d0", accentBar: "#22c55e" },
  Refusée:   { dot: "#f43f5e", bgBadge: "#fff1f2", textBadge: "#be123c", border: "#fecdd3", accentBar: "#f43f5e" },
};

/* ── Icon ───────────────────────────────────────────────── */
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

/* ── Avatar ─────────────────────────────────────────────── */
const AVATAR_COLORS = ["#1a2e1e","#2d5a3d","#1a3a4e","#3d6b4f","#4a3a1e","#2a4a3e","#3a2e4e"];
const aCache: Record<string, string> = {};
function aColor(n: string) {
  if (aCache[n]) return aCache[n];
  const h = n.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (aCache[n] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: aColor(name || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: Math.floor(size * 0.4),
      flexShrink: 0, letterSpacing: "-0.5px",
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ── StatusBadge ────────────────────────────────────────── */
function StatusBadge({ st }: { st: StatutSoumission }) {
  const c = ST[st];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 7px", borderRadius: 5,
      background: c.bgBadge, border: `1px solid ${c.border}`,
      color: c.textBadge, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {st}
    </span>
  );
}

/* ── Delete state ───────────────────────────────────────── */
interface DeleteState { open: boolean; id: string; label: string }
const D0: DeleteState = { open: false, id: "", label: "" };

/* ── useBp ──────────────────────────────────────────────── */
function useBp() {
  const [bp, setBp] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setBp(mq.matches ? "desktop" : "mobile");
    const fn = (e: MediaQueryListEvent) => setBp(e.matches ? "desktop" : "mobile");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return bp;
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE CLIENT
══════════════════════════════════════════════════════════ */
export default function ClientsPageClient({
  initialClients,
  initialRole,
}: {
  initialClients: ClientWithSoumissions[];
  initialRole: UserRole | null;
}) {
  const bp = useBp();
  const isDesktop = bp === "desktop";
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: expandedSoumRes, isLoading: expandedSoumLoading } = useSWR<ApiListResponse<Soumission>>(
    expandedId ? `/api/soumissions?client_id=${expandedId}` : null,
    { revalidateOnMount: true, keepPreviousData: false }
  );
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const clientsUrl = debouncedSearch ? `/api/clients?q=${encodeURIComponent(debouncedSearch)}` : "/api/clients";
  const { data: clientsRes, isLoading: clientsLoading, mutate: mutateClients } =
    useSWR<ApiListResponse<ClientWithSoumissions>>(
      clientsUrl,
      { fallbackData: debouncedSearch ? undefined : { data: initialClients } }
    );

  const role = initialRole;
  const canSeeAmounts = role === "admin" || role === "charge_projet";
  const clients = clientsRes?.data ?? [];
  const loading = clientsLoading && !clientsRes;
  // tableHeaderHeight=44: sticky header row; pagerHeight=40: pagination bar inside outer wrapper
  const perPage = useDynamicPerPage(gridRef, { view: "table", isDesktop, rowHeight: 64, tableHeaderHeight: 44, pagerHeight: 40, mobilePerPage: 6, safetyPx: 20 }, [loading]);

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function askDelete(c: ClientWithSoumissions, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteConfirm({ open: true, id: c.id, label: c.entreprise });
  }

  async function confirmDelete() {
    const targetId = deleteConfirm.id;
    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/clients/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      mutateClients(
        current => ({ data: (current?.data ?? []).filter(c => c.id !== targetId) }),
        { revalidate: false }
      );
      if (expandedId === targetId) setExpandedId(null);
      setDeleteConfirm(D0);
      toast.success("Client supprimé.");
    } catch {
      toast.error("La suppression a échoué. Le client a peut-être des soumissions liées.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(clients.length / perPage));
  const paginated = useMemo(
    () => clients.slice((page - 1) * perPage, page * perPage),
    [clients, page, perPage]
  );
  const cityCount = useMemo(
    () => new Set(clients.map(c => c.ville).filter(Boolean)).size,
    [clients]
  );
  const latestClient = clients[0];
  const showPagination = !loading && clients.length > 0 && totalPages > 1;

  return (
    <>
      <style>{CSS}</style>
      <div className={`clients-shell ${showPagination && bp !== "desktop" ? "clients-has-mobile-pagination" : ""}`}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="clients-header">
          <div className="clients-header-top">
            <div>
              <div className="clients-kicker">Portefeuille</div>
              <h1 className="clients-title">Clients</h1>
              <p className="clients-subtitle">
                {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}, suivi commercial et historique des soumissions.
              </p>
            </div>
            <a href="/api/clients/export" target="_blank" rel="noreferrer" className="clients-export">
              <Ic d={I.download} z={14} />
              Export
            </a>
          </div>

          <div className="clients-summary">
            <div className="clients-stat">
              <div className="clients-stat-label">Base clients</div>
              <div className="clients-stat-value">{clients.length}</div>
              <div className="clients-stat-note">contacts actifs</div>
            </div>
            <div className="clients-stat">
              <div className="clients-stat-label">Présence</div>
              <div className="clients-stat-value">{cityCount}</div>
              <div className="clients-stat-note">ville{cityCount > 1 ? "s" : ""} couverte{cityCount > 1 ? "s" : ""}</div>
            </div>
            <div className="clients-stat">
              <div className="clients-stat-label">Dernière entrée</div>
              <div className="clients-stat-value" style={{ fontSize: 17 }}>
                {latestClient ? latestClient.entreprise : "-"}
              </div>
              <div className="clients-stat-note">
                {latestClient ? formatDateFr(latestClient.created_at) : "Aucun client"}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="clients-search-wrap">
            <span className="clients-search-icon">
              <Ic d={I.search} z={15} />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par entreprise ou contact..."
              className="clients-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="clients-clear" aria-label="Effacer la recherche">
                <Ic d={I.x} z={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="clients-content">
          {loading ? (
            bp === "desktop" ? (
              <div style={{ flex: 1, margin: "16px 32px 20px", borderRadius: 8, border: "1px solid #e8e2d8", overflow: "hidden", boxShadow: "0 18px 48px rgba(26,46,30,0.07)" }}>
                <div className="sk" style={{ height: 44, background: "#fbfaf7", borderBottom: "1px solid #e8e2d8" }} />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="sk" style={{ height: 64, background: "white", borderBottom: "1px solid #f1ece4" }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 14px 12px" }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="sk" style={{ height: 82, borderRadius: 14, background: "white", border: "1px solid #ededeb" }} />
                ))}
              </div>
            )
          ) : clients.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
              <div className="clients-empty" style={{ width: "100%", maxWidth: 480 }}>
                <div className="clients-empty-icon">
                  <Ic d={I.user} z={28} s="white" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#1a1714", marginBottom: 8 }}>
                  Aucun client
                </p>
                <p style={{ fontSize: 14, color: "#887f74", lineHeight: 1.6, maxWidth: 340 }}>
                  {search
                    ? "Aucun résultat pour cette recherche."
                    : "Les clients sont créés automatiquement lors d'une soumission."}
                </p>
              </div>
            </div>
          ) : bp === "desktop" ? (
            <div ref={gridRef} style={{
              flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
              margin: "16px 32px 20px", borderRadius: 8,
              border: "1px solid #e8e2d8", overflow: "hidden",
              boxShadow: "0 18px 48px rgba(26,46,30,0.07)",
              background: "linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)",
            }}>
              <ClientsTable
                clients={paginated}
                expandedId={expandedId}
                expandedSoumissions={expandedSoumRes?.data ?? []}
                expandedSoumLoading={expandedSoumLoading}
                canSeeAmounts={canSeeAmounts}
                onToggle={toggleExpand}
                onDelete={askDelete}
              />
              {showPagination && (
                <div className="clients-pagination">
                  <span style={{ fontSize: 11, color: "#a09690", letterSpacing: "0.01em" }}>
                    <strong style={{ color: "#1a1714", fontWeight: 600 }}>{clients.length}</strong>
                    {" "}client{clients.length !== 1 ? "s" : ""}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                      className="clients-page-btn"
                      style={{ color: page <= 1 ? "#d0c9be" : "#3d5c41", cursor: page <= 1 ? "default" : "pointer" }}
                    >
                      <Ic d={I.chevL} z={12} />
                    </motion.button>
                    <span style={{ fontSize: 11, color: "#887f74", fontWeight: 500, minWidth: 52, textAlign: "center", userSelect: "none", letterSpacing: "0.02em" }}>
                      {page} / {totalPages}
                    </span>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="clients-page-btn"
                      style={{ color: page >= totalPages ? "#d0c9be" : "#3d5c41", cursor: page >= totalPages ? "default" : "pointer" }}
                    >
                      <Ic d={I.chevR} z={12} />
                    </motion.button>
                  </div>
                  <div className="clients-pagination-spacer" />
                </div>
              )}
            </div>
          ) : (
            <div className="clients-list">
              <AnimatePresence>
                {paginated.map((client, idx) => (
                  <ClientCard
                    key={client.id} client={client} idx={idx}
                    isExpanded={expandedId === client.id}
                    soumissions={expandedId === client.id ? (expandedSoumRes?.data ?? []) : []}
                    isLoadingSoum={expandedId === client.id && expandedSoumLoading}
                    canSeeAmounts={canSeeAmounts}
                    onToggle={() => toggleExpand(client.id)}
                    onDelete={askDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Pagination mobile (fixed) ──────────────────────── */}
        {showPagination && bp !== "desktop" && (
          <div className="clients-pagination">
            <span style={{ fontSize: 11, color: "#a09690", letterSpacing: "0.01em" }}>
              <strong style={{ color: "#1a1714", fontWeight: 600 }}>{clients.length}</strong>
              {" "}client{clients.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="clients-page-btn"
                style={{ color: page <= 1 ? "#d0c9be" : "#3d5c41", cursor: page <= 1 ? "default" : "pointer" }}
              >
                <Ic d={I.chevL} z={12} />
              </motion.button>
              <span style={{ fontSize: 11, color: "#887f74", fontWeight: 500, minWidth: 52, textAlign: "center", userSelect: "none", letterSpacing: "0.02em" }}>
                {page} / {totalPages}
              </span>
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="clients-page-btn"
                style={{ color: page >= totalPages ? "#d0c9be" : "#3d5c41", cursor: page >= totalPages ? "default" : "pointer" }}
              >
                <Ic d={I.chevR} z={12} />
              </motion.button>
            </div>
            <div className="clients-pagination-spacer" />
          </div>
        )}

        {/* ── Delete modal ─────────────────────────────────── */}
        <AnimatePresence>
          {deleteConfirm.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirm(D0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }}
              />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .95, y: 8 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
                >
                  <div style={{ padding: "24px 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic d={I.trash} z={20} s="#dc2626" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer ce client ?</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                      </div>
                    </div>
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                        Toutes les soumissions associées seront supprimées définitivement.
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280" }}>Cette action est irréversible.</p>
                  </div>
                  <div className="clients-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(D0)} style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "1.5px solid #d0c9be", background: "white", fontSize: 13, fontWeight: 700, color: "#635c54", cursor: "pointer" }}>
                      Annuler
                    </button>
                    <motion.button whileTap={{ scale: .97 }} onClick={confirmDelete} disabled={!!deletingId}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "none", background: "#c44a3a", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}
                    >
                      {deletingId ? "Suppression…" : "Supprimer"}
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

/* ══════════════════════════════════════════════════════════
   CLIENT CARD (mobile)
══════════════════════════════════════════════════════════ */
function ClientCard({ client, idx, isExpanded, soumissions, isLoadingSoum, canSeeAmounts, onToggle, onDelete }: {
  client: ClientWithSoumissions; idx: number; isExpanded: boolean;
  soumissions: Soumission[]; isLoadingSoum: boolean;
  canSeeAmounts: boolean;
  onToggle: () => void;
  onDelete: (c: ClientWithSoumissions, e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.22, ease: "easeOut" }}
      className={`clients-client-card ${isExpanded ? "clients-expanded" : ""}`}
      style={{
        background: "white", borderRadius: 16, overflow: "hidden",
        position: "relative",
        border: `1px solid ${isExpanded ? "#c9a96e" : "#e8e2d8"}`,
        boxShadow: isExpanded
          ? "0 14px 34px rgba(26,46,30,0.11)"
          : "0 10px 28px rgba(26,46,30,0.05)",
        transition: "border-color 0.18s, box-shadow 0.18s",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: "#C9A96E",
        opacity: isExpanded ? 1 : 0,
        transition: "opacity 0.18s",
        borderRadius: "16px 0 0 16px",
        zIndex: 1,
      }} />

      {/* ── Main row ────────────────────────────────────── */}
      <div
        className="clients-card-main"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 12px 13px 16px",
          cursor: "pointer",
          background: hov && !isExpanded ? "#fffdfa" : "white",
          transition: "background 0.12s",
        }}
      >
        {/* Avatar with ring on expand */}
        <div className="clients-card-avatar" style={{
          flexShrink: 0,
          padding: 2,
          borderRadius: "50%",
          background: isExpanded ? "#1a2e1e15" : "transparent",
          transition: "background 0.18s",
        }}>
          <Avatar name={client.entreprise} size={40} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="clients-card-name" style={{
            fontSize: 14.5, fontWeight: 700,
            color: isExpanded ? "#1a2e1e" : "#1a1714",
            letterSpacing: "-0.35px", lineHeight: 1.25,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            transition: "color 0.18s",
          }}>
            {client.entreprise}
          </p>
          <p className="clients-card-contact" style={{
            fontSize: 12, color: "#6b7280", marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {client.titre} {client.nom_contact}
            {client.poste && <span style={{ color: "#9ca3af" }}> · {client.poste}</span>}
          </p>
          {/* Meta chips */}
          <div className="clients-card-chips" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {client.ville && (
              <span className="clients-card-chip" style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10.5, color: "#6b7280", fontWeight: 500,
                background: "#f5f0e8", borderRadius: 9999, padding: "2px 8px",
              }}>
                <Ic d={I.mapPin} z={9} s="#9ca3af" />
                {client.ville}
              </span>
            )}
            <span className="clients-card-chip" style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10.5, color: "#9ca3af",
              background: "#fbfaf7", border: "1px solid #e8e2d8",
              borderRadius: 9999, padding: "2px 8px",
            }}>
              <Ic d={I.calendar} z={9} s="#c4c8cd" />
              {formatDateFr(client.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="clients-card-actions" style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <button
            className="clients-card-delete"
            title="Supprimer le client"
            onClick={e => onDelete(client, e)}
            style={{
              width: 32, height: 32, borderRadius: 9999,
              background: hov ? "#fff2ed" : "#fbfaf7",
              border: `1px solid ${hov ? "#f0b9ad" : "#e8e2d8"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hov ? "#e11d48" : "#9ca3af",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Ic d={I.trash} z={13} />
          </button>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{
              width: 32, height: 32, borderRadius: 9999,
              background: isExpanded ? "#1a2e1e" : "#f8fafc",
              border: `1px solid ${isExpanded ? "#1a2e1e" : "#e8e2d8"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <Ic d={I.chevD} z={15} s={isExpanded ? "white" : "#9ca3af"} />
          </motion.div>
        </div>
      </div>

      {/* ── Expanded: soumissions ────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid #f1f5f9", background: "#fafafa", padding: "14px 16px 18px" }}>
              {/* Address chip */}
              {client.adresse && (
                <div style={{ marginBottom: 12 }}>
                  <span className="clients-address-chip" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    maxWidth: "100%",
                    fontSize: 11.5, color: "#374151",
                    background: "#f3f4f6", border: "1px solid #e5e7eb",
                    borderRadius: 6, padding: "3px 9px",
                  }}>
                    <Ic d={I.building} z={11} s="#6b7280" />
                    {client.adresse}
                  </span>
                </div>
              )}

              <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Soumissions
              </p>

              {isLoadingSoum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[1, 2, 3].map(j => (
                    <div key={j} className="sk" style={{ height: 44, borderRadius: 8, background: "white", border: "1px solid #ededeb" }} />
                  ))}
                </div>
              ) : (
                <SoumMobileList soumissions={soumissions} canSeeAmounts={canSeeAmounts} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLIENT TABLE ROW (desktop)
══════════════════════════════════════════════════════════ */
function ClientTableRow({ client, isExpanded, soumissions, isLoadingSoum, canSeeAmounts, onToggle, onDelete }: {
  client: ClientWithSoumissions;
  isExpanded: boolean;
  soumissions: Soumission[];
  isLoadingSoum: boolean;
  canSeeAmounts: boolean;
  onToggle: () => void;
  onDelete: (c: ClientWithSoumissions, e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onToggle}
        style={{
          display: "grid", gridTemplateColumns: CT_GRID,
          minHeight: 64, alignItems: "stretch",
          background: hov || isExpanded ? "#fffdfa" : "white",
          boxShadow: hov || isExpanded ? "inset 3px 0 0 #C9A96E" : "inset 3px 0 0 transparent",
          borderBottom: "1px solid #f0ebe3",
          cursor: "pointer",
          transition: "background 0.12s, box-shadow 0.12s",
        }}
      >
        {/* Entreprise */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderRight: CT_D, minWidth: 0 }}>
          <Avatar name={client.entreprise} size={36} />
          <span style={{
            fontSize: 13, fontWeight: 700, color: isExpanded ? "#1a2e1e" : "#1a1714",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            transition: "color 0.15s",
          }}>
            {client.entreprise}
          </span>
        </div>
        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 16px", borderRight: CT_D, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: "#1a1714", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {client.titre} {client.nom_contact}
          </span>
          {client.poste && (
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {client.poste}
            </span>
          )}
        </div>
        {/* Ville */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderRight: CT_D }}>
          {client.ville ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#635c54" }}>
              <Ic d={I.mapPin} z={11} s="#a8874e" />
              {client.ville}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
          )}
        </div>
        {/* Client depuis */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderRight: CT_D }}>
          <span style={{ fontSize: 12.5, color: "#635c54" }}>
            {formatDateFr(client.created_at)}
          </span>
        </div>
        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px" }}>
          <button
            title="Supprimer le client"
            onClick={e => onDelete(client, e)}
            style={{
              width: 32, height: 32, borderRadius: 9999,
              background: hov ? "#fff2ed" : "#fbfaf7",
              border: `1px solid ${hov ? "#f0b9ad" : "#e8e2d8"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hov ? "#e11d48" : "#9ca3af",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Ic d={I.trash} z={13} />
          </button>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{ color: isExpanded ? "#1a2e1e" : "#9ca3af", display: "flex", alignItems: "center" }}
          >
            <Ic d={I.chevD} z={18} />
          </motion.div>
        </div>
      </div>

      {/* Expanded soumissions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9", padding: "14px 20px 18px" }}>
              {client.adresse && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11.5, color: "#374151",
                    background: "#f3f4f6", border: "1px solid #e5e7eb",
                    borderRadius: 6, padding: "3px 9px",
                  }}>
                    <Ic d={I.building} z={11} s="#6b7280" />
                    {client.adresse}
                  </span>
                </div>
              )}
              <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Soumissions
              </p>
              {isLoadingSoum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[1, 2, 3].map(j => (
                    <div key={j} className="sk" style={{ height: 44, borderRadius: 8, background: "white", border: "1px solid #ededeb" }} />
                  ))}
                </div>
              ) : (
                <SoumissionsTable soumissions={soumissions} canSeeAmounts={canSeeAmounts} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLIENTS TABLE (desktop)
══════════════════════════════════════════════════════════ */
function ClientsTable({ clients, expandedId, expandedSoumissions, expandedSoumLoading, canSeeAmounts, onToggle, onDelete }: {
  clients: ClientWithSoumissions[];
  expandedId: string | null;
  expandedSoumissions: Soumission[];
  expandedSoumLoading: boolean;
  canSeeAmounts: boolean;
  onToggle: (id: string) => void;
  onDelete: (c: ClientWithSoumissions, e: React.MouseEvent) => void;
}) {
  const headers = [
    { label: "Entreprise",    justify: "flex-start" },
    { label: "Contact",       justify: "flex-start" },
    { label: "Ville",         justify: "flex-start" },
    { label: "Client depuis", justify: "flex-start" },
    { label: "",              justify: "center"     },
  ];

  return (
    <div className="clients-table-shell">
      {/* Sticky header */}
      <div style={{
        display: "grid", gridTemplateColumns: CT_GRID,
        height: 44, alignItems: "stretch",
        background: "#fbfaf7", borderBottom: "1px solid #e8e2d8",
        position: "sticky", top: 0, zIndex: 2,
      }}>
        {headers.map(({ label, justify }, i) => (
          <div key={i} style={{
            padding: "0 16px", display: "flex", alignItems: "center",
            justifyContent: justify,
            borderRight: i < headers.length - 1 ? CT_HD : "none",
          }}>
            {label && (
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>
                {label}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {clients.map(client => (
          <ClientTableRow
            key={client.id}
            client={client}
            isExpanded={expandedId === client.id}
            soumissions={expandedId === client.id ? expandedSoumissions : []}
            isLoadingSoum={expandedId === client.id && expandedSoumLoading}
            canSeeAmounts={canSeeAmounts}
            onToggle={() => onToggle(client.id)}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
