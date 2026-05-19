"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateFr, formatMontant } from "@/lib/utils";

type Periode = "month" | "quarter" | "year" | "all";

type ProjetStat = {
  soumission_id: string;
  titre_projet: string;
  client_nom: string;
  revenu: number;
  depenses: number;
  marge: number;
  marge_pct: number;
};

type EmployeStat = {
  employe_id: string;
  nom: string;
  total: number;
  par_categorie: Record<string, number>;
};

type FraisItem = {
  id: string;
  montant: number;
  description: string | null;
  date_depense: string;
  employe: string;
};

type FraisGroupe = {
  categorie: string;
  total: number;
  items: FraisItem[];
};

type Stats = {
  total_revenus: number;
  total_depenses: number;
  marge_nette: number;
  par_projet: ProjetStat[];
  par_employe: EmployeStat[];
  depenses_non_liees: FraisGroupe[];
};

const CSS = `
  .finance-shell {
    min-height: 100%;
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 34%, #f7f2ea 100%);
    color: #1a1714;
  }
  .finance-inner {
    width: min(100%, 1500px);
    margin: 0 auto;
    padding: clamp(18px, 3vw, 36px) clamp(14px, 3vw, 40px) 104px;
  }
  .finance-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 18px;
    margin-bottom: clamp(18px, 3vw, 30px);
  }
  .finance-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #a8874e;
    font-size: 11px;
    font-weight: 700;
  }
  .finance-kicker::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .finance-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.02;
    color: #1a1714;
  }
  .finance-subtitle {
    margin-top: 8px;
    color: #887f74;
    font-size: 13px;
  }
  .finance-period {
    display: inline-grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
    border-radius: 9999px;
    background: #f0ebe3;
    border: 1px solid #e8e2d8;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
  }
  .finance-period button {
    position: relative;
    height: 38px;
    min-width: 88px;
    padding: 0 16px;
    border: 0;
    border-radius: 9999px;
    background: transparent;
    color: #635c54;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }
  .finance-period button span {
    position: relative;
    z-index: 1;
  }
  .finance-period .active-bg {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: #1a2e1e;
    box-shadow: 0 10px 22px rgba(26,46,30,.16);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
    gap: 16px;
    margin-bottom: clamp(28px, 4vw, 46px);
  }
  .balance-card,
  .metric-card,
  .project-card,
  .employee-card,
  .general-card,
  .empty-card,
  .error-card {
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.88);
    box-shadow: 0 18px 46px rgba(26,46,30,.07);
  }
  .balance-card {
    min-height: 216px;
    border-radius: 16px;
    padding: clamp(20px, 3vw, 30px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .balance-card.negative {
    background: linear-gradient(135deg, #fffaf6 0%, #fff2ed 100%);
    border-color: #f0b9ad;
  }
  .balance-card.positive {
    background: linear-gradient(135deg, #ffffff 0%, #eef7f1 100%);
    border-color: #c1d9c6;
  }
  .metric-stack {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .metric-card {
    min-height: 100px;
    border-radius: 16px;
    padding: 18px;
  }
  .metric-label,
  .section-label {
    color: #887f74;
    font-size: 12px;
    font-weight: 700;
  }
  .metric-value {
    margin-top: 12px;
    color: #1a1714;
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
  }
  .metric-value small {
    font-size: 13px;
    font-weight: 700;
  }
  .metric-note {
    margin-top: 8px;
    color: #887f74;
    font-size: 13px;
  }
  .balance-value {
    margin-top: 14px;
    font-size: 28px;
    line-height: .95;
    font-weight: 750;
  }
  .balance-value small {
    font-size: 13px;
    font-weight: 800;
  }
  .finance-chart {
    display: grid;
    gap: 10px;
    margin-top: 18px;
    padding: 13px;
    border-radius: 14px;
    border: 1px solid rgba(208,201,190,.72);
    background: rgba(255,255,255,.58);
  }
  .finance-chart-row {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }
  .finance-chart-label {
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
  }
  .finance-chart-track {
    height: 8px;
    overflow: hidden;
    border-radius: 9999px;
    background: #f0ebe3;
  }
  .finance-chart-fill {
    height: 100%;
    border-radius: 9999px;
  }
  .finance-chart-value {
    color: #45403a;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }
  .finance-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 22px;
  }
  .finance-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 9999px;
    background: rgba(255,255,255,.74);
    border: 1px solid rgba(208,201,190,.78);
    color: #45403a;
    font-size: 12px;
    font-weight: 700;
  }
  .finance-chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: currentColor;
  }
  .finance-section {
    margin-bottom: clamp(30px, 5vw, 56px);
  }
  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
  }
  .section-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1.05;
    font-weight: 600;
    color: #1a1714;
  }
  .section-count {
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 11px;
    border-radius: 9999px;
    background: #f5f0e8;
    border: 1px solid #e8e2d8;
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .project-card {
    border-radius: 16px;
    padding: 18px;
  }
  .project-top {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
  }
  .finance-icon-box {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #1a2e1e;
    background: #f5f0e8;
    border: 1px solid #e8e2d8;
  }
  .project-title {
    color: #1a1714;
    font-size: 15px;
    line-height: 1.28;
    font-weight: 800;
  }
  .project-client {
    margin-top: 4px;
    color: #887f74;
    font-size: 13px;
  }
  .margin-badge {
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    padding: 0 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }
  .finance-rows {
    display: grid;
    gap: 8px;
    margin-top: 16px;
  }
  .finance-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #635c54;
    font-size: 13px;
  }
  .finance-row strong {
    color: #1a1714;
    white-space: nowrap;
  }
  .progress-track {
    height: 8px;
    margin-top: 14px;
    overflow: hidden;
    border-radius: 9999px;
    background: #f0ebe3;
  }
  .progress-fill {
    height: 100%;
    border-radius: 9999px;
  }
  .employee-list {
    display: grid;
    gap: 12px;
  }
  .employee-card {
    border-radius: 16px;
    padding: 18px;
  }
  .employee-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .employee-name {
    font-size: 15px;
    font-weight: 800;
    color: #1a1714;
  }
  .employee-total {
    font-size: 15px;
    font-weight: 750;
    color: #1a2e1e;
    white-space: nowrap;
  }
  .category-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }
  .category-chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
  }
  .general-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .general-card {
    border-radius: 16px;
    overflow: hidden;
  }
  .general-head {
    min-height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #e8e2d8;
    background: #fbfaf7;
  }
  .expense-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid #f0ebe3;
  }
  .expense-item:first-child {
    border-top: 0;
  }
  .expense-desc {
    color: #1a1714;
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .expense-meta {
    margin-top: 3px;
    color: #887f74;
    font-size: 12px;
  }
  .expense-amount {
    color: #1a1714;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }
  .empty-card,
  .error-card {
    border-radius: 16px;
    padding: 22px;
    color: #887f74;
    font-size: 14px;
  }
  .error-card {
    color: #9f2f23;
    background: #fff2ed;
    border-color: #f0b9ad;
  }
  .finance-skeleton {
    display: grid;
    gap: 16px;
  }
  .sk {
    border-radius: 16px;
    background: linear-gradient(90deg, #f0ebe3 0%, #ffffff 45%, #f0ebe3 100%);
    background-size: 220% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border: 1px solid #e8e2d8;
  }
  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
  @media (max-width: 900px) {
    .finance-header,
    .summary-grid,
    .projects-grid,
    .general-grid {
      grid-template-columns: 1fr;
    }
    .finance-period {
      width: 100%;
      justify-self: stretch;
      overflow: hidden;
    }
    .finance-period button {
      min-width: 0;
      padding: 0 10px;
    }
    .metric-stack {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .finance-title {
      font-size: 28px;
    }
    .balance-value {
      font-size: 28px;
    }
    .metric-value {
      font-size: 22px;
    }
    .section-title {
      font-size: 20px;
    }
  }
  @media (max-width: 560px) {
    .finance-inner {
      padding: 18px 14px 96px;
    }
    .finance-title {
      font-size: 24px;
    }
    .finance-subtitle {
      font-size: 14px;
    }
    .finance-period {
      gap: 3px;
      padding: 3px;
    }
    .finance-period button {
      height: 36px;
      padding: 0 6px;
      font-size: 11.5px;
      letter-spacing: 0;
    }
    .metric-stack {
      grid-template-columns: 1fr;
    }
    .balance-value {
      font-size: 28px;
    }
    .metric-value {
      font-size: 21px;
    }
    .section-title {
      font-size: 19px;
    }
    .finance-chart-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .finance-chart-value {
      justify-self: start;
    }
    .balance-card {
      min-height: 188px;
      padding: 20px;
      border-radius: 14px;
    }
    .metric-card,
    .project-card,
    .employee-card,
    .general-card,
    .empty-card,
    .error-card {
      border-radius: 14px;
    }
    .project-top {
      grid-template-columns: 38px minmax(0, 1fr);
    }
    .project-top .margin-badge {
      grid-column: 2;
      justify-self: start;
      margin-top: 2px;
    }
    .employee-head,
    .finance-row,
    .expense-item {
      align-items: flex-start;
    }
    .employee-head {
      flex-direction: column;
    }
    .expense-item {
      grid-template-columns: 1fr;
    }
  }
`;

const PERIODES: { value: Periode; label: string }[] = [
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "all", label: "Tout" },
];

const CAT_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  mission: { label: "Mission", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  vehicule: { label: "Véhicule", bg: "bg-bth-gold-50", text: "text-bth-gold-700", border: "border-bth-gold-200" },
  repas: { label: "Repas", bg: "bg-bth-green-50", text: "text-bth-green-700", border: "border-bth-green-200" },
  materiel: { label: "Matériel", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
  communication: { label: "Communication", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100" },
  autre: { label: "Autre", bg: "bg-bth-n-100", text: "text-bth-n-600", border: "border-bth-n-200" },
};

const ICONS = {
  wallet: ["M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z", "M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2", "M18 13h.01"],
  trend: ["M4 18 10 12l4 4 6-9", "M15 7h5v5"],
  receipt: ["M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2z", "M8 8h8", "M8 12h8", "M8 16h5"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10"],
};

function Ic({ d, size = 18 }: { d: string[]; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.map((path, index) => <path key={index} d={path} />)}
    </svg>
  );
}

function catCfg(cat: string) {
  return CAT_CONFIG[cat] ?? { label: cat, bg: "bg-bth-n-100", text: "text-bth-n-600", border: "border-bth-n-200" };
}

function marginTone(pct: number) {
  if (pct >= 70) return { badge: "bg-bth-green-50 text-bth-green-700 border border-bth-green-200", fill: "bg-bth-green-600" };
  if (pct >= 40) return { badge: "bg-bth-gold-50 text-bth-gold-700 border border-bth-gold-200", fill: "bg-bth-gold-500" };
  if (pct >= 0) return { badge: "bg-orange-50 text-orange-700 border border-orange-200", fill: "bg-orange-500" };
  return { badge: "bg-red-50 text-red-700 border border-red-200", fill: "bg-red-500" };
}

function signedMoney(value: number) {
  return `${value < 0 ? "-" : ""}${formatMontant(Math.abs(value))}`;
}

function Skeleton() {
  return (
    <div className="finance-skeleton">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-4">
        <div className="sk h-[216px]" />
        <div className="grid grid-cols-1 gap-4">
          <div className="sk h-[100px]" />
          <div className="sk h-[100px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sk h-[210px]" />
        <div className="sk h-[210px]" />
      </div>
    </div>
  );
}

export default function CoutsMargesDashboard() {
  const [periode, setPeriode] = useState<Periode>("month");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (p: Periode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/depenses/stats?periode=${p}`);
      const json = await res.json() as { error?: string } & Partial<Stats>;
      if (!res.ok || json.error) {
        setError(json.error ?? "Erreur inconnue");
      } else {
        setStats({
          total_revenus: json.total_revenus ?? 0,
          total_depenses: json.total_depenses ?? 0,
          marge_nette: json.marge_nette ?? 0,
          par_projet: json.par_projet ?? [],
          par_employe: json.par_employe ?? [],
          depenses_non_liees: json.depenses_non_liees ?? [],
        });
      }
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(periode);
  }, [fetchStats, periode]);

  const maxEmpTotal = Math.max(1, stats?.par_employe[0]?.total ?? 1);
  const margePos = (stats?.marge_nette ?? 0) >= 0;
  const marginRatio = useMemo(() => {
    if (!stats || stats.total_revenus <= 0) return 0;
    return Math.round((stats.marge_nette / stats.total_revenus) * 100);
  }, [stats]);
  const linkedProjectCount = stats?.par_projet.length ?? 0;
  const generalFeesCount = stats?.depenses_non_liees.reduce((sum, group) => sum + group.items.length, 0) ?? 0;
  const chartMax = Math.max(
    1,
    stats?.total_revenus ?? 0,
    stats?.total_depenses ?? 0,
    Math.abs(stats?.marge_nette ?? 0)
  );
  const chartRows = stats
    ? [
        {
          label: "Revenus",
          value: stats.total_revenus,
          className: "bg-bth-green-800",
        },
        {
          label: "Dépenses",
          value: stats.total_depenses,
          className: "bg-bth-gold-500",
        },
        {
          label: "Marge",
          value: Math.abs(stats.marge_nette),
          className: margePos ? "bg-bth-green-500" : "bg-bth-error",
        },
      ]
    : [];

  return (
    <div className="finance-shell">
      <style>{CSS}</style>
      <div className="finance-inner">
        <header className="finance-header">
          <div>
            <div className="finance-kicker">Finance</div>
            <h1 className="finance-title">Coûts &amp; Marges</h1>
            <p className="finance-subtitle">Lecture consolidée des revenus, dépenses et marges réelles.</p>
          </div>

          <div className="finance-period" aria-label="Filtrer par période">
            {PERIODES.map((p) => {
              const active = periode === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriode(p.value)}
                  aria-pressed={active}
                  style={{ color: active ? "#fff" : undefined }}
                >
                  {active && (
                    <motion.i
                      layoutId="financePeriodBg"
                      className="active-bg"
                      transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    />
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {loading && <Skeleton />}

        {error && !loading && (
          <div className="error-card">{error}</div>
        )}

        {stats && !loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={periode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <section className="summary-grid" aria-label="Résumé financier">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`balance-card ${margePos ? "positive" : "negative"}`}
                >
                  <div>
                    <p className="metric-label">Marge nette</p>
                    <div className={`balance-value ${margePos ? "text-bth-green-700" : "text-bth-error"}`}>
                      {signedMoney(stats.marge_nette)} <small>DA</small>
                    </div>
                    <p className="metric-note">Revenus encaissés moins dépenses déclarées sur la période.</p>

                    <div className="finance-chart" aria-label="Graphique BTH Hub revenus dépenses marge">
                      {chartRows.map((row, index) => (
                        <div key={row.label} className="finance-chart-row">
                          <span className="finance-chart-label">{row.label}</span>
                          <div className="finance-chart-track">
                            <motion.div
                              className={`finance-chart-fill ${row.className}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${row.value <= 0 ? 0 : Math.max(4, Math.round((row.value / chartMax) * 100))}%` }}
                              transition={{ delay: index * 0.08, duration: 0.55, ease: "easeOut" }}
                            />
                          </div>
                          <span className="finance-chart-value">{formatMontant(row.value)} DA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="finance-chips">
                    <span className="finance-chip">
                      <span className="finance-chip-dot text-bth-green-700" />
                      {stats.total_revenus > 0 ? `${marginRatio}% rendement` : "Revenus à 0"}
                    </span>
                    <span className="finance-chip">
                      <span className="finance-chip-dot text-bth-gold-600" />
                      {linkedProjectCount} projet{linkedProjectCount > 1 ? "s" : ""}
                    </span>
                    <span className="finance-chip">
                      <span className="finance-chip-dot text-bth-error" />
                      {generalFeesCount} frais hors projet
                    </span>
                  </div>
                </motion.div>

                <div className="metric-stack">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="metric-card"
                  >
                    <p className="metric-label">Revenus acceptés</p>
                    <div className="metric-value text-bth-green-700">
                      {formatMontant(stats.total_revenus)} <small>DA</small>
                    </div>
                    <p className="metric-note">Soumissions validées</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="metric-card"
                  >
                    <p className="metric-label">Dépenses totales</p>
                    <div className="metric-value text-orange-600">
                      {formatMontant(stats.total_depenses)} <small>DA</small>
                    </div>
                    <p className="metric-note">Toutes catégories confondues</p>
                  </motion.div>
                </div>
              </section>

              <section className="finance-section">
                <div className="section-head">
                  <div>
                    <p className="section-label">Rentabilité</p>
                    <h2 className="section-title">Marge par projet</h2>
                  </div>
                  <span className="section-count">{stats.par_projet.length} projet{stats.par_projet.length > 1 ? "s" : ""}</span>
                </div>

                {stats.par_projet.length === 0 ? (
                  <div className="empty-card">Aucun projet avec des dépenses liées sur cette période.</div>
                ) : (
                  <div className="projects-grid">
                    {stats.par_projet.map((project, index) => {
                      const tone = marginTone(project.marge_pct);
                      const width = Math.max(0, Math.min(100, project.marge_pct));
                      return (
                        <motion.article
                          key={project.soumission_id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="project-card"
                        >
                          <div className="project-top">
                            <div className="finance-icon-box">
                              <Ic d={ICONS.receipt} size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="project-title truncate">{project.titre_projet}</p>
                              <p className="project-client truncate">{project.client_nom}</p>
                            </div>
                            <span className={`margin-badge ${tone.badge}`}>{project.marge_pct}%</span>
                          </div>

                          <div className="finance-rows">
                            <div className="finance-row">
                              <span>Revenu TTC</span>
                              <strong>{formatMontant(project.revenu)} DA</strong>
                            </div>
                            <div className="finance-row">
                              <span>Coûts liés</span>
                              <strong className="text-orange-600">{formatMontant(project.depenses)} DA</strong>
                            </div>
                          </div>

                          <div className="progress-track" aria-hidden="true">
                            <motion.div
                              className={`progress-fill ${tone.fill}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ delay: index * 0.04 + 0.1, duration: 0.55, ease: "easeOut" }}
                            />
                          </div>

                          <div className="finance-row mt-3 pt-3 border-t border-bth-hairline">
                            <span>Marge réelle</span>
                            <strong className={project.marge >= 0 ? "text-bth-green-700" : "text-bth-error"}>
                              {signedMoney(project.marge)} DA
                            </strong>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="finance-section">
                <div className="section-head">
                  <div>
                    <p className="section-label">Équipe</p>
                    <h2 className="section-title">Dépenses par employé</h2>
                  </div>
                  <span className="section-count">{stats.par_employe.length} profil{stats.par_employe.length > 1 ? "s" : ""}</span>
                </div>

                {stats.par_employe.length === 0 ? (
                  <div className="empty-card">Aucune dépense enregistrée sur cette période.</div>
                ) : (
                  <div className="employee-list">
                    {stats.par_employe.map((employee, index) => {
                      const pct = Math.round((employee.total / maxEmpTotal) * 100);
                      return (
                        <motion.article
                          key={employee.employe_id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="employee-card"
                        >
                          <div className="employee-head">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="finance-icon-box">
                                <Ic d={ICONS.user} size={18} />
                              </div>
                              <span className="employee-name truncate">{employee.nom}</span>
                            </div>
                            <span className="employee-total">{formatMontant(employee.total)} DA</span>
                          </div>

                          <div className="progress-track" aria-hidden="true">
                            <motion.div
                              className="progress-fill bg-bth-green-800"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: index * 0.04 + 0.1, duration: 0.55, ease: "easeOut" }}
                            />
                          </div>

                          <div className="category-chips">
                            {Object.entries(employee.par_categorie)
                              .sort(([, a], [, b]) => b - a)
                              .map(([cat, amount]) => {
                                const cfg = catCfg(cat);
                                return (
                                  <span
                                    key={cat}
                                    className={`category-chip border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                  >
                                    {cfg.label} · {formatMontant(amount)}
                                  </span>
                                );
                              })}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="finance-section mb-0">
                <div className="section-head">
                  <div>
                    <p className="section-label">Hors projet</p>
                    <h2 className="section-title">Frais généraux</h2>
                  </div>
                  <span className="section-count">{generalFeesCount} dépense{generalFeesCount > 1 ? "s" : ""}</span>
                </div>

                {stats.depenses_non_liees.length === 0 ? (
                  <div className="empty-card">Aucun frais général sur cette période.</div>
                ) : (
                  <div className="general-grid">
                    {stats.depenses_non_liees.map((group, index) => {
                      const cfg = catCfg(group.categorie);
                      return (
                        <motion.article
                          key={group.categorie}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="general-card"
                        >
                          <div className="general-head">
                            <span className={`category-chip border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                            <strong className="text-bth-n-900 whitespace-nowrap">{formatMontant(group.total)} DA</strong>
                          </div>
                          <div>
                            {group.items.map((item) => (
                              <div key={item.id} className="expense-item">
                                <div className="min-w-0">
                                  <p className="expense-desc">{item.description ?? "Sans description"}</p>
                                  <p className="expense-meta">{item.employe} · {formatDateFr(item.date_depense)}</p>
                                </div>
                                <span className="expense-amount">{formatMontant(item.montant)} DA</span>
                              </div>
                            ))}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </section>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
