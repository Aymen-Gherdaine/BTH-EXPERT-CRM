"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDateFr } from "@/lib/utils";
import { SoumissionView, SortCol } from "../types";
import { I, fmtInt } from "../constants";
import { Ic } from "./Ic";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";

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

export function PremiumTable({ items, isAdmin, onOpen, selId, selected, onToggle, onDuplicate, onDelete, page, total, perPage, onPage }: {
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

  const HD = "1px solid #e8e2d8";

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
      {/* Sticky header */}
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
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          <strong style={{ color: "#374151", fontWeight: 600 }}>{sorted.length}</strong>
          {" "}soumission{sorted.length > 1 ? "s" : ""}
        </span>

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
