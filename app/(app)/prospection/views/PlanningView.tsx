"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import type { Prospect } from "@/types";
import {
  RCFG,
  fmt,
  getLastVisite,
  parseLocalDate,
  prospectRef,
  type Urgency,
} from "../lib";
import { ActionIcon, ResultatBadge } from "../components";

function PlanningCard({ prospect, refCode, urgency, idx }: {
  prospect: Prospect; refCode: string; urgency: Urgency; idx: number;
}) {
  const lastV = getLastVisite(prospect);
  const r = lastV?.resultat ?? "autre";
  const cfg = RCFG[r] ?? RCFG.autre;
  const isOverdue = urgency === "retard";

  const timeEl = isOverdue ? (
    <span style={{ fontSize: 11, fontWeight: 700, color: "#9c3c30", background: "#fff4f1", padding: "2px 8px", borderRadius: 6, border: "1px solid #efc8bf" }}>
      ASAP
    </span>
  ) : urgency === "aujourd_hui" && lastV ? (
    <span className="tnum" style={{ fontSize: 11, color: "#3a7ca5", fontWeight: 700 }}>{fmt(lastV.created_at)}</span>
  ) : lastV?.date_prochaine_action ? (
    <span style={{ fontSize: 11, color: "#635c54" }}>
      {parseLocalDate(lastV.date_prochaine_action).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
    </span>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.22 }}
    >
      <Link href={`/prospection/${prospect.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          className="plan-card"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #fffdfa 100%)",
            borderRadius: 12,
            border: `1px solid ${isOverdue ? "#efc8bf" : "#e8e2d8"}`,
            padding: "16px",
            boxShadow: "0 8px 22px rgba(26,46,30,0.055)",
          }}
        >
          <div className="plan-main" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 8, flexShrink: 0,
              background: isOverdue ? "#fff4f1" : cfg.bg,
              border: `1px solid ${isOverdue ? "#efc8bf" : cfg.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isOverdue ? "#9c3c30" : cfg.text,
            }}>
              <ActionIcon r={r} />
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Row 1 */}
              <div className="plan-top" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1714" }}>{prospect.entreprise}</span>
                    <span className="tnum" style={{ fontSize: 10.5, color: "#887f74", fontFamily: "var(--font-inter)" }}>{refCode}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#635c54", marginTop: 3 }}>{prospect.secteur_activite}</p>
                </div>
                <div className="plan-status" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <ResultatBadge resultat={r} sm />
                  {timeEl}
                </div>
              </div>

              {/* Contact line */}
              <div className="plan-contact" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                <svg width={11} height={11} fill="none" stroke="#887f74" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span style={{ fontSize: 12, color: "#635c54" }}>
                  <strong style={{ color: "#2e2a26" }}>{prospect.nom_contact}</strong>
                  {prospect.poste_contact && <span style={{ color: "#9ca3af" }}> · {prospect.poste_contact}</span>}
                </span>
                {prospect.telephone && (
                  <>
                    <span style={{ color: "#d1d5db", fontSize: 10 }}>·</span>
                    <span className="tnum" style={{ fontSize: 11, color: "#887f74" }}>{prospect.telephone}</span>
                  </>
                )}
              </div>

              {/* Note / action requise */}
              {(lastV?.action_requise || lastV?.notes_visite) && (
                <p style={{
                  marginTop: 12, fontSize: 12.5, color: "#635c54", fontStyle: "italic",
                  lineHeight: 1.5, paddingLeft: 10, borderLeft: "2px solid #C9A96E",
                }}>
                  &ldquo;{lastV.action_requise || lastV.notes_visite}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function PlanningSection({ title, prospects, prospectRefMap, urgency, dotColor, emptyText }: {
  title: string; prospects: Prospect[]; prospectRefMap: Map<string, number>;
  urgency: Urgency; dotColor: string; emptyText: string;
}) {
  return (
    <div className="planning-section">
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2e2a26" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#635c54", background: "#f5f0e8", padding: "2px 8px", borderRadius: 6 }}>
          {prospects.length}
        </span>
      </div>

      {prospects.length === 0 ? (
        <p style={{ fontSize: 12, color: "#887f74", fontStyle: "italic", paddingLeft: 16 }}>{emptyText}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prospects.map((p, i) => (
            <PlanningCard
              key={p.id}
              prospect={p}
              refCode={prospectRef(prospectRefMap.get(p.id) ?? 0)}
              urgency={urgency}
              idx={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
