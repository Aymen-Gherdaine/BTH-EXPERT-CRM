"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";
import {
  D,
  GRID,
  PAGE_SIZE,
  RCFG,
  fmt,
  parseLocalDate,
  prospectRef,
  type SortCol,
  type SortDir,
} from "../lib";
import { ActionIcon, Avatar, ResultatBadge, TH } from "../components";

function HistRow({ visite, prospect, refCode, idx }: {
  visite: Visite; prospect: Prospect; refCode: string; idx: number;
}) {
  const cfg = RCFG[visite.resultat] ?? RCFG.autre;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.018, duration: 0.16 }}
    >
      <Link href={`/prospection/${prospect.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          className="hist-row"
          style={{ display: "grid", gridTemplateColumns: GRID, minHeight: 66, alignItems: "stretch", borderBottom: "1px solid #eee8df" }}
        >
          {/* Icon */}
          <div className="hist-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: D }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.text }}>
              <ActionIcon r={visite.resultat} />
            </div>
          </div>

          {/* Entreprise */}
          <div className="hist-enterprise" style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 14, paddingRight: 14, borderRight: D }}>
            <Avatar name={prospect.entreprise} size={28} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1a1714", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prospect.entreprise}
              </p>
              <p className="tnum" style={{ fontSize: 10.5, color: "#887f74", fontFamily: "var(--font-inter)", letterSpacing: "0.04em" }}>
                {refCode}
              </p>
            </div>
          </div>

          {/* Secteur */}
          <div className="hist-sector" style={{ display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 14, borderRight: D }}>
            <p style={{ fontSize: 13, color: "#635c54", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prospect.secteur_activite}
            </p>
          </div>

          {/* Contact */}
          <div className="hist-contact" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 14, paddingRight: 14, borderRight: D }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2e2a26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prospect.nom_contact}
            </p>
            {prospect.poste_contact && (
              <p style={{ fontSize: 11, color: "#887f74", marginTop: 1 }}>{prospect.poste_contact}</p>
            )}
          </div>

          {/* Date visite */}
          <div className="hist-date" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 14, paddingRight: 12, borderRight: D }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "#2e2a26" }}>{formatDateFr(visite.date_visite)}</p>
            <p className="tnum" style={{ fontSize: 10.5, color: "#887f74", marginTop: 1 }}>{fmt(visite.created_at)}</p>
          </div>

          {/* Résultat */}
          <div className="hist-result" style={{ display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 12, borderRight: D }}>
            <ResultatBadge resultat={visite.resultat} sm />
          </div>

          {/* Prochaine action */}
          <div className="hist-action" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 14, paddingRight: 16 }}>
            {visite.date_prochaine_action ? (
              <>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#2e2a26" }}>
                  {formatDateFr(visite.date_prochaine_action)}
                </p>
                {visite.action_requise && (
                  <p style={{ fontSize: 10.5, color: "#887f74", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {visite.action_requise}
                  </p>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HistoryTable({
  entries, prospectRefMap, page, onPage,
}: {
  entries: { visite: Visite; prospect: Prospect }[];
  prospectRefMap: Map<string, number>;
  page: number;
  onPage: (p: number) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("date_visite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortCol === "date_visite") {
        va = parseLocalDate(a.visite.date_visite).getTime();
        vb = parseLocalDate(b.visite.date_visite).getTime();
      } else if (sortCol === "entreprise") {
        va = a.prospect.entreprise.toLowerCase();
        vb = b.prospect.entreprise.toLowerCase();
      } else if (sortCol === "resultat") {
        va = a.visite.resultat;
        vb = b.visite.resultat;
      } else {
        va = a.visite.date_prochaine_action ?? "";
        vb = b.visite.date_prochaine_action ?? "";
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [entries, sortCol, sortDir]);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const HD = "1px solid #e8e2d8";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Sticky header */}
      <div className="history-head" style={{
        display: "grid", gridTemplateColumns: GRID, height: 44, alignItems: "stretch",
        background: "#fbfaf7", borderBottom: "1px solid #e8e2d8",
        position: "sticky", top: 0, zIndex: 5, flexShrink: 0,
      }}>
        <div style={{ borderRight: HD }} />
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="entreprise" label="Entreprise" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH label="Secteur" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH label="Contact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="date_visite" label="Date visite" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, borderRight: HD }}>
          <TH id="resultat" label="Résultat" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 12 }}>
          <TH id="date_action" label="Prochaine action" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
      </div>

      {/* Rows */}
      <div className="sc history-card-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {paged.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "#887f74", fontSize: 14 }}>
            Aucun résultat pour ces filtres
          </div>
        ) : (
          paged.map(({ visite, prospect }, i) => (
            <HistRow
              key={visite.id}
              visite={visite}
              prospect={prospect}
              refCode={prospectRef(prospectRefMap.get(prospect.id) ?? 0)}
              idx={i}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="history-footer">
        <span className="history-count">
          <strong style={{ color: "#2e2a26", fontWeight: 700 }}>{total}</strong>{" "}
          visite{total !== 1 ? "s" : ""}
        </span>
        {pages > 1 && (
          <div className="history-pager">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="history-page-button bth-focus"
              style={{
                color: page <= 1 ? "#d0c9be" : "#45403a",
                cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.65 : 1,
              }}
            >
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </motion.button>
            <span className="history-page-label">
              Page {page} / {pages}
            </span>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="history-page-button bth-focus"
              style={{
                color: page >= pages ? "#d0c9be" : "#45403a",
                cursor: page >= pages ? "default" : "pointer",
                opacity: page >= pages ? 0.65 : 1,
              }}
            >
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </motion.button>
          </div>
        )}
        <span className="history-footer-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
