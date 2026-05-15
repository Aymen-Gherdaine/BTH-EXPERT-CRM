"use client";

import { useEffect, useState, useCallback, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Soumission, StatutSoumission, LigneBudget, UserRole } from "@/types";
import { formatMontant, formatDateFr } from "@/lib/utils";

/* ── Fonts + scrollbar ─────────────────────────────────────── */
const CSS = `
  .soum-sc { overflow-y:auto; scrollbar-width:thin; scrollbar-color:#e5e7eb transparent; }
  .soum-sc::-webkit-scrollbar { width:4px; }
  .soum-sc::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
  @keyframes soum-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
`;

/* ── Responsive breakpoint ─────────────────────────────────── */
type Bp = "mobile" | "tablet" | "desktop";
function getBp(): Bp {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  if (w >= 1024) return "desktop";
  if (w >= 640) return "tablet";
  return "mobile";
}
function useBp(): Bp {
  const [bp, set] = useState<Bp>(getBp);
  useEffect(() => {
    const h = () => set(getBp());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

/* ── Formatters ────────────────────────────────────────────── */
const fmtInt = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/* ── Status config ─────────────────────────────────────────── */
const ST_MAP: Record<StatutSoumission, { bg: string; c: string; dot: string }> = {
  Brouillon: { bg: "#f3f4f6", c: "#4b5563", dot: "#9ca3af" },
  Envoyée:   { bg: "#dbeafe", c: "#1d4ed8", dot: "#60a5fa" },
  Acceptée:  { bg: "#dcfce7", c: "#16a34a", dot: "#4ade80" },
  Refusée:   { bg: "#fee2e2", c: "#dc2626", dot: "#f87171" },
};

const NEXT_ST: Record<StatutSoumission, StatutSoumission[]> = {
  Brouillon: ["Envoyée"],
  Envoyée:   ["Acceptée", "Refusée", "Brouillon"],
  Acceptée:  ["Envoyée"],
  Refusée:   ["Envoyée"],
};

/* ── Icon ──────────────────────────────────────────────────── */
type IcProps = { d: string | string[]; z?: number; s?: string; f?: string; w?: number };
function Ic({ d, z = 18, s = "currentColor", f = "none", w = 1.6 }: IcProps) {
  return (
    <svg width={z} height={z} viewBox="0 0 24 24" fill={f} stroke={s}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const I = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  x:      "M18 6L6 18M6 6l12 12",
  plus:   "M12 5v14M5 12h14",
  chevR:  "M9 18l6-6-6-6",
  chevL:  "M15 18l-6-6 6-6",
  chevD:  "M6 9l6 6 6-6",
  sortU:  "M18 15l-6-6-6 6",
  sortD:  "M6 9l6 6 6-6",
  filter: "M4 6h16M7 12h10M10 18h4",
  grid:   ["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"] as string[],
  file:   ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6"] as string[],
  dl:     ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"] as string[],
  check:  "M20 6L9 17l-5-5",
  trash:  ["M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"] as string[],
  wallet: ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M1 10h22"] as string[],
  trend:  ["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"] as string[],
  eye:    ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"] as string[],
  copy:   ["M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"] as string[],
};

/* ── Pill ──────────────────────────────────────────────────── */
function Pill({ st, small = false }: { st: StatutSoumission; small?: boolean }) {
  const s = ST_MAP[st];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "2px 8px" : "3px 10px",
      borderRadius: 20, background: s.bg, color: s.c,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: small ? 10.5 : 11.5, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: small ? 4 : 5, height: small ? 4 : 5, borderRadius: "50%", background: s.dot }} />
      {st}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#1a2e1e","#2d5a3d","#1a3a4e","#3d6b4f","#4a3a1e","#2a4a3e","#3a2e4e"];
const avatarCache: Record<string, string> = {};
function avatarColor(name: string): string {
  if (avatarCache[name]) return avatarCache[name];
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (avatarCache[name] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}
function Avatar({ client, size = 32 }: { client: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.floor(size / 3),
      background: avatarColor(client || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700,
      fontSize: Math.floor(size * 0.4), flexShrink: 0,
    }}>
      {(client || "?")[0].toUpperCase()}
    </div>
  );
}

/* ── FilterDropdown ────────────────────────────────────────── */
function FilterDropdown({
  active, set, counts,
}: {
  active: StatutSoumission | null;
  set: (v: StatutSoumission | null) => void;
  counts: Partial<Record<StatutSoumission, number>>;
}) {
  const [open, setOpen] = useState(false);
  const opts: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];
  return (
    <div style={{ position: "relative" }}>
      <motion.button whileTap={{ scale: .96 }} onClick={() => setOpen(o => !o)} style={{
        height: 38, padding: "0 13px", borderRadius: 8,
        border: `1.5px solid ${active ? "#1a2e1e" : "#e5e7eb"}`,
        background: active ? "#edf5ee" : "white",
        color: active ? "#1a2e1e" : "#6b7280",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 500, fontSize: 13,
        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
      }}>
        <Ic d={I.filter} z={13} />
        Statut
        {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a2e1e" }} />}
        <Ic d={I.chevD} z={12} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .15 }}
              style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                background: "white", borderRadius: 10, border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(0,0,0,.10)", minWidth: 180, padding: 6,
              }}>
              <button onClick={() => { set(null); setOpen(false); }} style={{
                width: "100%", padding: "8px 12px", borderRadius: 7, border: "none",
                background: !active ? "#edf5ee" : "transparent",
                color: !active ? "#1a2e1e" : "#6b7280",
                fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: !active ? 600 : 400,
                textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
              }}>
                Tous les statuts {!active && <Ic d={I.check} z={12} />}
              </button>
              {opts.map(o => {
                const s = ST_MAP[o];
                const sel = active === o;
                return (
                  <button key={o} onClick={() => { set(sel ? null : o); setOpen(false); }} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 7, border: "none",
                    background: sel ? "#edf5ee" : "transparent",
                    color: sel ? "#1a2e1e" : "#6b7280",
                    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: sel ? 600 : 400,
                    textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
                      {o}
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>({counts[o] ?? 0})</span>
                    </span>
                    {sel && <Ic d={I.check} z={12} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pager ─────────────────────────────────────────────────── */
function Pager({ page, total, perPage, onPage }: {
  page: number;
  total: number;
  perPage: number;
  onPage: Dispatch<SetStateAction<number>>;
}) {
  const pages = Math.ceil(total / perPage);
  if (total === 0 || pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px", borderTop: "1px solid #e5e7eb",
      background: "white", flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#6b7280" }}>
        <strong style={{ color: "#111827" }}>{from}–{to}</strong> sur <strong style={{ color: "#111827" }}>{total}</strong>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page === 1}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page === 1 ? "#9ca3af" : "#111827", cursor: page === 1 ? "default" : "pointer" }}>
          <Ic d={I.chevL} z={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(() => p)} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb",
            background: p === page ? "#1a2e1e" : "white",
            color: p === page ? "white" : "#6b7280",
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: p === page ? 600 : 400, cursor: "pointer",
          }}>{p}</button>
        ))}
        <button onClick={() => onPage(p => Math.min(pages, p + 1))} disabled={page === pages}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page === pages ? "#9ca3af" : "#111827", cursor: page === pages ? "default" : "pointer" }}>
          <Ic d={I.chevR} z={14} />
        </button>
      </div>
    </div>
  );
}

/* ── SoumissionView = Soumission + derived display fields ───── */
type SoumissionView = Soumission & { _cn: string; _contact: string };

/* ── TableRow ──────────────────────────────────────────────── */
type SortCol = "numero_offre" | "client" | "titre_projet" | "statut" | "total_ttc" | "date_offre";

function TableRow({ o, isAdmin, onClick, isActive, isSelected, onToggle, GRID, onDuplicate, onDelete }: {
  o: SoumissionView; isAdmin: boolean; onClick: () => void;
  isActive: boolean; isSelected: boolean; onToggle: (id: string) => void;
  GRID: string; onDuplicate: (s: SoumissionView) => void; onDelete: (s: SoumissionView) => void;
}) {
  const [hov, setHov] = useState(false);
  const pct = o.total_ttc > 0 ? ((o.versement_recu ?? 0) / o.total_ttc) * 100 : 0;
  const bg = isActive ? "#e6f0e7" : isSelected ? "#edf5ee" : hov ? "#f7f8f6" : "white";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ display: "grid", gridTemplateColumns: GRID, height: 44, alignItems: "center", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: bg, transition: "background .08s" }}>

      {/* checkbox */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={e => { e.stopPropagation(); onToggle(o.id); }}>
        <div style={{ width: 15, height: 15, borderRadius: 4, border: isSelected ? "none" : "1.5px solid #d1d5db", background: isSelected ? "#1a2e1e" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isSelected && <Ic d={I.check} z={10} s="white" w={2.5} />}
        </div>
      </div>

      {/* ref + date */}
      <div style={{ paddingLeft: 6, paddingRight: 8 }}>
        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{o.numero_offre}</p>
        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>{formatDateFr(o.date_offre)}</p>
      </div>

      {/* client */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 12 }}>
        <Avatar client={o._cn} size={26} />
        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o._cn}</p>
      </div>

      {/* titre */}
      <div style={{ paddingRight: 16, minWidth: 0 }}>
        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.titre_projet}</p>
      </div>

      {/* statut */}
      <div style={{ paddingRight: 8 }}><Pill st={o.statut} small /></div>

      {/* montant */}
      {isAdmin && (
        <div style={{ paddingRight: 20, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4 }}>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1 }}>{fmtInt(o.total_ttc)}</span>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, color: "#9ca3af" }}>DZD</span>
          </div>
          {pct > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, padding: "1px 6px", borderRadius: 5, background: "#dcfce7", color: "#16a34a", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10, fontWeight: 600 }}>
              {pct.toFixed(0)}% versé
            </span>
          )}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", paddingRight: 10, opacity: hov || isActive ? 1 : 0, transition: "opacity .12s" }}>
        <Link href={`/soumissions/${o.id}`} onClick={e => e.stopPropagation()}>
          <span title="Ouvrir" style={{ width: 28, height: 28, borderRadius: 6, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}>
            <Ic d={I.eye} z={12} />
          </span>
        </Link>
        <button title="Dupliquer" onClick={e => { e.stopPropagation(); onDuplicate(o); }}
          style={{ width: 28, height: 28, borderRadius: 6, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}>
          <Ic d={I.copy} z={12} />
        </button>
        <button title="Supprimer" onClick={e => { e.stopPropagation(); onDelete(o); }}
          style={{ width: 28, height: 28, borderRadius: 6, background: "#fee2e2", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", cursor: "pointer" }}>
          <Ic d={I.trash} z={12} />
        </button>
      </div>
    </div>
  );
}

/* ── DesktopTable ──────────────────────────────────────────── */
function DesktopTable({ items, isAdmin, onOpen, selId, selected, onToggle, onDuplicate, onDelete }: {
  items: SoumissionView[]; isAdmin: boolean; onOpen: (o: SoumissionView) => void;
  selId: string | null; selected: string[]; onToggle: (id: string) => void;
  onDuplicate: (s: SoumissionView) => void; onDelete: (s: SoumissionView) => void;
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
    ? "36px 130px 180px 1fr 120px 160px 100px"
    : "36px 130px 180px 1fr 120px 100px";

  function TH({ id, label, align = "left" }: { id?: SortCol; label: string; align?: string }) {
    return (
      <div onClick={id ? () => handleSort(id) : undefined}
        style={{ display: "flex", alignItems: "center", gap: 4, cursor: id ? "pointer" : "default", justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, fontWeight: 600, color: sortCol === id ? "#111827" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.7px" }}>
          {label}
        </span>
        {id && sortCol === id && <Ic d={sortDir === "asc" ? I.sortU : I.sortD} z={10} s="#6b7280" />}
      </div>
    );
  }

  const totalRow = sorted.reduce((s, o) => s + o.total_ttc, 0);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* header */}
      <div style={{ display: "grid", gridTemplateColumns: GRID, height: 36, alignItems: "center", background: "#f6f6f4", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 5, flexShrink: 0 }}>
        <div />
        <div style={{ paddingLeft: 6 }}><TH id="numero_offre" label="N° Offre" /></div>
        <div><TH id="client" label="Client" /></div>
        <div style={{ paddingRight: 16 }}><TH id="titre_projet" label="Soumission" /></div>
        <div><TH id="statut" label="Statut" /></div>
        {isAdmin && <div style={{ paddingRight: 20 }}><TH id="total_ttc" label="Montant TTC" align="right" /></div>}
        <div />
      </div>

      {/* rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map(o => (
          <TableRow key={o.id} o={o} isAdmin={isAdmin} onClick={() => onOpen(o)}
            isActive={selId === o.id} isSelected={selected.includes(o.id)}
            onToggle={onToggle} GRID={GRID} onDuplicate={onDuplicate} onDelete={onDelete} />
        ))}
      </div>

      {/* footer total */}
      {isAdmin && sorted.length > 0 && (
        <div style={{ display: "flex", alignItems: "stretch", borderTop: "2px solid #e5e7eb", background: "white", flexShrink: 0, height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 24px", borderRight: "1px solid #e5e7eb", gap: 8 }}>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, color: "#9ca3af" }}>Total</span>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>{sorted.length} soumission{sorted.length > 1 ? "s" : ""}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", padding: "0 24px", borderLeft: "1px solid #e5e7eb", gap: 6 }}>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, color: "#9ca3af" }}>Montant total</span>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px" }}>{fmtInt(totalRow)}</span>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11, color: "#9ca3af" }}>DZD TTC</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MobileCard ────────────────────────────────────────────── */
function MobileCard({ o, idx, onOpen, isAdmin }: { o: SoumissionView; idx: number; onOpen: (o: SoumissionView) => void; isAdmin: boolean }) {
  const s = ST_MAP[o.statut];
  const pct = o.total_ttc > 0 ? ((o.versement_recu ?? 0) / o.total_ttc) * 100 : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * .06, duration: .25 }}>
      <motion.div whileTap={{ scale: .988 }} onClick={() => onOpen(o)} style={{
        background: "white", borderRadius: 14, cursor: "pointer", overflow: "hidden",
        border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04)",
        display: "flex", marginBottom: 10,
      }}>
        <div style={{ width: 4, background: s.dot, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "16px 16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>
              {o.numero_offre} · {formatDateFr(o.date_offre)}
            </span>
            <Pill st={o.statut} small />
          </div>
          <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.35, marginBottom: 12 }}>
            {o.titre_projet}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, padding: "10px 12px", background: "#f6f6f4", borderRadius: 10 }}>
            <Avatar client={o._cn} size={30} />
            <div>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>{o._cn}</p>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{o._contact}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {isAdmin ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{fmtInt(o.total_ttc)}</span>
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11, color: "#9ca3af" }}>DZD</span>
                </div>
                {pct > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, padding: "2px 7px", borderRadius: 5, background: "#dcfce7", color: "#16a34a", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, fontWeight: 600 }}>{pct.toFixed(0)}% versé</span>}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, color: "#6b7280" }}>Voir les détails</span>
              </div>
            )}
            <Link href={`/soumissions/${o.id}`} onClick={e => e.stopPropagation()}>
              <motion.button whileTap={{ scale: .92 }} style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "#1a2e1e", border: "none", display: "flex", alignItems: "center", gap: 5, color: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                <Ic d={I.eye} z={13} />Ouvrir
              </motion.button>
            </Link>
          </div>
          {isAdmin && pct > 0 && (
            <div style={{ marginTop: 10, height: 3, borderRadius: 3, background: "#e5e7eb", overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ delay: idx * .06 + .3, duration: .6, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 3, background: "#2d5a3d" }} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── DetailPanel ───────────────────────────────────────────── */
function DetailPanel({ o, onClose, isAdmin, onStatusChange, onVersement, onDelete, isDesktop, loading }: {
  o: SoumissionView | null; onClose: () => void; isAdmin: boolean;
  onStatusChange: (id: string, s: StatutSoumission) => void;
  onVersement: (s: SoumissionView) => void;
  onDelete: (s: SoumissionView) => void;
  isDesktop: boolean; loading: boolean;
}) {
  const pct = o && o.total_ttc > 0 ? ((o.versement_recu ?? 0) / o.total_ttc) * 100 : 0;
  const next = o ? (NEXT_ST[o.statut] ?? []) : [];

  const skeleton = (h: number) => (
    <div style={{ height: h, borderRadius: 10, background: "#f3f4f6", animation: "soum-pulse 1.5s ease-in-out infinite" }} />
  );

  const body = (
    <div className="soum-sc" style={{ flex: 1, overflowY: "auto", padding: "20px 22px 40px" }}>
      {loading || !o ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {skeleton(72)}{skeleton(180)}{skeleton(120)}{skeleton(140)}
        </div>
      ) : (
        <>
          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ flex: 1, paddingRight: 10, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, fontWeight: 600, color: "#9ca3af" }}>{o.numero_offre}</span>
                <Pill st={o.statut} small />
              </div>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 17, color: "#111827", letterSpacing: "-0.4px", lineHeight: 1.3, marginBottom: 10 }}>{o.titre_projet}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar client={o._cn} size={28} />
                <div>
                  <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{o._cn}</p>
                  <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11, color: "#9ca3af" }}>{o._contact} · {formatDateFr(o.date_offre)}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", flexShrink: 0, cursor: "pointer" }}>
              <Ic d={I.x} z={13} w={2.5} />
            </button>
          </div>

          {/* status change */}
          {next.length > 0 && (
            <div style={{ background: "#f6f6f4", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #e5e7eb" }}>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Changer le statut</p>
              <div style={{ display: "flex", gap: 7 }}>
                {next.map(s => {
                  const ns = ST_MAP[s];
                  return (
                    <motion.button key={s} whileTap={{ scale: .95 }} onClick={() => onStatusChange(o.id, s)} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: `1.5px solid ${ns.dot}60`, background: ns.bg, color: ns.c,
                      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer",
                    }}>
                      <Ic d={I.check} z={11} />Marquer {s}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* finances */}
          {isAdmin && (
            <div style={{ background: "#f6f6f4", borderRadius: 10, padding: 14, marginBottom: 14, border: "1px solid #e5e7eb" }}>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>Finances</p>
              {([
                { l: "Total HT",  v: o.total_ht,  muted: true },
                { l: "TVA 19%",   v: o.tva,        muted: true },
                { l: "Total TTC", v: o.total_ttc,  muted: false },
              ] as const).map(({ l, v, muted }, i) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 2 ? "1px solid #e5e7eb" : "none" }}>
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: muted ? "#6b7280" : "#111827", fontWeight: muted ? 400 : 600 }}>{l}</span>
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 13, color: muted ? "#6b7280" : "#111827", fontWeight: muted ? 500 : 700 }}>{formatMontant(v)} DZD</span>
                </div>
              ))}
              {pct > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12.5, color: "#6b7280" }}>Versements</span>
                    <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12.5, fontWeight: 600, color: "#2d5a3d" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "#e5e7eb", overflow: "hidden", marginBottom: 8 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .6 }}
                      style={{ height: "100%", borderRadius: 6, background: "#2d5a3d" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#2d5a3d", fontWeight: 600 }}>{formatMontant(o.versement_recu ?? 0)} DZD versé</span>
                    <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#9ca3af" }}>Reste : {formatMontant(o.total_ttc - (o.versement_recu ?? 0))}</span>
                  </div>
                </div>
              )}
              {o.statut === "Acceptée" && (
                <motion.button whileTap={{ scale: .96 }} onClick={() => onVersement(o)} style={{
                  marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 8,
                  background: "#edf5ee", border: "1.5px solid #4ade8060",
                  color: "#16a34a", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                }}>
                  <Ic d={I.wallet} z={13} />
                  {(o.versement_recu ?? 0) > 0 ? "Modifier le versement" : "Saisir un versement"}
                </motion.button>
              )}
            </div>
          )}

          {/* lignes budget */}
          <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Lignes budgétaires</p>
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 16 }}>
            {(o.lignes_budget ?? []).length === 0 ? (
              <div style={{ padding: 16, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>Aucune ligne</div>
            ) : (o.lignes_budget ?? []).map((l: LigneBudget, i: number) => (
              <div key={l.id ?? i} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                background: i % 2 === 0 ? "white" : "#f6f6f4",
                borderBottom: i < (o.lignes_budget?.length ?? 0) - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2, flexShrink: 0, width: 14, fontWeight: 600 }}>{l.numero}</span>
                <p style={{ flex: 1, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#111827", lineHeight: 1.5 }}>{l.designation}</p>
                {isAdmin && (
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 12.5, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>
                    {formatMontant(l.prix_unitaire * l.quantite)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href={`/soumissions/${o.id}`}>
              <motion.button whileTap={{ scale: .96 }} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "#1a2e1e", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 10px rgba(26,46,30,.2)" }}>
                <Ic d={I.eye} z={15} />Ouvrir la soumission
              </motion.button>
            </Link>
            <motion.button whileTap={{ scale: .96 }} onClick={() => onDelete(o)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "#fee2e2", border: "1.5px solid #f8717140", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "#dc2626", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <Ic d={I.trash} z={15} />Supprimer
            </motion.button>
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.12)" }} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, zIndex: 201, background: "white", borderLeft: "1px solid #e5e7eb", boxShadow: "-8px 0 30px rgba(0,0,0,.08)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 14, color: "#111827", letterSpacing: "-0.3px" }}>Détail soumission</p>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "#f6f6f4", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", cursor: "pointer" }}>
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
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "white", borderRadius: "20px 20px 0 0", maxHeight: "90%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "12px auto 0", flexShrink: 0 }} />
        {body}
      </motion.div>
    </>
  );
}

/* ── Modal states ──────────────────────────────────────────── */
interface VersementState { open: boolean; id: string; titre: string; ttc: number; current: number }
const V0: VersementState = { open: false, id: "", titre: "", ttc: 0, current: 0 };
interface DeleteState { open: boolean; id: string; label: string }
const D0: DeleteState = { open: false, id: "", label: "" };

/* ── Main export ───────────────────────────────────────────── */
export default function SoumissionsClient({ role }: { role: UserRole }) {
  const router = useRouter();
  const bp = useBp();
  const isDesktop = bp === "desktop";
  const isAdmin = role === "admin" || role === "charge_projet";
  const PER_PAGE = isDesktop ? 10 : 5;

  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<StatutSoumission | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [selDetail, setSelDetail] = useState<SoumissionView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [versement, setVersement] = useState<VersementState>(V0);
  const [versementInput, setVersementInput] = useState("");
  const [savingVersement, setSavingVersement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toView = useCallback((s: Soumission): SoumissionView => ({
    ...s,
    _cn: s.client?.entreprise ?? "—",
    _contact: s.client ? `${s.client.titre} ${s.client.nom_contact}` : "—",
  }), []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/soumissions");
    const json = await res.json();
    setSoumissions(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filtre, q]);

  const filtered: SoumissionView[] = soumissions.filter(s => {
    const mF = !filtre || s.statut === filtre;
    const mQ = !q
      || s.titre_projet.toLowerCase().includes(q.toLowerCase())
      || (s.client?.entreprise ?? "").toLowerCase().includes(q.toLowerCase())
      || s.numero_offre.toLowerCase().includes(q.toLowerCase());
    return mF && mQ;
  }).map(toView);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = Object.fromEntries(
    (["Brouillon", "Envoyée", "Acceptée", "Refusée"] as StatutSoumission[]).map(s => [s, soumissions.filter(x => x.statut === s).length])
  ) as Partial<Record<StatutSoumission, number>>;

  const totalTTC  = soumissions.reduce((s, o) => s + o.total_ttc, 0);
  const nbAccepted = soumissions.filter(o => o.statut === "Acceptée").length;
  const totalVerse = soumissions.reduce((s, o) => s + (o.versement_recu ?? 0), 0);

  async function openDetail(o: SoumissionView) {
    setSelId(o.id);
    setSelDetail(o);
    setDetailLoading(true);
    const res = await fetch(`/api/soumissions/${o.id}`);
    const json = await res.json();
    if (json.data) setSelDetail(toView(json.data));
    setDetailLoading(false);
  }

  function closeDetail() { setSelId(null); setSelDetail(null); }

  async function handleStatut(id: string, statut: StatutSoumission) {
    await fetch(`/api/soumissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setSoumissions(prev => prev.map(s => s.id === id ? { ...s, statut } : s));
    if (selDetail?.id === id) setSelDetail(prev => prev ? { ...prev, statut } : null);
    if (statut === "Acceptée") {
      const s = soumissions.find(x => x.id === id);
      openVersementFor(id, s?.titre_projet ?? "", s?.total_ttc ?? 0, s?.versement_recu ?? 0);
    }
  }

  function openVersementFor(id: string, titre: string, ttc: number, current: number) {
    setVersementInput(current ? String(current) : "");
    setVersement({ open: true, id, titre, ttc, current });
  }

  async function handleSaveVersement() {
    const montant = parseFloat(versementInput.replace(/\s/g, "").replace(",", ".")) || 0;
    setSavingVersement(true);
    await fetch(`/api/soumissions/${versement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versement_recu: montant }),
    });
    setSoumissions(prev => prev.map(s => s.id === versement.id ? { ...s, versement_recu: montant } : s));
    if (selDetail?.id === versement.id) setSelDetail(prev => prev ? { ...prev, versement_recu: montant } : null);
    setSavingVersement(false);
    setVersement(V0);
  }

  function handleDelete(s: SoumissionView) {
    setDeleteConfirm({ open: true, id: s.id, label: s.titre_projet });
  }

  async function confirmDelete() {
    setDeletingId(deleteConfirm.id);
    await fetch(`/api/soumissions/${deleteConfirm.id}`, { method: "DELETE" });
    setSoumissions(prev => prev.filter(s => s.id !== deleteConfirm.id));
    if (selId === deleteConfirm.id) closeDetail();
    setDeletingId(null);
    setDeleteConfirm(D0);
  }

  const handleDuplicate = (s: SoumissionView) => router.push(`/soumissions/${s.id}?duplicate=1`);
  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const px = isDesktop ? 32 : 18;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#f6f6f4" }}>

        {/* ── Hero ── */}
        <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: `20px ${px}px 16px`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isAdmin ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 800, fontSize: isDesktop ? 28 : 24, color: "#111827", letterSpacing: "-0.8px", lineHeight: 1 }}>Soumissions</h1>
              <span style={{ height: 22, minWidth: 22, padding: "0 7px", background: "#f6f6f4", borderRadius: 20, border: "1px solid #e5e7eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                {soumissions.length}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isAdmin && (
                <a href="/api/soumissions/export" target="_blank" rel="noreferrer">
                  <motion.button whileTap={{ scale: .94 }} style={{ height: 36, padding: "0 13px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                    <Ic d={I.grid} z={13} />Excel
                  </motion.button>
                </a>
              )}
              {isDesktop ? (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .94 }} style={{ height: 36, padding: "0 14px", borderRadius: 8, background: "#1a2e1e", border: "none", display: "flex", alignItems: "center", gap: 6, color: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(26,46,30,.18)" }}>
                    <Ic d={I.plus} z={14} />Nouvelle soumission
                  </motion.button>
                </Link>
              ) : (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .9 }} style={{ width: 36, height: 36, borderRadius: 10, background: "#1a2e1e", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", boxShadow: "0 2px 8px rgba(26,46,30,.2)", flexShrink: 0 }}>
                    <Ic d={I.plus} z={18} />
                  </motion.button>
                </Link>
              )}
            </div>
          </div>

          {/* stats chips */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Total TTC",   value: `${fmtInt(totalTTC)} DZD`,   icon: I.wallet },
                { label: "Acceptées",   value: String(nbAccepted),           icon: I.check },
                { label: "Versements",  value: `${fmtInt(totalVerse)} DZD`,  icon: I.trend },
              ].map(chip => (
                <div key={chip.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#f6f6f4", border: "1px solid #e5e7eb" }}>
                  <Ic d={chip.icon} z={13} s="#6b7280" />
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#6b7280" }}>{chip.label}</span>
                  <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, color: "#111827", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{chip.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: `12px ${px}px`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", pointerEvents: "none" }}>
              <Ic d={I.search} z={14} />
            </span>
            <input type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher client, projet, N° offre…"
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, height: 38, border: "1.5px solid #e5e7eb", borderRadius: 8, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#111827", background: "white", outline: "none" }} />
          </div>
          <FilterDropdown active={filtre} set={setFiltre} counts={counts} />
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: `24px ${px}px`, display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 44, borderRadius: 10, background: "white", border: "1px solid #e5e7eb", animation: "soum-pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ic d={I.file} z={28} s="#9ca3af" />
              </div>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 6 }}>Aucune soumission</p>
              <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                {q || filtre ? "Aucun résultat pour ces critères." : "Créez votre première soumission."}
              </p>
              {!q && !filtre && (
                <Link href="/soumissions/nouvelle">
                  <motion.button whileTap={{ scale: .96 }} style={{ padding: "10px 20px", borderRadius: 10, background: "#1a2e1e", border: "none", color: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Nouvelle soumission
                  </motion.button>
                </Link>
              )}
            </div>
          ) : isDesktop ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "white", margin: "16px 32px", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
              <DesktopTable items={pageItems} isAdmin={isAdmin} onOpen={openDetail}
                selId={selId} selected={selected} onToggle={toggleSel}
                onDuplicate={handleDuplicate} onDelete={handleDelete} />
              <Pager page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />
            </div>
          ) : (
            <div style={{ padding: "12px 18px 80px" }}>
              {pageItems.map((o, i) => (
                <MobileCard key={o.id} o={o} idx={i} onOpen={openDetail} isAdmin={isAdmin} />
              ))}
              <Pager page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <AnimatePresence>
          {selId && (
            <DetailPanel o={selDetail} onClose={closeDetail} isAdmin={isAdmin}
              onStatusChange={handleStatut}
              onVersement={s => openVersementFor(s.id, s.titre_projet, s.total_ttc, s.versement_recu ?? 0)}
              onDelete={handleDelete} isDesktop={isDesktop} loading={detailLoading} />
          )}
        </AnimatePresence>

        {/* ── Delete modal ── */}
        <AnimatePresence>
          {deleteConfirm.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(D0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}>
                  <div style={{ padding: "24px 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic d={I.trash} z={20} s="#dc2626" />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer cette soumission ?</p>
                        <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#6b7280" }}>
                      Cette action est <strong>irréversible</strong>. La soumission et ses lignes budgétaires seront définitivement supprimées.
                    </p>
                  </div>
                  <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(D0)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>Annuler</button>
                    <motion.button whileTap={{ scale: .97 }} onClick={confirmDelete} disabled={!!deletingId}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#dc2626", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}>
                      {deletingId ? "Suppression…" : "Supprimer"}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* ── Versement modal ── */}
        <AnimatePresence>
          {versement.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVersement(V0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}>
                  <div style={{ padding: "24px 24px 0" }}>
                    <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Versement reçu</p>
                    <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>{versement.titre}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "#f6f6f4", borderRadius: 8 }}>
                      <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, color: "#6b7280" }}>Montant TTC</span>
                      <span style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatMontant(versement.ttc)} DZD</span>
                    </div>
                    <label style={{ display: "block", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Montant versé (DZD)</label>
                    <input type="number" value={versementInput} onChange={e => setVersementInput(e.target.value)}
                      placeholder="Ex : 500000" min={0} autoFocus
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 14, outline: "none", marginBottom: 6 }} />
                    <p style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 11.5, color: "#9ca3af", marginBottom: 20 }}>Acompte ou paiement partiel reçu du client.</p>
                  </div>
                  <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setVersement(V0)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>Annuler</button>
                    <motion.button whileTap={{ scale: .97 }} onClick={handleSaveVersement} disabled={savingVersement}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#1a2e1e", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: savingVersement ? .7 : 1 }}>
                      {savingVersement ? "Enregistrement…" : "Enregistrer"}
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
