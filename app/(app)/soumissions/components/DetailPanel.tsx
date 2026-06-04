"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StatutSoumission, LigneBudget } from "@/types";
import { formatMontant, formatDateFr } from "@/lib/utils";
import { SoumissionView } from "../types";
import { NEXT_ST, ST, I } from "../constants";
import { Ic } from "./Ic";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";

export function DetailPanel({ o, onClose, isAdmin, onStatusChange, onVersement, onDelete, isDesktop, loading }: {
  o: SoumissionView | null; onClose: () => void; isAdmin: boolean;
  onStatusChange: (id: string, s: StatutSoumission) => void;
  onVersement: (s: SoumissionView) => void;
  onDelete: (s: SoumissionView) => void;
  isDesktop: boolean; loading: boolean;
}) {
  const pct = o && o.total_ttc > 0 ? ((o.versement_recu ?? 0) / o.total_ttc) * 100 : 0;
  const next = o ? (NEXT_ST[o.statut] ?? []) : [];

  // Échap pour fermer le panneau de détail
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
            <button onClick={onClose} aria-label="Fermer le détail" style={{
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
        role="dialog" aria-modal="true" aria-label="Détail soumission"
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
          <button onClick={onClose} aria-label="Fermer le détail" style={{ width: 28, height: 28, borderRadius: 7, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}>
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
        role="dialog" aria-modal="true" aria-label="Détail soumission"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "white", borderRadius: "20px 20px 0 0", maxHeight: "min(90dvh, 760px)", display: "flex", flexDirection: "column" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "12px auto 0" }} />
          <button onClick={onClose} aria-label="Fermer le détail" style={{
            position: "absolute", top: 8, right: 14, width: 30, height: 30, borderRadius: 8,
            background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer",
          }}>
            <Ic d={I.x} z={13} w={2.5} />
          </button>
        </div>
        {body}
      </motion.div>
    </>
  );
}
