"use client";

import { useState } from "react";
import Link from "next/link";
import type { Soumission } from "@/types";
import { formatDateFr } from "@/lib/utils";
import { I, SOUM_D, SOUM_GRID, SOUM_HD, fmtInt } from "./lib";
import { Ic, StatusBadge } from "./components";

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

export function SoumissionsTable({ soumissions, canSeeAmounts }: { soumissions: Soumission[]; canSeeAmounts: boolean }) {
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
export function SoumMobileList({ soumissions, canSeeAmounts }: { soumissions: Soumission[]; canSeeAmounts: boolean }) {
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
