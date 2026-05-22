"use client";

import { StatutSoumission } from "@/types";
import { ST } from "../constants";

export function StatusBadge({ st, sm = false }: { st: StatutSoumission; sm?: boolean }) {
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
