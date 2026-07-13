"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Soumission } from "@/types";
import { formatDateFr } from "@/lib/utils";
import { CT_D, CT_GRID, CT_HD, I, type ClientWithSoumissions } from "./lib";
import { Avatar, Ic } from "./components";
import { SoumMobileList, SoumissionsTable } from "./SoumissionsTable";

export function ClientCard({ client, idx, isExpanded, soumissions, isLoadingSoum, canSeeAmounts, onToggle, onDelete }: {
  client: ClientWithSoumissions; idx: number; isExpanded: boolean;
  soumissions: Soumission[]; isLoadingSoum: boolean;
  canSeeAmounts: boolean;
  onToggle: () => void;
  onDelete: (c: ClientWithSoumissions, e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
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
        <div className="clients-card-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingRight: 4 }}>
          <button
            className="clients-card-delete"
            title="Supprimer le client"
            onClick={e => onDelete(client, e)}
            style={{
              width: 38, height: 38, borderRadius: 9999,
              background: hov ? "#fff2ed" : "#fbfaf7",
              border: `1px solid ${hov ? "#f0b9ad" : "#e8e2d8"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hov ? "#e11d48" : "#9ca3af",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Ic d={I.trash} z={17} />
          </button>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{
              width: 38, height: 38, borderRadius: 9999,
              background: isExpanded ? "#1a2e1e" : "#f8fafc",
              border: `1px solid ${isExpanded ? "#1a2e1e" : "#e8e2d8"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <Ic d={I.chevD} z={19} s={isExpanded ? "white" : "#9ca3af"} />
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
export function ClientsTable({ clients, expandedId, expandedSoumissions, expandedSoumLoading, canSeeAmounts, onToggle, onDelete }: {
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
