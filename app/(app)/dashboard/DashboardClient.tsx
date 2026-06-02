"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import useSWR from "swr";
import { DashboardStats, Prospect, Soumission, UserRole, Visite } from "@/types";
import { formatMontant } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

type OverdueProspect = Prospect & { _lastVisit: Visite };
type ApiListResponse<T> = { data?: T[] };
type MeResponse = {
  role?: UserRole;
  full_name?: string | null;
};

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
};

type ChartRow = {
  label: string;
  value: number;
  display: string;
  color: string;
};

const CSS = `
  .dash-shell {
    min-height: 100%;
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 34%, #f7f2ea 100%);
    color: #1a1714;
  }
  .dash-hero {
    padding: 22px clamp(16px, 3vw, 40px) 20px;
    background:
      linear-gradient(135deg, #1a2e1e 0%, #1f4429 58%, #101c12 100%);
    color: #ffffff;
    border-bottom: 1px solid rgba(201,169,110,.28);
  }
  .dash-hero-inner,
  .dash-body {
    width: min(100%, 1540px);
    margin: 0 auto;
  }
  .dash-identity {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
  }
  .dash-user {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }
  .dash-avatar {
    width: 42px;
    height: 42px;
    border-radius: 9999px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,.13);
    border: 1px solid rgba(255,255,255,.12);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .dash-role {
    color: rgba(255,255,255,.42);
    font-size: 10px;
    font-weight: 650;
  }
  .dash-user-name {
    margin-top: 3px;
    color: rgba(255,255,255,.82);
    font-size: 13px;
    font-weight: 650;
  }
  .dash-date-chip {
    height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 13px;
    border-radius: 9999px;
    border: 1px solid rgba(201,169,110,.34);
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.75);
    font-size: 11.5px;
    font-weight: 650;
    white-space: nowrap;
  }
  .dash-title-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 18px;
    margin-top: 24px;
  }
  .dash-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #c9a96e;
    font-size: 10.5px;
    font-weight: 650;
  }
  .dash-eyebrow::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .dash-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 32px;
    line-height: 1.06;
    font-weight: 600;
    color: #ffffff;
  }
  .dash-subtitle {
    margin-top: 8px;
    color: rgba(255,255,255,.58);
    font-size: 13px;
  }
  .dash-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .dash-body {
    padding: 18px clamp(16px, 3vw, 40px) 96px;
  }
  .dash-executive {
    display: grid;
    grid-template-columns: minmax(0, 1.06fr) minmax(290px, .94fr);
    gap: 14px;
    margin-bottom: 14px;
  }
  .dash-panel,
  .dash-card {
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.88);
    box-shadow: 0 18px 46px rgba(26,46,30,.07);
  }
  .dash-panel {
    border-radius: 16px;
    padding: 18px;
  }
  .dash-panel-kicker,
  .dash-section-kicker,
  .dash-kpi-label {
    color: #887f74;
    font-size: 10.5px;
    font-weight: 650;
  }
  .dash-panel-title {
    margin-top: 7px;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.08;
  }
  .dash-panel-value {
    margin-top: 15px;
    color: #1a2e1e;
    font-size: 28px;
    font-weight: 750;
    line-height: 1;
  }
  .dash-panel-value.is-danger {
    color: #c44a3a;
  }
  .dash-panel-value small {
    font-size: 11px;
    font-weight: 700;
  }
  .dash-panel-note {
    margin-top: 8px;
    color: #887f74;
    font-size: 12.5px;
    line-height: 1.45;
  }
  .dash-chart {
    display: grid;
    gap: 9px;
    margin-top: 17px;
    padding: 13px;
    border: 1px solid rgba(208,201,190,.78);
    border-radius: 14px;
    background: rgba(255,255,255,.68);
  }
  .dash-chart-row {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }
  .dash-chart-label {
    color: #635c54;
    font-size: 11.5px;
    font-weight: 650;
  }
  .dash-chart-track {
    height: 8px;
    overflow: hidden;
    border-radius: 9999px;
    background: #f0ebe3;
  }
  .dash-chart-fill {
    height: 100%;
    border-radius: 9999px;
  }
  .dash-chart-value {
    color: #45403a;
    font-size: 10.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .dash-kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .dash-kpi {
    min-height: 96px;
    border-radius: 16px;
    padding: 15px;
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.88);
    box-shadow: 0 14px 34px rgba(26,46,30,.05);
  }
  .dash-kpi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .dash-kpi-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .dash-kpi-value {
    margin-top: 14px;
    color: #1a1714;
    font-size: 18px;
    font-weight: 750;
    line-height: 1;
  }
  .dash-kpi-sub {
    margin-top: 6px;
    color: #887f74;
    font-size: 11.5px;
  }
  .dash-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .dash-stack {
    display: grid;
    gap: 14px;
  }
  .dash-card {
    border-radius: 16px;
    overflow: hidden;
  }
  .dash-card-header {
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 16px;
    border-bottom: 1px solid #e8e2d8;
    background: #fbfaf7;
  }
  .dash-card-title {
    color: #1a1714;
    font-size: 13px;
    font-weight: 700;
  }
  .dash-card-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #1a2e1e;
    font-size: 11.5px;
    font-weight: 650;
    text-decoration: none;
  }
  .dash-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid #f0ebe3;
    text-decoration: none;
    transition: background-color 150ms var(--bth-ease-micro), box-shadow 150ms var(--bth-ease-micro);
  }
  .dash-row:first-child {
    border-top: 0;
  }
  .dash-row:hover {
    background: #fffdfa;
    box-shadow: inset 3px 0 0 #c9a96e;
  }
  .dash-row-title {
    color: #1a1714;
    font-size: 12.5px;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dash-row-meta {
    margin-top: 4px;
    color: #887f74;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dash-row-side {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
  }
  .dash-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 24px;
    padding: 0 9px;
    border-radius: 9999px;
    border: 1px solid transparent;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  .dash-empty {
    display: grid;
    place-items: center;
    min-height: 142px;
    padding: 24px;
    color: #887f74;
    text-align: center;
    font-size: 12px;
    font-weight: 650;
  }
  .dash-finance-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .dash-finance-cell {
    padding: 17px 18px;
    border-left: 1px solid #e8e2d8;
  }
  .dash-finance-cell:first-child {
    border-left: 0;
  }
  .dash-finance-label {
    color: #887f74;
    font-size: 10.5px;
    font-weight: 650;
  }
  .dash-finance-value {
    margin-top: 8px;
    color: #1a1714;
    font-size: 15px;
    font-weight: 750;
  }
  @media (max-width: 1023px) {
    .dash-executive,
    .dash-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 640px) {
    .dash-hero {
      padding: 18px 14px 16px;
    }
    .dash-identity,
    .dash-title-row {
      grid-template-columns: 1fr;
    }
    .dash-date-chip {
      justify-self: start;
    }
    .dash-title {
      font-size: 26px;
    }
    .dash-actions {
      justify-content: stretch;
    }
    .dash-actions a {
      flex: 1;
    }
    .dash-actions button {
      width: 100%;
    }
    .dash-body {
      padding: 14px 14px 92px;
    }
    .dash-kpi-grid {
      display: flex;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .dash-kpi {
      min-width: 178px;
    }
    .dash-panel-title {
      font-size: 20px;
    }
    .dash-panel-value {
      font-size: 25px;
    }
    .dash-chart-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .dash-chart-value {
      justify-self: start;
    }
    .dash-finance-strip {
      grid-template-columns: 1fr;
    }
    .dash-finance-cell {
      border-left: 0;
      border-top: 1px solid #e8e2d8;
    }
    .dash-finance-cell:first-child {
      border-top: 0;
    }
  }
`;

const STATUS_CLASSES: Record<string, string> = {
  Brouillon: "bg-bth-n-100 text-bth-n-600 border-bth-n-200",
  "Envoyée": "bg-[rgba(58,124,165,0.12)] text-bth-info border-[rgba(58,124,165,0.18)]",
  "Acceptée": "bg-[rgba(58,122,80,0.12)] text-bth-success border-[rgba(58,122,80,0.18)]",
  "Refusée": "bg-[rgba(196,74,58,0.12)] text-bth-error border-[rgba(196,74,58,0.18)]",
};

const PROSPECT_STATUS_CLASSES: Record<string, string> = {
  actif: "bg-[rgba(58,124,165,0.12)] text-bth-info border-[rgba(58,124,165,0.18)]",
  converti: "bg-[rgba(58,122,80,0.12)] text-bth-success border-[rgba(58,122,80,0.18)]",
  sans_suite: "bg-bth-n-100 text-bth-n-600 border-bth-n-200",
};

const PROSPECT_STATUS_LABEL: Record<string, string> = {
  actif: "Actif",
  converti: "Converti",
  sans_suite: "Sans suite",
};

function fmtInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

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

function Ic({ d, size = 16, sw = 1.8 }: { d: string | string[]; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {Array.isArray(d) ? d.map((path, index) => <path key={index} d={path} />) : <path d={d} />}
    </svg>
  );
}

const IC = {
  dollar: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  check: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  doc: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8"],
  alert: ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M12 5l7 7-7 7",
  edit: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  userchk: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0 0 8", "M17 11l2 2 4-4"],
  clock: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"],
};

function Skel({ h = 16, w = "100%", br = 8 }: { h?: number; w?: number | string; br?: number }) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-bth-n-100 via-white to-bth-n-100"
      style={{ height: h, width: w, borderRadius: br, flexShrink: 0 }}
    />
  );
}

function StatusPill({ label, cfg }: { label: string; cfg?: string }) {
  return (
    <span className={`dash-pill ${cfg ?? STATUS_CLASSES[label] ?? "bg-bth-n-100 text-bth-n-600 border-bth-n-200"}`}>
      {label}
    </span>
  );
}

function StatCardWithIcon({ icon, label, value, sub, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="dash-kpi"
    >
      <div className="dash-kpi-top">
        <div className="dash-kpi-icon" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div className="dash-kpi-label text-right">{label}</div>
      </div>
      <div className="dash-kpi-value tnum">{value}</div>
      {sub && <div className="dash-kpi-sub">{sub}</div>}
    </motion.div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="dash-card">{children}</div>;
}

function CardHeader({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="dash-card-header">
      <div className="dash-card-title">{title}</div>
      {link && (
        <Link href={link} className="dash-card-link bth-focus">
          {linkLabel ?? "Voir tout"}
          <Ic d={IC.arrow} size={12} sw={2} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon, text, action }: { icon?: ReactNode; text: string; action?: { label: string; href: string } }) {
  return (
    <div className="dash-empty">
      <div>
        {icon && <div className="mb-2 text-bth-n-400 flex justify-center">{icon}</div>}
        <p>{text}</p>
        {action && (
          <Link href={action.href} className="inline-flex mt-3 no-underline">
            <Button variant="ghost" size="sm">{action.label}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Chart({ rows }: { rows: ChartRow[] }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  return (
    <div className="dash-chart" aria-label="Résumé graphique">
      {rows.map((row, index) => (
        <div key={row.label} className="dash-chart-row">
          <span className="dash-chart-label">{row.label}</span>
          <div className="dash-chart-track">
            <motion.div
              className="dash-chart-fill"
              style={{ background: row.color }}
              initial={{ width: 0 }}
              animate={{ width: `${row.value <= 0 ? 0 : Math.max(4, Math.round((row.value / max) * 100))}%` }}
              transition={{ delay: index * 0.08, duration: 0.55, ease: "easeOut" }}
            />
          </div>
          <span className="dash-chart-value">{row.display}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  initialProfile?: MeResponse;
  initialStats?: DashboardStats;
  initialSoumissions?: Soumission[];
  initialProspects?: Prospect[];
};

export default function DashboardClient({
  initialProfile,
  initialStats,
  initialSoumissions = [],
  initialProspects = [],
}: Props) {
  const bp = useBp();
  const isMobile = bp === "mobile";

  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me", {
    fallbackData: initialProfile,
    revalidateOnMount: !initialProfile,
  });
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>("/api/dashboard", {
    fallbackData: initialStats,
    revalidateOnMount: !initialStats,
  });
  const { data: soumRes, isLoading: soumissionsLoading } = useSWR<ApiListResponse<Soumission>>("/api/soumissions", {
    fallbackData: { data: initialSoumissions },
    revalidateOnMount: false,
  });
  const { data: prospectsRes, isLoading: prospectsLoading } = useSWR<ApiListResponse<Prospect>>("/api/prospects?statut=actif", {
    fallbackData: { data: initialProspects },
    revalidateOnMount: false,
  });

  const role = meRes?.role ?? "admin";
  const userName = meRes?.full_name || "Utilisateur";
  const userInitials = useMemo(
    () => userName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U",
    [userName]
  );
  const allSoumissions = useMemo(() => soumRes?.data ?? [], [soumRes]);
  const recents = useMemo(() => allSoumissions.slice(0, 5), [allSoumissions]);
  const prospects = useMemo(() => prospectsRes?.data ?? [], [prospectsRes]);
  const rawLoading = (meLoading && !meRes)
    || (statsLoading && !stats)
    || (soumissionsLoading && !soumRes)
    || (prospectsLoading && !prospectsRes);
  const loading = useDelayedLoading(rawLoading);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const firstOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

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

  const roleLabel = role === "commercial" ? "Commercial"
    : role === "charge_projet" ? "Chargé de projet"
    : "Administrateur";

  const userFirstName = userName.split(" ")[0] || "Aymen";
  const totalMandats = stats?.total_mandats_acceptes ?? 0;
  const totalVersements = stats?.total_versements_recus ?? 0;
  const reste = Math.max(0, totalMandats - totalVersements);

  const adminCards: StatCardProps[] = [
    { icon: <Ic d={IC.dollar} size={15} sw={2} />, label: "CA mandats", value: loading ? "-" : formatMontant(totalMandats), sub: "DZD acceptés", color: "#1a2e1e" },
    { icon: <Ic d={IC.check} size={15} sw={2} />, label: "Mandats acceptés", value: loading ? "-" : fmtInt(stats?.nombre_mandats_acceptes ?? 0), color: "#3a7a50" },
    { icon: <Ic d={IC.doc} size={15} sw={2} />, label: "Offres ce mois", value: loading ? "-" : fmtInt(stats?.soumissions_mois ?? 0), color: "#3a7ca5" },
    { icon: <Ic d={IC.dollar} size={15} sw={2} />, label: "Versements reçus", value: loading ? "-" : formatMontant(totalVersements), sub: "DZD perçus", color: "#c9a96e" },
  ];

  const chargeProjetCards: StatCardProps[] = [
    { icon: <Ic d={IC.edit} size={15} sw={2} />, label: "En brouillon", value: loading ? "-" : fmtInt(cpStats.brouillons), sub: "à finaliser", color: "#c9a96e" },
    { icon: <Ic d={IC.clock} size={15} sw={2} />, label: "En attente", value: loading ? "-" : fmtInt(cpStats.envoyees), sub: "offres envoyées", color: "#3a7ca5" },
    { icon: <Ic d={IC.check} size={15} sw={2} />, label: "Acceptées ce mois", value: loading ? "-" : fmtInt(cpStats.accepteesMonth), color: "#3a7a50" },
    { icon: <Ic d={IC.dollar} size={15} sw={2} />, label: "CA en cours", value: loading ? "-" : formatMontant(cpStats.caEnCours), sub: "DZD pipeline", color: "#1a2e1e" },
  ];

  const commercialCards: StatCardProps[] = [
    { icon: <Ic d={IC.users} size={15} sw={2} />, label: "Prospects actifs", value: loading ? "-" : fmtInt(prospectsActifs), sub: "dans le pipeline", color: "#1a2e1e" },
    { icon: <Ic d={IC.alert} size={15} sw={2} />, label: "Relances urgentes", value: loading ? "-" : fmtInt(overdueCount), sub: overdueCount > 0 ? "à traiter" : "tout est à jour", color: overdueCount > 0 ? "#c44a3a" : "#3a7a50" },
    { icon: <Ic d={IC.plus} size={15} sw={2} />, label: "Prospects ce mois", value: loading ? "-" : fmtInt(prospectsMonth), color: "#3a7ca5" },
    { icon: <Ic d={IC.userchk} size={15} sw={2} />, label: "Convertis", value: loading ? "-" : fmtInt(prospectsConvertis), color: "#3a7a50" },
  ];

  const displayedCards = role === "admin" ? adminCards
    : role === "charge_projet" ? chargeProjetCards
    : commercialCards;

  const executiveTitle = role === "admin" ? "Pilotage financier"
    : role === "charge_projet" ? "Pipeline offres"
    : "Priorité commerciale";

  const executiveValue = role === "admin" ? `${formatMontant(totalMandats)}`
    : role === "charge_projet" ? `${formatMontant(cpStats.caEnCours)}`
    : `${overdueCount}`;

  const executiveUnit = role === "commercial" ? "relances" : "DZD";

  const executiveNote = role === "admin"
    ? `${formatMontant(totalVersements)} DZD encaissés, ${formatMontant(reste)} DZD encore ouverts.`
    : role === "charge_projet"
    ? `${cpStats.brouillons} brouillon(s), ${cpStats.envoyees} offre(s) en attente.`
    : overdueCount > 0
    ? "Relances à traiter en priorité pour protéger le pipeline."
    : "Pipeline commercial à jour sur les prochaines actions.";

  const chartRows: ChartRow[] = role === "admin"
    ? [
        { label: "CA", value: totalMandats, display: `${formatMontant(totalMandats)} DZD`, color: "#1a2e1e" },
        { label: "Versements", value: totalVersements, display: `${formatMontant(totalVersements)} DZD`, color: "#c9a96e" },
        { label: "Reste", value: reste, display: `${formatMontant(reste)} DZD`, color: "#c44a3a" },
      ]
    : role === "charge_projet"
    ? [
        { label: "Brouillons", value: cpStats.brouillons, display: fmtInt(cpStats.brouillons), color: "#c9a96e" },
        { label: "Envoyées", value: cpStats.envoyees, display: fmtInt(cpStats.envoyees), color: "#3a7ca5" },
        { label: "Acceptées", value: cpStats.accepteesMonth, display: fmtInt(cpStats.accepteesMonth), color: "#3a7a50" },
      ]
    : [
        { label: "Actifs", value: prospectsActifs, display: fmtInt(prospectsActifs), color: "#1a2e1e" },
        { label: "Urgents", value: overdueCount, display: fmtInt(overdueCount), color: overdueCount > 0 ? "#c44a3a" : "#3a7a50" },
        { label: "Convertis", value: prospectsConvertis, display: fmtInt(prospectsConvertis), color: "#c9a96e" },
      ];

  const soumissionsSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div className="p-4 grid gap-2">{[0, 1, 2].map(i => <Skel key={i} h={52} br={10} />)}</div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={24} />} text="Aucune soumission" action={{ label: "Créer une offre", href: "/soumissions/nouvelle" }} />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/soumissions/${s.id}`} className="dash-row">
                <div className="min-w-0">
                  <div className="dash-row-title">{s.titre_projet}</div>
                  <div className="dash-row-meta">{s.numero_offre} · {s.client?.entreprise ?? "-"}</div>
                </div>
                <div className="dash-row-side">
                  {!isMobile && <span className="text-[12px] font-bold text-bth-n-700 tnum whitespace-nowrap">{formatMontant(s.total_ttc)} DZD</span>}
                  <StatusPill label={s.statut} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  const relancesSection = (
    <Card>
      <CardHeader title="Relances urgentes" link="/prospection" linkLabel="Voir tout" />
      {loading ? (
        <div className="p-4 grid gap-2">{[0, 1, 2].map(i => <Skel key={i} h={58} br={10} />)}</div>
      ) : overdueTop3.length === 0 ? (
        <EmptyState icon={<Ic d={IC.check} size={24} />} text="Aucune relance en retard" />
      ) : (
        <div>
          {overdueTop3.map((p, i) => {
            const days = daysAgo(p._lastVisit.date_prochaine_action!);
            const hot = days > 3;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href="/prospection" className="dash-row">
                  <div className="min-w-0">
                    <div className="dash-row-title">{p.entreprise}</div>
                    <div className="dash-row-meta">{p.nom_contact} · {p._lastVisit.action_requise ?? "Relance planifiée"}</div>
                  </div>
                  <span className={`dash-pill ${hot ? "bg-red-50 text-bth-error border-red-100" : "bg-bth-gold-50 text-bth-gold-700 border-bth-gold-200"}`}>
                    {days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : `${days} j retard`}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const enAttenteSection = (
    <Card>
      <CardHeader title="En attente de réponse" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div className="p-4 grid gap-2">{[0, 1, 2].map(i => <Skel key={i} h={52} br={10} />)}</div>
      ) : cpStats.envoyeesList.length === 0 ? (
        <EmptyState icon={<Ic d={IC.clock} size={24} />} text="Aucune offre en attente de réponse" />
      ) : (
        <div>
          {cpStats.envoyeesList.map((s, i) => {
            const daysSent = daysAgo(s.date_offre);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/soumissions/${s.id}`} className="dash-row">
                  <div className="min-w-0">
                    <div className="dash-row-title">{s.titre_projet}</div>
                    <div className="dash-row-meta">{s.client?.entreprise ?? "-"} · {formatMontant(s.total_ttc)} DZD</div>
                  </div>
                  <span className="dash-pill bg-[rgba(58,124,165,0.12)] text-bth-info border-[rgba(58,124,165,0.18)]">
                    {daysSent === 0 ? "Aujourd'hui" : `${daysSent} j`}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const prospectsSection = (
    <Card>
      <CardHeader title="Prospects récents" link="/prospection" linkLabel="Voir tout" />
      {loading ? (
        <div className="p-4 grid gap-2">{[0, 1, 2].map(i => <Skel key={i} h={52} br={10} />)}</div>
      ) : prospectsRecents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.users} size={24} />} text="Aucun prospect" action={{ label: "Ajouter un prospect", href: "/prospection" }} />
      ) : (
        <div>
          {prospectsRecents.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href="/prospection" className="dash-row">
                <div className="min-w-0">
                  <div className="dash-row-title">{p.entreprise}</div>
                  <div className="dash-row-meta">{p.nom_contact} · {p.secteur_activite}</div>
                </div>
                <StatusPill label={PROSPECT_STATUS_LABEL[p.statut_global] ?? p.statut_global} cfg={PROSPECT_STATUS_CLASSES[p.statut_global]} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  const bilanSection = (
    <Card>
      <CardHeader title="Bilan financier" />
      <div className="dash-finance-strip">
        {[
          { label: "CA mandats", value: loading ? null : `${formatMontant(totalMandats)} DZD`, color: "#1a1714" },
          { label: "Versements reçus", value: loading ? null : `${formatMontant(totalVersements)} DZD`, color: "#3a7a50" },
          { label: "Taux d'acceptation", value: loading ? null : `${stats?.taux_acceptation ?? 0}%`, color: "#3a7ca5" },
        ].map(item => (
          <div key={item.label} className="dash-finance-cell">
            <div className="dash-finance-label">{item.label}</div>
            {item.value ? <div className="dash-finance-value tnum" style={{ color: item.color }}>{item.value}</div> : <Skel h={20} w="70%" />}
          </div>
        ))}
      </div>
    </Card>
  );

  const soumissionsCommercialSection = (
    <Card>
      <CardHeader title="Soumissions récentes" link="/soumissions" linkLabel="Voir tout" />
      {loading ? (
        <div className="p-4 grid gap-2">{[0, 1, 2].map(i => <Skel key={i} h={52} br={10} />)}</div>
      ) : recents.length === 0 ? (
        <EmptyState icon={<Ic d={IC.doc} size={24} />} text="Aucune soumission" />
      ) : (
        <div>
          {recents.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="dash-row">
                <div className="min-w-0">
                  <div className="dash-row-title">{s.titre_projet}</div>
                  <div className="dash-row-meta">{s.numero_offre} · {s.client?.entreprise ?? "-"}</div>
                </div>
                <StatusPill label={s.statut} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );

  const contentByRole = () => {
    if (role === "admin") return (
      <div className="dash-stack">
        <div className="dash-grid">{soumissionsSection}{relancesSection}</div>
        {bilanSection}
      </div>
    );
    if (role === "charge_projet") return (
      <div className="dash-grid">{soumissionsSection}{enAttenteSection}</div>
    );
    return (
      <div className="dash-stack">
        <div className="dash-grid">{relancesSection}{prospectsSection}</div>
        {soumissionsCommercialSection}
      </div>
    );
  };

  return (
    <div className="dash-shell">
      <style>{CSS}</style>
      <header className="dash-hero">
        <div className="dash-hero-inner">
          <div className="dash-identity">
            <div className="dash-user">
              <div className="dash-avatar">{userInitials}</div>
              <div className="min-w-0">
                <div className="dash-role">{roleLabel}</div>
                <div className="dash-user-name truncate">{userName || "Utilisateur"}</div>
              </div>
            </div>
            <div className="dash-date-chip">
              <Ic d={IC.clock} size={14} />
              Aujourd'hui
            </div>
          </div>

          <div className="dash-title-row">
            <div>
              <div className="dash-eyebrow">Tableau de bord</div>
              <h1 className="dash-title">Bonjour, {userFirstName}</h1>
              <p className="dash-subtitle">
                {role === "admin"
                  ? "Vue consolidée de l'activité, des revenus et des priorités."
                  : role === "charge_projet"
                  ? "Suivi des offres, brouillons et réponses en attente."
                  : "Pipeline commercial et relances à traiter aujourd'hui."}
              </p>
            </div>
            <div className="dash-actions">
              {role !== "commercial" && (
                <Link href="/soumissions/nouvelle" className="no-underline">
                  <Button size="md"><Ic d={IC.plus} size={14} />Nouvelle offre</Button>
                </Link>
              )}
              {role !== "charge_projet" && (
                <Link href="/prospection/nouveau" className="no-underline">
                  <Button variant="secondary" size="md"><Ic d={IC.plus} size={14} />Prospect</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dash-body">
        <section className="dash-executive">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dash-panel">
            <div className="dash-panel-kicker">Résumé exécutif</div>
            <div className="dash-panel-title">{executiveTitle}</div>
            <div className={`dash-panel-value tnum ${role === "commercial" && overdueCount > 0 ? "is-danger" : ""}`}>
              {loading ? "-" : executiveValue} <small>{executiveUnit}</small>
            </div>
            <p className="dash-panel-note">{loading ? "Chargement des indicateurs..." : executiveNote}</p>
            <Chart rows={chartRows} />
          </motion.div>

          <div className="dash-kpi-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="dash-kpi">
                    <div className="dash-kpi-top">
                      <Skel h={32} w={32} br={10} />
                      <Skel h={12} w="55%" />
                    </div>
                    <Skel h={22} w="65%" br={7} />
                  </div>
                ))
              : displayedCards.map((card, i) => <StatCardWithIcon key={card.label} {...card} delay={i * 0.04} />)}
          </div>
        </section>

        {contentByRole()}
      </main>
    </div>
  );
}
