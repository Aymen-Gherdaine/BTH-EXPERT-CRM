"use client";

import { useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardStats, Prospect, Soumission, UserRole, Visite } from "@/types";
import { formatMontant } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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

const STATUT_CFG: Record<string, string> = {
  Brouillon:  "bg-bth-n-100 text-bth-n-600",
  "Envoyée":  "bg-[rgba(58,124,165,0.12)] text-bth-info",
  "Acceptée": "bg-[rgba(58,122,80,0.12)] text-bth-success",
  "Refusée":  "bg-[rgba(196,74,58,0.12)] text-bth-error",
};

const STATUT_PROSPECT: Record<string, string> = {
  actif:      "bg-[rgba(58,124,165,0.12)] text-bth-info",
  converti:   "bg-[rgba(58,122,80,0.12)] text-bth-success",
  sans_suite: "bg-bth-n-100 text-bth-n-600",
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
  plus:    "M12 5v14M5 12h14",
  arrow:   "M5 12h14M12 5l7 7-7 7",
  edit:    ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  users:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  userchk: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M17 11l2 2 4-4"],
  clock:   ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skel({ h = 16, w = "100%", br = 4 }: { h?: number; w?: number | string; br?: number }) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-bth-n-100 via-bth-n-200 to-bth-n-100"
      style={{ height: h, width: w, borderRadius: br, flexShrink: 0 }}
    />
  );
}

function StatusPill({ label, cfg }: { label: string; cfg?: string }) {
  const classes = cfg ?? STATUT_CFG[label] ?? "bg-bth-n-100 text-bth-n-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-bth-pill text-[10.5px] font-semibold leading-none whitespace-nowrap ${classes}`}>
      {label}
    </span>
  );
}

function StatCardWithIcon({ icon, label, value, sub, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 30, stiffness: 300 }}
      className="bg-white border border-bth-hairline rounded-bth-lg p-4 flex flex-col gap-[10px] shadow-[var(--bth-shadow-sm)]"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-7 h-7 rounded-bth-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1e`, color }}
        >
          {icon}
        </div>
        <span className="text-[11px] text-bth-n-500 font-medium text-right max-w-[65%] leading-[1.3]">
          {label}
        </span>
      </div>
      <div>
        <div className="text-[18px] font-semibold text-bth-n-900 leading-[1.2] tnum tracking-[-0.3px]">
          {value}
        </div>
        {sub && <div className="text-[11px] text-bth-n-500 mt-[3px]">{sub}</div>}
      </div>
    </motion.div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-bth-hairline rounded-bth-lg overflow-hidden shadow-[var(--bth-shadow-sm)] ${className ?? ""}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-bth-hairline">
      <span className="text-[13px] font-semibold text-bth-n-900">{title}</span>
      {link && (
        <Link
          href={link}
          className="no-underline text-[12px] text-bth-green-800 font-medium flex items-center gap-[3px] opacity-70 hover:opacity-100 transition-opacity duration-100 bth-focus"
        >
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
    <div className="py-7 px-4 text-center flex flex-col items-center gap-2">
      {icon && (
        <div className="text-bth-n-400 opacity-60" style={textColor ? { color: textColor } : undefined}>
          {icon}
        </div>
      )}
      <p
        className="text-[13px] text-bth-n-500 font-medium leading-[1.4] m-0"
        style={textColor ? { color: textColor } : undefined}
      >
        {text}
      </p>
      {action && (
        <Link href={action.href}>
          <Button variant="ghost" size="sm">{action.label} →</Button>
        </Link>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const bp = useBp();
  const isMobile = bp === "mobile";

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
    { icon: <Ic d={IC.check}  size={14} sw={2} />, label: "Mandats acceptés",  value: loading ? "—" : fmtInt(stats?.nombre_mandats_acceptes ?? 0),          color: "#3a7a50" },
    { icon: <Ic d={IC.doc}    size={14} sw={2} />, label: "Offres ce mois",    value: loading ? "—" : fmtInt(stats?.soumissions_mois ?? 0),                  color: "#3a7ca5" },
    { icon: <Ic d={IC.dollar} size={14} sw={2} />, label: "Versements reçus",  value: loading ? "—" : formatMontant(stats?.total_versements_recus ?? 0),     sub: "DZD perçus",      color: "#7c3aed" },
  ];

  const chargeProjetCards: StatCardProps[] = [
    { icon: <Ic d={IC.edit}   size={14} sw={2} />, label: "En brouillon",          value: loading ? "—" : fmtInt(cpStats.brouillons),       sub: "à finaliser",         color: "#C9A96E" },
    { icon: <Ic d={IC.clock}  size={14} sw={2} />, label: "En attente de réponse", value: loading ? "—" : fmtInt(cpStats.envoyees),         sub: "offres envoyées",      color: "#3a7ca5" },
    { icon: <Ic d={IC.check}  size={14} sw={2} />, label: "Acceptées ce mois",     value: loading ? "—" : fmtInt(cpStats.accepteesMonth),                               color: "#3a7a50" },
    { icon: <Ic d={IC.dollar} size={14} sw={2} />, label: "CA en cours",           value: loading ? "—" : formatMontant(cpStats.caEnCours), sub: "DZD pipeline actif",   color: "#1a2e1e" },
  ];

  const commercialCards: StatCardProps[] = [
    { icon: <Ic d={IC.users}   size={14} sw={2} />, label: "Prospects actifs",  value: loading ? "—" : fmtInt(prospectsActifs),   sub: "dans le pipeline",                                 color: "#1a2e1e" },
    { icon: <Ic d={IC.alert}   size={14} sw={2} />, label: "Relances urgentes", value: loading ? "—" : fmtInt(overdueCount),      sub: overdueCount > 0 ? "à traiter" : "tout est à jour", color: overdueCount > 0 ? "#c44a3a" : "#3a7a50" },
    { icon: <Ic d={IC.plus}    size={14} sw={2} />, label: "Prospects ce mois", value: loading ? "—" : fmtInt(prospectsMonth),                                                              color: "#3a7ca5" },
    { icon: <Ic d={IC.userchk} size={14} sw={2} />, label: "Convertis",         value: loading ? "—" : fmtInt(prospectsConvertis),                                                         color: "#3a7a50" },
  ];

  const displayedCards = role === "admin" ? adminCards
    : role === "charge_projet" ? chargeProjetCards
    : commercialCards;

  // ─── Shared: soumissions récentes ─────────────────────────────────────────

  const soumissionsSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div className="px-4 py-[10px] flex flex-col gap-[6px]">
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={22} />} text="Aucune soumission" action={{ label: "Créer une offre", href: "/soumissions/nouvelle" }} />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05, type: "spring", damping: 30, stiffness: 300 }}>
              <Link href={`/soumissions/${s.id}`} className="block no-underline">
                <div className="flex items-center gap-[10px] px-4 py-[10px] border-b border-bth-hairline hover:bg-bth-n-50 transition-colors duration-100">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-bth-n-900 overflow-hidden text-ellipsis whitespace-nowrap">
                      {s.titre_projet}
                    </div>
                    <div className="text-[11px] text-bth-n-400 mt-0.5">
                      {s.numero_offre} · {s.client?.entreprise ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isMobile && (
                      <span className="text-[12px] font-medium text-bth-n-600 tnum whitespace-nowrap">
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
        <div className="px-4 py-[10px] flex flex-col gap-[6px]">
          {[0, 1, 2].map(i => <Skel key={i} h={56} br={6} />)}
        </div>
      ) : overdueTop3.length === 0 ? (
        <EmptyState
          icon={<Ic d={IC.check} size={22} />}
          text="Aucune relance en retard"
          textColor="var(--color-bth-success)"
        />
      ) : (
        <div>
          {overdueTop3.map((p, i) => {
            const days = daysAgo(p._lastVisit.date_prochaine_action!);
            const hot = days > 3;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, type: "spring", damping: 30, stiffness: 300 }}>
                <Link href="/prospection" className="block no-underline">
                  <div className="flex gap-[10px] items-start px-4 py-[10px] border-b border-bth-hairline hover:bg-bth-n-50 transition-colors duration-100">
                    <div
                      className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0"
                      style={{ background: hot ? "var(--color-bth-error)" : "var(--color-bth-warning)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-bth-n-900">{p.entreprise}</div>
                      <div className="text-[11px] text-bth-n-600 mt-[1px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {p.nom_contact} · {p._lastVisit.action_requise ?? "Relance planifiée"}
                      </div>
                      <div
                        className="text-[11px] font-semibold mt-[3px]"
                        style={{ color: hot ? "var(--color-bth-error)" : "var(--color-bth-gold-600)" }}
                      >
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
        <div className="px-4 py-[10px] flex flex-col gap-[6px]">
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : cpStats.envoyeesList.length === 0 ? (
        <EmptyState
          icon={<Ic d={IC.clock} size={22} />}
          text="Aucune offre en attente de réponse"
          textColor="var(--color-bth-info)"
        />
      ) : (
        <div>
          {cpStats.envoyeesList.map((s, i) => {
            const daysSent = daysAgo(s.date_offre);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06, type: "spring", damping: 30, stiffness: 300 }}>
                <Link href={`/soumissions/${s.id}`} className="block no-underline">
                  <div className="flex gap-[10px] items-start px-4 py-[10px] border-b border-bth-hairline hover:bg-bth-n-50 transition-colors duration-100">
                    <div
                      className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0"
                      style={{ background: daysSent > 14 ? "var(--color-bth-warning)" : "var(--color-bth-info)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-bth-n-900 overflow-hidden text-ellipsis whitespace-nowrap">
                        {s.titre_projet}
                      </div>
                      <div className="text-[11px] text-bth-n-400 mt-0.5">
                        {s.client?.entreprise ?? "—"} · <span className="tnum">{formatMontant(s.total_ttc)} DZD</span>
                      </div>
                      <div
                        className="text-[11px] font-medium mt-[3px]"
                        style={{ color: daysSent > 14 ? "var(--color-bth-gold-600)" : "var(--color-bth-n-400)" }}
                      >
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
        <div className="px-4 py-[10px] flex flex-col gap-[6px]">
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : prospectsRecents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.users} size={22} />} text="Aucun prospect" action={{ label: "Ajouter un prospect", href: "/prospection" }} />
      ) : (
        <div>
          {prospectsRecents.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06, type: "spring", damping: 30, stiffness: 300 }}>
              <Link href="/prospection" className="block no-underline">
                <div className="flex items-center gap-[10px] px-4 py-[10px] border-b border-bth-hairline hover:bg-bth-n-50 transition-colors duration-100">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-bth-n-900 overflow-hidden text-ellipsis whitespace-nowrap">
                      {p.entreprise}
                    </div>
                    <div className="text-[11px] text-bth-n-400 mt-0.5">
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
        <div className="grid grid-cols-3 p-3 md:p-4">
          {[
            { label: "CA Mandats",         value: loading ? null : `${formatMontant(stats?.total_mandats_acceptes ?? 0)} DZD`, color: "var(--color-bth-n-900)" },
            { label: "Versements reçus",   value: loading ? null : `${formatMontant(stats?.total_versements_recus ?? 0)} DZD`, color: "var(--color-bth-success)" },
            { label: "Taux d'acceptation", value: loading ? null : `${stats?.taux_acceptation ?? 0}%`,                         color: "var(--color-bth-info)" },
          ].map(({ label, value, color }, i) => (
            <div key={label} className={`px-2 py-1 md:px-4 md:py-1${i > 0 ? " border-l border-bth-hairline" : ""}`}>
              <div className="text-[9.5px] md:text-[10.5px] text-bth-n-400 font-medium uppercase tracking-[.05em] mb-1">
                {label}
              </div>
              {value !== null ? (
                <div className="text-[12px] md:text-[16px] font-semibold tnum tracking-[-0.2px] leading-[1.3]" style={{ color }}>
                  {value}
                </div>
              ) : (
                <Skel h={20} w="80%" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );

  // ─── Commercial: soumissions (sans montants) ──────────────────────────────

  const soumissionsCommercialSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div className="px-4 py-[10px] flex flex-col gap-[6px]">
          {[0, 1, 2].map(i => <Skel key={i} h={48} br={6} />)}
        </div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={22} />} text="Aucune soumission" />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05, type: "spring", damping: 30, stiffness: 300 }}>
              <div className="flex items-center gap-[10px] px-4 py-[10px] border-b border-bth-hairline">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-bth-n-900 overflow-hidden text-ellipsis whitespace-nowrap">
                    {s.titre_projet}
                  </div>
                  <div className="text-[11px] text-bth-n-400 mt-0.5">
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
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 lg:gap-4">
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-bth-canvas min-h-full">

      {/* Hero */}
      <div className="bg-bth-green-800 px-4 pt-[22px] pb-7 md:px-8 md:pt-7 md:pb-9 relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[20%] w-[300px] h-[300px] rounded-full bg-white/[0.03] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative"
        >
          <div className="flex items-center gap-[10px] mb-[14px] md:mb-[18px]">
            <div className="w-[34px] h-[34px] md:w-[38px] md:h-[38px] rounded-full bg-white/[0.12] flex items-center justify-center text-white font-bold text-[12px] md:text-[13px] flex-shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="text-[10px] text-white/40 font-medium tracking-[.05em] uppercase">
                {roleLabel}
              </div>
              <div className="text-[13px] text-white/[65%] font-medium">{userName}</div>
            </div>
          </div>
          <div className="text-[20px] md:text-[24px] font-bold text-white mb-[5px] tracking-[-0.4px]">
            Bonjour, {userName.split(" ")[0]}
          </div>
          <div className="text-[12.5px] md:text-[13px] text-white/[42%]">
            {role === "admin"
              ? "Vue d'ensemble de l'activité BTH Expert"
              : role === "charge_projet"
              ? "Vos soumissions et projets en cours"
              : "Votre pipeline commercial du jour"}
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-20 md:px-8 md:pt-6 max-w-[1400px]">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-bth-hairline rounded-bth-lg p-4 flex flex-col gap-[10px] shadow-[var(--bth-shadow-sm)]">
                  <div className="flex justify-between items-center">
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
