"use client";

import type { EtapeProspect } from "@/types";
import {
  RCFG,
  RESULTAT_LABELS,
  avColor,
  getEtapeCfg,
  type SortCol,
  type SortDir,
} from "./lib";

export function ResultatBadge({ resultat, sm }: { resultat: string; sm?: boolean }) {
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

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
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

export function ActionIcon({ r }: { r: string }) {
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

export function TH({ label, id, sortCol, sortDir, onSort, align = "left" }: {
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
        color: active ? "#1a2e1e" : "#887f74",
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

export function EtapeBadge({ etape }: { etape: EtapeProspect }) {
  const cfg = getEtapeCfg(etape);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 7px", borderRadius: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text,
      fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
