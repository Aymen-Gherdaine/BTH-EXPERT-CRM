"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Client, Soumission, StatutSoumission } from "@/types";
import { formatDateFr } from "@/lib/utils";

/* ── CSS global ─────────────────────────────────────────── */
const CSS = `
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
`;

const PAGE_SIZE = 12;

function fmtInt(n: number) {
  return Math.round(n).toLocaleString("fr-DZ", { maximumFractionDigits: 0 });
}

/* ── Soumissions mini-table ─────────────────────────────── */
const SOUM_GRID = "130px 1fr 110px 60px 140px";
const SOUM_D    = "1px solid #f0f2f5";
const SOUM_HD   = "1px solid #eaecef";

function SoumTableRow({ s }: { s: Soumission }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/soumissions/${s.id}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "grid", gridTemplateColumns: SOUM_GRID,
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
            fontFamily: "ui-monospace, monospace", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
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
        {/* Montant */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 14px" }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              {fmtInt(s.total_ttc)}
            </span>
            <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 500 }}>DZD</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SoumissionsTable({ soumissions }: { soumissions: Soumission[] }) {
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
    { label: "Montant TTC",  right: true  },
  ];

  return (
    <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", overflowX: "auto" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: SOUM_GRID, minWidth: 530,
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
      <div style={{ minWidth: 530 }}>
        {soumissions.map(s => <SoumTableRow key={s.id} s={s} />)}
      </div>
    </div>
  );
}

interface ClientWithSoumissions extends Client {
  soumissions?: Soumission[];
}

/* ── Status config ──────────────────────────────────────── */
type StCfg = { dot: string; bgBadge: string; textBadge: string; border: string; accentBar: string };
const ST: Record<StatutSoumission, StCfg> = {
  Brouillon: { dot: "#94a3b8", bgBadge: "#f8fafc", textBadge: "#475569", border: "#e2e8f0", accentBar: "#94a3b8" },
  Envoyée:   { dot: "#3b82f6", bgBadge: "#eff6ff", textBadge: "#2563eb", border: "#bfdbfe", accentBar: "#3b82f6" },
  Acceptée:  { dot: "#22c55e", bgBadge: "#f0fdf4", textBadge: "#15803d", border: "#bbf7d0", accentBar: "#22c55e" },
  Refusée:   { dot: "#f43f5e", bgBadge: "#fff1f2", textBadge: "#be123c", border: "#fecdd3", accentBar: "#f43f5e" },
};

/* ── Icon ───────────────────────────────────────────────── */
function Ic({ d, z = 18, s = "currentColor", f = "none", w = 1.6 }: {
  d: string | string[]; z?: number; s?: string; f?: string; w?: number;
}) {
  return (
    <svg width={z} height={z} viewBox="0 0 24 24" fill={f} stroke={s}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const I = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  x:        "M18 6L6 18M6 6l12 12",
  chevD:    "M6 9l6 6 6-6",
  chevL:    "M15 18l-6-6 6-6",
  chevR:    "M9 18l6-6-6-6",
  trash:    ["M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"] as string[],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] as string[],
  user:     ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"] as string[],
  file:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"] as string[],
  mapPin:   ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", "M12 7a3 3 0 100 6 3 3 0 000-6z"] as string[],
  calendar: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"] as string[],
  building: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"] as string[],
};

/* ── Avatar ─────────────────────────────────────────────── */
const AVATAR_COLORS = ["#1a2e1e","#2d5a3d","#1a3a4e","#3d6b4f","#4a3a1e","#2a4a3e","#3a2e4e"];
const aCache: Record<string, string> = {};
function aColor(n: string) {
  if (aCache[n]) return aCache[n];
  const h = n.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (aCache[n] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
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

/* ── StatusBadge ────────────────────────────────────────── */
function StatusBadge({ st }: { st: StatutSoumission }) {
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

/* ── Delete state ───────────────────────────────────────── */
interface DeleteState { open: boolean; id: string; label: string }
const D0: DeleteState = { open: false, id: "", label: "" };

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithSoumissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [soumMap, setSoumMap] = useState<Record<string, Soumission[]>>({});
  const [loadingS, setLoadingS] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/clients${p}`);
    const json = await res.json();
    setClients(json.data ?? []);
    setPage(1);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (soumMap[id]) return;
    setLoadingS(id);
    const res = await fetch(`/api/soumissions?client_id=${id}`);
    const json = await res.json();
    setSoumMap(prev => ({ ...prev, [id]: json.data ?? [] }));
    setLoadingS(null);
  }

  function askDelete(c: ClientWithSoumissions, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteConfirm({ open: true, id: c.id, label: c.entreprise });
  }

  async function confirmDelete() {
    setDeletingId(deleteConfirm.id);
    await fetch(`/api/clients/${deleteConfirm.id}`, { method: "DELETE" });
    setClients(prev => prev.filter(c => c.id !== deleteConfirm.id));
    if (expandedId === deleteConfirm.id) setExpandedId(null);
    setDeletingId(null);
    setDeleteConfirm(D0);
  }

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginated = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ height: "100%", background: "#faf9f7", display: "flex", flexDirection: "column" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{
          background: "white", borderBottom: "1px solid #ededeb",
          padding: "20px 20px 18px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.7px", lineHeight: 1 }}>
                Clients
              </h1>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 5 }}>
                <strong style={{ color: "#374151", fontWeight: 600 }}>{clients.length}</strong>
                {" "}client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
              </p>
            </div>
            <a href="/api/clients/export" target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 40, padding: "0 14px",
              borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white",
              color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none",
              whiteSpace: "nowrap",
            }}>
              <Ic d={I.download} z={14} />
              Export
            </a>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", pointerEvents: "none" }}>
              <Ic d={I.search} z={15} />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par entreprise ou contact…"
              style={{
                width: "100%", paddingLeft: 40, paddingRight: search ? 40 : 14, height: 44,
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                fontSize: 14, color: "#111827", background: "white", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                color: "#9ca3af", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", padding: 4,
              }}>
                <Ic d={I.x} z={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="sk" style={{
                  height: 82, borderRadius: 14,
                  background: "white", border: "1px solid #ededeb",
                }} />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "72px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Ic d={I.user} z={30} s="#9ca3af" />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px", marginBottom: 8 }}>
                Aucun client
              </p>
              <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, maxWidth: 280 }}>
                {search
                  ? "Aucun résultat pour cette recherche."
                  : "Les clients sont créés automatiquement lors d'une soumission."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
              <AnimatePresence>
                {paginated.map((client, idx) => (
                  <ClientCard
                    key={client.id} client={client} idx={idx}
                    isExpanded={expandedId === client.id}
                    soumissions={soumMap[client.id] ?? []}
                    isLoadingSoum={loadingS === client.id}
                    onToggle={() => toggleExpand(client.id)}
                    onDelete={askDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────── */}
        {!loading && clients.length > 0 && (
          <div style={{
            flexShrink: 0, background: "#faf9f7", borderTop: "1px solid #e5e7eb",
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center", gap: 12, padding: "10px 16px",
          }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              <strong style={{ color: "#374151", fontWeight: 600 }}>{clients.length}</strong>
              {" "}client{clients.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <motion.button whileTap={{ scale: 0.94 }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page <= 1 ? "#d1d5db" : "#374151", cursor: page <= 1 ? "default" : "pointer" }}
              >
                <Ic d={I.chevL} z={14} />
              </motion.button>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 76, textAlign: "center", userSelect: "none" }}>
                Page {page} / {totalPages}
              </span>
              <motion.button whileTap={{ scale: 0.94 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page >= totalPages ? "#d1d5db" : "#374151", cursor: page >= totalPages ? "default" : "pointer" }}
              >
                <Ic d={I.chevR} z={14} />
              </motion.button>
            </div>
            <div />
          </div>
        )}

        {/* ── Delete modal ─────────────────────────────────── */}
        <AnimatePresence>
          {deleteConfirm.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirm(D0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }}
              />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .95, y: 8 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
                >
                  <div style={{ padding: "24px 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic d={I.trash} z={20} s="#dc2626" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer ce client ?</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                      </div>
                    </div>
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                        Toutes les soumissions associées seront supprimées définitivement.
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280" }}>Cette action est irréversible.</p>
                  </div>
                  <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(D0)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                      Annuler
                    </button>
                    <motion.button whileTap={{ scale: .97 }} onClick={confirmDelete} disabled={!!deletingId}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}
                    >
                      {deletingId ? "Suppression…" : "Supprimer"}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CLIENT CARD
══════════════════════════════════════════════════════════ */
function ClientCard({ client, idx, isExpanded, soumissions, isLoadingSoum, onToggle, onDelete }: {
  client: ClientWithSoumissions; idx: number; isExpanded: boolean;
  soumissions: Soumission[]; isLoadingSoum: boolean;
  onToggle: () => void;
  onDelete: (c: ClientWithSoumissions, e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.22, ease: "easeOut" }}
      style={{
        background: "white", borderRadius: 16, overflow: "hidden",
        border: `1.5px solid ${isExpanded ? "#1a2e1e25" : "rgba(0,0,0,0.07)"}`,
        boxShadow: isExpanded ? "0 4px 24px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* ── Main row ────────────────────────────────────── */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 14px 14px 16px",
          cursor: "pointer", minHeight: 72,
          background: hov && !isExpanded ? "#fafafa" : "white",
          transition: "background 0.12s",
        }}
      >
        <Avatar name={client.entreprise} size={44} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 15, fontWeight: 700, color: isExpanded ? "#1a2e1e" : "#111827",
            letterSpacing: "-0.3px", lineHeight: 1.2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            transition: "color 0.15s",
          }}>
            {client.entreprise}
          </p>
          <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {client.titre} {client.nom_contact}
            {client.poste && <span style={{ color: "#9ca3af" }}> · {client.poste}</span>}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {client.ville && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#9ca3af" }}>
                <Ic d={I.mapPin} z={10} s="#9ca3af" />
                {client.ville}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#9ca3af" }}>
              <Ic d={I.calendar} z={10} s="#9ca3af" />
              {formatDateFr(client.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button
            title="Supprimer le client"
            onClick={e => onDelete(client, e)}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: hov ? "#fff1f2" : "#f8fafc",
              border: `1px solid ${hov ? "#fecdd3" : "#e5e7eb"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hov ? "#e11d48" : "#9ca3af",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Ic d={I.trash} z={14} />
          </button>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{ color: isExpanded ? "#1a2e1e" : "#9ca3af", display: "flex", alignItems: "center" }}
          >
            <Ic d={I.chevD} z={20} />
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
              {/* Details chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {client.adresse && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11.5, color: "#374151",
                    background: "#f3f4f6", border: "1px solid #e5e7eb",
                    borderRadius: 6, padding: "3px 9px",
                  }}>
                    <Ic d={I.building} z={11} s="#6b7280" />
                    {client.adresse}
                  </span>
                )}
              </div>

              {/* Soumissions label */}
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
                <SoumissionsTable soumissions={soumissions} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
