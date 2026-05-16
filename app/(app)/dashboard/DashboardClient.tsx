"use client";

import { useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardStats, Prospect, Soumission, UserRole, Visite } from "@/types";
import { formatMontant } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type OverdueProspect = Prospect & { _lastVisit: Visite };

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

const STATUT_CFG: Record<string, [string, string]> = {
  Brouillon:  ["#f3f4f6", "#6b7280"],
  "Envoyée":  ["#eff6ff", "#2563eb"],
  "Acceptée": ["#f0fdf4", "#16a34a"],
  "Refusée":  ["#fef2f2", "#dc2626"],
};

const STATUT_PROSPECT: Record<string, [string, string]> = {
  actif:      ["#eff6ff", "#2563eb"],
  converti:   ["#f0fdf4", "#16a34a"],
  sans_suite: ["#f3f4f6", "#6b7280"],
};

// ─── Hook ────────────────────────────────────────────────────────────────────

function useBp(): "mobile" | "tablet" | "desktop" {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("mobile");
  useEffect(() => {
    const h = () => setBp(
      window.innerWidth < 640 ? "mobile"
      : window.innerWidth < 1024 ? "tablet"
      : "desktop"
    );
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 16, sw = 1.8 }: { d: string | string[]; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const IC = {
  dollar:  ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  check:   ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  doc:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8"],
  alert:   ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  bar:     ["M18 20v-10", "M12 20V4", "M6 20v-6"],
  plus:    "M12 5v14M5 12h14",
  arrow:   "M5 12h14M12 5l7 7-7 7",
  leaf:    ["M2 22 16 8", "M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"],
  edit:    ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  send:    ["M22 2L11 13", "M22 2 15 22 11 13 2 9l20-7z"],
  users:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  userchk: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M17 11l2 2 4-4"],
  clock:   ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skel({ h = 16, w = "100%", br = 6 }: { h?: number; w?: number | string; br?: number }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: br, flexShrink: 0,
      background: "linear-gradient(90deg,#ebebeb 25%,#e2e2e2 50%,#ebebeb 75%)",
      backgroundSize: "200% 100%",
      animation: "db-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

function StatusPill({ label, cfg }: { label: string; cfg?: [string, string] }) {
  const [bg, text] = cfg ?? STATUT_CFG[label] ?? ["#f3f4f6", "#6b7280"];
  return (
    <span style={{
      background: bg, color: text,
      fontSize: 10.5, fontWeight: 600, lineHeight: 1,
      padding: "3px 7px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function StatCardWithIcon({ icon, label, value, sub, color, delay = 0 }: StatCardProps & { icon: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 30, stiffness: 300 }}
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid var(--db-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${color}15`, color,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, color: "var(--db-text-3)", fontWeight: 500, textAlign: "right", maxWidth: "65%", lineHeight: 1.3 }}>
          {label}
        </span>
      </div>
      <div>
        <div style={{
          fontSize: 18, fontWeight: 600, color: "var(--db-text-1)",
          lineHeight: 1.2, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
        }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--db-text-3)", marginTop: 3 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: "1px solid var(--db-border)",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderBottom: "1px solid var(--db-border)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--db-text-1)" }}>{title}</span>
      {link && (
        <Link href={link} style={{
          textDecoration: "none", fontSize: 12, color: "#1a2e1e",
          fontWeight: 500, display: "flex", alignItems: "center", gap: 3, opacity: 0.7,
        }}>
          {linkLabel ?? "Voir tout"}
          <Ic d={IC.arrow} size={12} sw={2} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon, text, textColor, action }: {
  icon?: ReactNode; text: string; textColor?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {icon && <div style={{ color: textColor ?? "var(--db-text-3)", opacity: 0.6 }}>{icon}</div>}
      <p style={{ fontSize: 13, color: textColor ?? "var(--db-text-3)", fontWeight: 500, margin: 0, lineHeight: 1.4 }}>{text}</p>
      {action && (
        <Link href={action.href} style={{ textDecoration: "none", fontSize: 12.5, color: "#1a2e1e", fontWeight: 600 }}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  :root {
    --db-bg: #f4f5f7;
    --db-text-1: #111827;
    --db-text-2: #4b5563;
    --db-text-3: #9ca3af;
    --db-border: #e5e7eb;
  }
  @keyframes db-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const bp = useBp();
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";

  const [role, setRole] = useState<UserRole>("admin");
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recents, setRecents] = useState<Soumission[]>([]);
  const [allSoumissions, setAllSoumissions] = useState<Soumission[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/soumissions").then(r => r.json()),
      fetch("/api/prospects?statut=actif").then(r => r.json()),
    ]).then(([meRes, statsRes, soumRes, prospectsRes]) => {
      const fullName: string = meRes.full_name ?? "";
      setRole(meRes.role ?? "admin");
      setUserName(fullName || "Utilisateur");
      setUserInitials(
        fullName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U"
      );
      setStats(statsRes);
      const all: Soumission[] = soumRes.data ?? [];
      setAllSoumissions(all);
      setRecents(all.slice(0, 5));
      setProspects(prospectsRes.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const firstOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  // ─── Admin computed ───────────────────────────────────────────────────────

  const allOverdue = useMemo<OverdueProspect[]>(() => {
    return prospects
      .flatMap(p => {
        const sorted = [...(p.visites ?? [])].sort((a, b) => b.date_visite.localeCompare(a.date_visite));
        const last = sorted[0];
        if (!last?.date_prochaine_action || last.date_prochaine_action > today) return [];
        return [{ ...p, _lastVisit: last }];
      })
      .sort((a, b) => a._lastVisit.date_prochaine_action!.localeCompare(b._lastVisit.date_prochaine_action!));
  }, [prospects, today]);

  const overdueTop3 = allOverdue.slice(0, 3);
  const overdueCount = allOverdue.length;

  // ─── Chargé de projet computed ────────────────────────────────────────────

  const cpStats = useMemo(() => {
    const brouillons = allSoumissions.filter(s => s.statut === "Brouillon").length;
    const envoyeesList = allSoumissions.filter(s => s.statut === "Envoyée").slice(0, 5);
    const envoyees = allSoumissions.filter(s => s.statut === "Envoyée").length;
    const accepteesMonth = allSoumissions.filter(
      s => s.statut === "Acceptée" && s.date_offre >= firstOfMonth
    ).length;
    const caEnCours = allSoumissions
      .filter(s => s.statut === "Brouillon" || s.statut === "Envoyée")
      .reduce((sum, s) => sum + (s.total_ttc ?? 0), 0);
    return { brouillons, envoyees, envoyeesList, accepteesMonth, caEnCours };
  }, [allSoumissions, firstOfMonth]);

  // ─── Commercial computed ──────────────────────────────────────────────────

  const prospectsActifs = useMemo(
    () => prospects.filter(p => p.statut_global === "actif").length,
    [prospects]
  );
  const prospectsConvertis = useMemo(
    () => prospects.filter(p => p.statut_global === "converti").length,
    [prospects]
  );
  const prospectsMonth = useMemo(
    () => prospects.filter(p => p.created_at >= firstOfMonth).length,
    [prospects, firstOfMonth]
  );
  const prospectsRecents = useMemo(
    () => [...prospects].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [prospects]
  );

  // ─── Role labels ──────────────────────────────────────────────────────────

  const roleLabel = role === "commercial" ? "Commercial"
    : role === "charge_projet" ? "Chargé de projet"
    : "Administrateur";

  // ─── Cards per role ───────────────────────────────────────────────────────

  const adminCards: StatCardProps[] = [
    { icon: <Ic d={IC.dollar} size={14} sw={2} />, label: "CA Mandats",        value: loading ? "—" : formatMontant(stats?.total_mandats_acceptes ?? 0), sub: "DZD total accepté", color: "#1a2e1e" },
    { icon: <Ic d={IC.check}  size={14} sw={2} />, label: "Mandats acceptés",  value: loading ? "—" : fmtInt(stats?.nombre_mandats_acceptes ?? 0),          color: "#16a34a" },
    { icon: <Ic d={IC.doc}    size={14} sw={2} />, label: "Offres ce mois",    value: loading ? "—" : fmtInt(stats?.soumissions_mois ?? 0),                  color: "#2563eb" },
    { icon: <Ic d={IC.dollar} size={14} sw={2} />, label: "Versements reçus",  value: loading ? "—" : formatMontant(stats?.total_versements_recus ?? 0),     sub: "DZD perçus",      color: "#7c3aed" },
  ];

  const chargeProjetCards: StatCardProps[] = [
    { icon: <Ic d={IC.edit}   size={14} sw={2} />, label: "En brouillon",           value: loading ? "—" : fmtInt(cpStats.brouillons),       sub: "à finaliser",          color: "#f59e0b" },
    { icon: <Ic d={IC.clock}  size={14} sw={2} />, label: "En attente de réponse",  value: loading ? "—" : fmtInt(cpStats.envoyees),         sub: "offres envoyées",       color: "#2563eb" },
    { icon: <Ic d={IC.check}  size={14} sw={2} />, label: "Acceptées ce mois",      value: loading ? "—" : fmtInt(cpStats.accepteesMonth),                                color: "#16a34a" },
    { icon: <Ic d={IC.dollar} size={14} sw={2} />, label: "CA en cours",            value: loading ? "—" : formatMontant(cpStats.caEnCours), sub: "DZD pipeline actif",    color: "#1a2e1e" },
  ];

  const commercialCards: StatCardProps[] = [
    { icon: <Ic d={IC.users}   size={14} sw={2} />, label: "Prospects actifs",   value: loading ? "—" : fmtInt(prospectsActifs),   sub: "dans le pipeline",                               color: "#1a2e1e" },
    { icon: <Ic d={IC.alert}   size={14} sw={2} />, label: "Relances urgentes",  value: loading ? "—" : fmtInt(overdueCount),      sub: overdueCount > 0 ? "à traiter" : "tout est à jour", color: overdueCount > 0 ? "#dc2626" : "#16a34a" },
    { icon: <Ic d={IC.plus}    size={14} sw={2} />, label: "Prospects ce mois",  value: loading ? "—" : fmtInt(prospectsMonth),                                                            color: "#2563eb" },
    { icon: <Ic d={IC.userchk} size={14} sw={2} />, label: "Convertis",          value: loading ? "—" : fmtInt(prospectsConvertis),                                                       color: "#16a34a" },
  ];

  const displayedCards = role === "admin" ? adminCards
    : role === "charge_projet" ? chargeProjetCards
    : commercialCards;

  // ─── Shared: soumissions récentes ────────────────────────────────────────

  const soumissionsSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={22} />} text="Aucune soumission" action={{ label: "Créer une offre", href: "/soumissions/nouvelle" }} />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05, type: "spring", damping: 30, stiffness: 300 }}>
              <Link href={`/soumissions/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--db-border)", transition: "background .1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--db-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.titre_projet}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--db-text-3)", marginTop: 2 }}>
                      {s.numero_offre} · {s.client?.entreprise ?? "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!isMobile && (
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--db-text-2)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {formatMontant(s.total_ttc)}&nbsp;DZD
                      </span>
                    )}
                    <StatusPill label={s.statut} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  // ─── Shared: relances urgentes ────────────────────────────────────────────

  const relancesSection = (
    <Card>
      <CardHeader title="Relances urgentes" link="/prospection" linkLabel="Voir tout" />
      {loading ? (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map(i => <Skel key={i} h={56} br={6} />)}
        </div>
      ) : overdueTop3.length === 0 ? (
        <EmptyState icon={<Ic d={IC.check} size={22} />} text="Aucune relance en retard" textColor="#16a34a" />
      ) : (
        <div>
          {overdueTop3.map((p, i) => {
            const days = daysAgo(p._lastVisit.date_prochaine_action!);
            const hot = days > 3;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, type: "spring", damping: 30, stiffness: 300 }}>
                <Link href="/prospection" style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 16px", borderBottom: "1px solid var(--db-border)", transition: "background .1s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: hot ? "#dc2626" : "#f59e0b", marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--db-text-1)" }}>{p.entreprise}</div>
                      <div style={{ fontSize: 11, color: "var(--db-text-2)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.nom_contact} · {p._lastVisit.action_requise ?? "Relance planifiée"}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: hot ? "#dc2626" : "#d97706", marginTop: 3 }}>
                        {days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : `${days} jours de retard`}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  // ─── Chargé de projet: offres en attente de réponse ──────────────────────

  const enAttenteSection = (
    <Card>
      <CardHeader title="En attente de réponse" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : cpStats.envoyeesList.length === 0 ? (
        <EmptyState icon={<Ic d={IC.clock} size={22} />} text="Aucune offre en attente de réponse" textColor="#2563eb" />
      ) : (
        <div>
          {cpStats.envoyeesList.map((s, i) => {
            const daysSent = daysAgo(s.date_offre);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06, type: "spring", damping: 30, stiffness: 300 }}>
                <Link href={`/soumissions/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 16px", borderBottom: "1px solid var(--db-border)", transition: "background .1s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: daysSent > 14 ? "#f59e0b" : "#2563eb", marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--db-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.titre_projet}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--db-text-3)", marginTop: 2 }}>
                        {s.client?.entreprise ?? "—"} · {formatMontant(s.total_ttc)} DZD
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: daysSent > 14 ? "#d97706" : "var(--db-text-3)", marginTop: 3 }}>
                        Envoyée {daysSent === 0 ? "aujourd'hui" : daysSent === 1 ? "hier" : `il y a ${daysSent} jours`}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  // ─── Commercial: prospects récents ────────────────────────────────────────

  const STATUT_LABEL: Record<string, string> = {
    actif: "Actif", converti: "Converti", sans_suite: "Sans suite",
  };

  const prospectsSection = (
    <Card>
      <CardHeader title="Prospects récents" link="/prospection" linkLabel="Voir tout" />
      {loading ? (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : prospectsRecents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.users} size={22} />} text="Aucun prospect" action={{ label: "Ajouter un prospect", href: "/prospection" }} />
      ) : (
        <div>
          {prospectsRecents.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06, type: "spring", damping: 30, stiffness: 300 }}>
              <Link href="/prospection" style={{ textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--db-border)", transition: "background .1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--db-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.entreprise}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--db-text-3)", marginTop: 2 }}>
                      {p.nom_contact} · {p.secteur_activite}
                    </div>
                  </div>
                  <StatusPill
                    label={STATUT_LABEL[p.statut_global] ?? p.statut_global}
                    cfg={STATUT_PROSPECT[p.statut_global]}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  // ─── Admin: bilan financier ───────────────────────────────────────────────

  const bilanSection = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, type: "spring", damping: 30, stiffness: 300 }}>
      <Card>
        <CardHeader title="Bilan financier" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: isMobile ? "12px" : "16px", gap: 0 }}>
          {[
            { label: "CA Mandats",         value: loading ? null : `${formatMontant(stats?.total_mandats_acceptes ?? 0)} DZD`, color: "var(--db-text-1)" },
            { label: "Versements reçus",   value: loading ? null : `${formatMontant(stats?.total_versements_recus ?? 0)} DZD`, color: "#16a34a" },
            { label: "Taux d'acceptation", value: loading ? null : `${stats?.taux_acceptation ?? 0}%`,                         color: "#2563eb" },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ padding: isMobile ? "4px 8px" : "4px 16px", borderLeft: i > 0 ? "1px solid var(--db-border)" : "none" }}>
              <div style={{ fontSize: isMobile ? 9.5 : 10.5, color: "var(--db-text-3)", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {label}
              </div>
              {value !== null ? (
                <div style={{ fontSize: isMobile ? 12 : 16, fontWeight: 600, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", lineHeight: 1.3 }}>
                  {value}
                </div>
              ) : (
                <Skel h={isMobile ? 14 : 20} w="80%" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );

  // ─── Commercial: soumissions (sans montants) ─────────────────────────────

  const soumissionsCommercialSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={22} />} text="Aucune soumission" />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05, type: "spring", damping: 30, stiffness: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--db-border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--db-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.titre_projet}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--db-text-3)", marginTop: 2 }}>
                    {s.numero_offre} · {s.client?.entreprise ?? "—"}
                  </div>
                </div>
                <StatusPill label={s.statut} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  // ─── Content layout per role ──────────────────────────────────────────────

  const twoCol = (left: ReactNode, right: ReactNode, below?: ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: isDesktop ? 16 : 12 }}>
      <div style={isDesktop
        ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }
        : { display: "flex", flexDirection: "column", gap: 12 }
      }>
        {left}
        {right}
      </div>
      {below}
    </div>
  );

  const contentByRole = () => {
    if (role === "admin") return twoCol(soumissionsSection, relancesSection, bilanSection);
    if (role === "charge_projet") return twoCol(soumissionsSection, enAttenteSection);
    return twoCol(relancesSection, prospectsSection, soumissionsCommercialSection);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";

  return (
    <div style={{ fontFamily: FONT, background: "var(--db-bg)", minHeight: "100%" }}>
      <style>{CSS}</style>

      {/* Hero */}
      <div style={{
        background: "#1a2e1e",
        padding: isMobile ? "22px 16px 28px" : "28px 32px 36px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }} style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 14 : 18 }}>
            <div style={{
              width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, borderRadius: "50%",
              background: "rgba(255,255,255,.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {userInitials}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>
                {roleLabel}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontWeight: 500 }}>{userName}</div>
            </div>
          </div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fff", marginBottom: 5, letterSpacing: "-0.4px" }}>
            Bonjour, {userName.split(" ")[0]}
          </div>
          <div style={{ fontSize: isMobile ? 12.5 : 13, color: "rgba(255,255,255,.42)" }}>
            {role === "admin"
              ? "Vue d'ensemble de l'activité BTH Expert"
              : role === "charge_projet"
              ? "Vos soumissions et projets en cours"
              : "Votre pipeline commercial du jour"}
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? "16px 16px 80px" : "24px 32px", maxWidth: 1400 }}>

        {/* Stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 14 : 20,
        }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 12, padding: 14,
                  border: "1px solid var(--db-border)", boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Skel h={28} w={28} br={8} />
                    <Skel h={11} w="55%" />
                  </div>
                  <Skel h={18} w="65%" />
                </div>
              ))
            : displayedCards.map((c, i) => (
                <StatCardWithIcon key={c.label} {...c} delay={i * 0.06} />
              ))
          }
        </div>

        {/* Role-specific content */}
        {contentByRole()}
      </div>
    </div>
  );
}
