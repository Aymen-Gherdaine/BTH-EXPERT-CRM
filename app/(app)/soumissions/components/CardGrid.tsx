"use client";

import { memo } from "react";
import { m as motion } from "framer-motion";
import { SoumissionView } from "../types";
import { ST, I, fmtInt } from "../constants";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import { Ic } from "./Ic";

// memo : le parent (SoumissionsClient) se re-rend à l'ouverture du panneau de
// détail, des modales, du versement… sans que `pageItems` change. Sans memo,
// toutes les cartes visibles se re-rendraient à chaque fois. Les props sont
// stables (o : même réf tant que pageItems ne change pas ; onOpen : useCallback).
const SoumissionCard = memo(function SoumissionCard({ o, idx, onOpen, isActive }: {
  o: SoumissionView; idx: number; onOpen: (o: SoumissionView) => void; isActive: boolean;
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
        onClick={() => onOpen(o)}
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
        <div style={{ height: 3, background: c.accent, flexShrink: 0 }} />

        <div className="submission-card-body" style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>

          <div className="submission-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
            <StatusBadge st={o.statut} />
            <span style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10.5, color: "#887f74", letterSpacing: 0,
            }}>
              {o.numero_offre}
            </span>
          </div>

          <h3 className="submission-card-title" style={{
            fontSize: 15, fontWeight: 700, color: "#101c12",
            letterSpacing: 0, lineHeight: 1.35, marginBottom: 8,
          }}>
            {o.titre_projet}
          </h3>

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
            {o.total_ttc > 0 && (
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
});

export function CardGrid({ items, onOpen, selId, px }: {
  items: SoumissionView[];
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
          key={o.id} o={o} idx={i}
          onOpen={onOpen} isActive={selId === o.id}
        />
      ))}
    </div>
  );
}
