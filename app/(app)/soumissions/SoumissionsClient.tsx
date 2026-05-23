"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Soumission, StatutSoumission } from "@/types";
import { D0, V0 } from "./types";
import { CSS, I, fmtInt } from "./constants";
import { useBp } from "@/hooks/useBp";
import { useSoumissions } from "./hooks/useSoumissions";
import {
  Ic, FilterDropdown, Pager,
  CardGrid, PremiumTable, DetailPanel,
  DeleteModal, VersementModal,
} from "./components";

export default function SoumissionsClient({ initialSoumissions = [] }: { initialSoumissions?: Soumission[] }) {
  const bp = useBp();
  const isDesktop = bp === "desktop";

  const {
    soumissions, loading, isAdmin, toView,
    selId, selDetail, detailLoading,
    versement, setVersement, versementInput, setVersementInput, savingVersement,
    deleteConfirm, setDeleteConfirm, deletingId,
    selected,
    openDetail, closeDetail, handleStatut, openVersementFor,
    handleSaveVersement, handleDelete, confirmDelete, handleDuplicate, toggleSel,
  } = useSoumissions(initialSoumissions);

  const [view, setView] = useState<"cards" | "table">("cards");
  useEffect(() => {
    const saved = localStorage.getItem("soum-view");
    if (saved === "table" || saved === "cards") setView(saved);
  }, []);
  function switchView(v: "cards" | "table") {
    setView(v);
    localStorage.setItem("soum-view", v);
  }

  const PER_PAGE = !isDesktop ? 6 : view === "cards" ? 9 : 12;

  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<StatutSoumission | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [filtre, q, view]);

  const filtered = soumissions.filter(s => {
    const mF = !filtre || s.statut === filtre;
    const mQ = !q
      || s.titre_projet.toLowerCase().includes(q.toLowerCase())
      || (s.client?.entreprise ?? "").toLowerCase().includes(q.toLowerCase())
      || s.numero_offre.toLowerCase().includes(q.toLowerCase());
    return mF && mQ;
  }).map(toView);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const hasMobilePagination = !isDesktop && filtered.length > 0 && totalPages > 1;

  const counts = Object.fromEntries(
    (["Brouillon", "Envoyée", "Acceptée", "Refusée"] as StatutSoumission[]).map(s => [
      s, soumissions.filter(x => x.statut === s).length,
    ])
  ) as Partial<Record<StatutSoumission, number>>;

  const totalTTC   = soumissions.reduce((s, o) => s + o.total_ttc, 0);
  const nbAccepted = soumissions.filter(o => o.statut === "Acceptée").length;
  const totalVerse = soumissions.reduce((s, o) => s + (o.versement_recu ?? 0), 0);

  const px = isDesktop ? 32 : 14;

  return (
    <>
      <style>{CSS}</style>
      <div className={`submission-page-shell ${hasMobilePagination ? "has-mobile-pagination" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%", background: "#faf9f7" }}>

        {/* Hero */}
        <div className="submission-hero" style={{ background: "white", borderBottom: "1px solid #ededeb", padding: `24px ${px}px 20px`, flexShrink: 0 }}>
          <div className="submission-hero-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isAdmin ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="submission-title" style={{ fontWeight: 700, fontSize: isDesktop ? 25 : 22, color: "#111827", letterSpacing: 0, lineHeight: 1 }}>
                Soumissions
              </h1>
              <span style={{ height: 24, minWidth: 24, padding: "0 8px", background: "#f3f4f6", borderRadius: 9999, border: "1px solid #e5e7eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                {soumissions.length}
              </span>
            </div>
            <div className="submission-hero-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isAdmin && (
                <a href="/api/soumissions/export" target="_blank" rel="noreferrer">
                  <motion.button whileTap={{ scale: .94 }} style={{ height: 36, padding: "0 13px", borderRadius: 9999, border: "1.5px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                    <Ic d={I.excel} z={13} />
                    {isDesktop && "Excel"}
                  </motion.button>
                </a>
              )}
              {isAdmin && (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .94 }} style={{ height: 36, padding: isDesktop ? "0 16px" : "0 13px", borderRadius: 9999, background: "#1a2e1e", border: "none", display: "flex", alignItems: "center", gap: 6, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 10px rgba(26,46,30,.20)", whiteSpace: "nowrap" }}>
                    <Ic d={I.plus} z={14} />
                    {isDesktop ? "Nouvelle soumission" : "Nouvelle"}
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="submission-kpis" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Total TTC",  value: `${fmtInt(totalTTC)} DZD`,  icon: I.wallet },
                { label: "Acceptées",  value: String(nbAccepted),           icon: I.check },
                { label: "Versements", value: `${fmtInt(totalVerse)} DZD`, icon: I.trend },
              ].map(chip => (
                <div key={chip.label} className="submission-kpi" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 9999, background: "#f3f4f6", border: "1px solid #ededeb" }}>
                  <Ic d={chip.icon} z={13} s="#6b7280" />
                  <span className="submission-kpi-label" style={{ fontSize: 11.5, color: "#6b7280" }}>{chip.label}</span>
                  <span className="submission-kpi-value" style={{ fontSize: 12.5, color: "#111827", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{chip.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter + view toggle bar */}
        <div className="submission-tools" style={{ background: "white", borderBottom: "1px solid #ededeb", padding: `12px ${px}px`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <div className="submission-search" style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", pointerEvents: "none" }}>
              <Ic d={I.search} z={14} />
            </span>
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher client, projet, N° offre…"
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, height: 38, border: "1.5px solid #e5e7eb", borderRadius: 9999, fontSize: 13, color: "#111827", background: "white", outline: "none" }}
            />
          </div>
          <FilterDropdown active={filtre} set={setFiltre} counts={counts} />
          {isDesktop && (
            <div style={{ display: "flex", gap: 2, padding: 3, background: "#f3f4f6", borderRadius: 10, border: "1px solid #ededeb" }}>
              {([
                { id: "cards" as const, icon: I.cards, title: "Vue cards" },
                { id: "table" as const, icon: I.table, title: "Vue tableau" },
              ]).map(btn => (
                <button key={btn.id} title={btn.title} onClick={() => switchView(btn.id)} style={{ width: 32, height: 32, borderRadius: 8, background: view === btn.id ? "white" : "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: view === btn.id ? "#1a2e1e" : "#9ca3af", cursor: "pointer", boxShadow: view === btn.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                  <Ic d={btn.icon} z={15} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: `24px ${px}px`, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 220, borderRadius: 16, background: "white", border: "1px solid #ededeb" }} className="sk" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Ic d={I.file} z={32} s="#9ca3af" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 8, letterSpacing: 0 }}>Aucune soumission</p>
              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>
                {q || filtre ? "Aucun résultat pour ces critères." : isAdmin ? "Créez votre première soumission." : "Aucune soumission disponible."}
              </p>
              {isAdmin && !q && !filtre && (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .96 }} style={{ padding: "11px 22px", borderRadius: 9999, background: "#1a2e1e", border: "none", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 10px rgba(26,46,30,.18)" }}>
                    Nouvelle soumission
                  </motion.button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {(!isDesktop || view === "cards") ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                  <div style={{ flex: 1, overflowY: "auto" }} className="sc">
                    <CardGrid items={pageItems} isAdmin={isAdmin} onOpen={openDetail} selId={selId} px={px} />
                  </div>
                  <Pager page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} hideWhenSinglePage={true} />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)", margin: "16px 32px 20px", borderRadius: 8, border: "1px solid #e8e2d8", overflow: "hidden", boxShadow: "0 18px 48px rgba(26,46,30,0.07)" }}>
                  <PremiumTable
                    items={pageItems} isAdmin={isAdmin} onOpen={openDetail}
                    selId={selId} selected={selected} onToggle={toggleSel}
                    onDuplicate={handleDuplicate} onDelete={handleDelete}
                    page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selId && (
            <DetailPanel
              o={selDetail} onClose={closeDetail} isAdmin={isAdmin}
              onStatusChange={handleStatut}
              onVersement={s => openVersementFor(s.id, s.titre_projet, s.total_ttc, s.versement_recu ?? 0)}
              onDelete={handleDelete} isDesktop={isDesktop} loading={detailLoading}
            />
          )}
        </AnimatePresence>

        <DeleteModal
          deleteConfirm={deleteConfirm}
          onCancel={() => setDeleteConfirm(D0)}
          onConfirm={confirmDelete}
          deletingId={deletingId}
        />
        <VersementModal
          versement={versement}
          onCancel={() => setVersement(V0)}
          versementInput={versementInput}
          setVersementInput={setVersementInput}
          onSave={handleSaveVersement}
          saving={savingVersement}
        />

      </div>
    </>
  );
}
