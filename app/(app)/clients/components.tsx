"use client";

import type { StatutSoumission } from "@/types";
import { ST, aColor } from "./lib";

export function Ic({ d, z = 18, s = "currentColor", f = "none", w = 1.6 }: {
  d: string | string[]; z?: number; s?: string; f?: string; w?: number;
}) {
  return (
    <svg width={z} height={z} viewBox="0 0 24 24" fill={f} stroke={s}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
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

export function StatusBadge({ st }: { st: StatutSoumission }) {
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
