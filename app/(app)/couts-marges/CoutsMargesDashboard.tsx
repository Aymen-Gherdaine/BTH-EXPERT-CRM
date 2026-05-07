"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMontant } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Config ────────────────────────────────────────────────────────────────────

const PERIODES: { value: Periode; label: string }[] = [
  { value: "month",   label: "Ce mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year",    label: "Année" },
  { value: "all",     label: "Tout" },
];

const CAT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  mission:       { label: "Mission",       bg: "bg-blue-100",    text: "text-blue-700"   },
  vehicule:      { label: "Véhicule",      bg: "bg-amber-100",   text: "text-amber-700"  },
  repas:         { label: "Repas",         bg: "bg-emerald-100", text: "text-emerald-700"},
  materiel:      { label: "Matériel",      bg: "bg-purple-100",  text: "text-purple-700" },
  communication: { label: "Communication", bg: "bg-indigo-100",  text: "text-indigo-700" },
  autre:         { label: "Autre",         bg: "bg-gray-100",    text: "text-gray-500"   },
};

function catCfg(cat: string) {
  return CAT_CONFIG[cat] ?? { label: cat, bg: "bg-gray-100", text: "text-gray-500" };
}

function margeBadge(pct: number) {
  if (pct >= 70) return "bg-emerald-100 text-emerald-700";
  if (pct >= 40) return "bg-amber-100 text-amber-700";
  if (pct >= 0)  return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function CoutsMargesDashboard() {
  const [periode, setPeriode] = useState<Periode>("month");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchStats = useCallback(async (p: Periode) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/depenses/stats?periode=${p}`);
      const json = await res.json() as { error?: string } & Partial<Stats>;
      if (!res.ok || json.error) {
        setError(json.error ?? "Erreur inconnue");
      } else {
        setStats({
          total_revenus:      json.total_revenus      ?? 0,
          total_depenses:     json.total_depenses     ?? 0,
          marge_nette:        json.marge_nette        ?? 0,
          par_projet:         json.par_projet         ?? [],
          par_employe:        json.par_employe        ?? [],
          depenses_non_liees: json.depenses_non_liees ?? [],
        });
      }
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(periode); }, [fetchStats, periode]);

  const maxEmpTotal = Math.max(1, stats?.par_employe[0]?.total ?? 1);
  const margePos    = (stats?.marge_nette ?? 0) >= 0;

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto pb-24 md:pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coûts &amp; Marges</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue financière consolidée</p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          {PERIODES.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className="relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer min-w-[64px]"
              style={{ color: periode === p.value ? "white" : "#6b7280" }}
            >
              {periode === p.value && (
                <motion.span
                  layoutId="periodBg"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: "#1a2e1e" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && <Skeleton />}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {stats && !loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={periode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── SECTION 1 : Vue d'ensemble ───────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Revenus
                </p>
                <p className="text-2xl font-bold text-emerald-600 leading-none">
                  {formatMontant(stats.total_revenus)}
                  <span className="text-sm font-medium ml-1">DA</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Soumissions acceptées</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Dépenses
                </p>
                <p className="text-2xl font-bold text-orange-500 leading-none">
                  {formatMontant(stats.total_depenses)}
                  <span className="text-sm font-medium ml-1">DA</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Toutes catégories</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className={`rounded-2xl border shadow-sm p-5 ${
                  margePos
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Marge nette
                </p>
                <p className={`text-2xl font-bold leading-none ${margePos ? "text-emerald-700" : "text-red-600"}`}>
                  {!margePos && "–"}
                  {formatMontant(Math.abs(stats.marge_nette))}
                  <span className="text-sm font-medium ml-1">DA</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Revenus − dépenses</p>
              </motion.div>
            </div>

            {/* ── SECTION 2 : Marge par projet ────────────────────── */}
            <section className="mb-10">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Marge par projet
              </h2>
              {stats.par_projet.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Aucun projet avec des dépenses liées sur cette période.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.par_projet.map((p, i) => (
                    <motion.div
                      key={p.soumission_id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                            {p.titre_projet}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{p.client_nom}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${margeBadge(p.marge_pct)}`}>
                          {p.marge_pct}%
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Revenu TTC</span>
                          <span className="font-medium text-gray-800">
                            {formatMontant(p.revenu)} DA
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Coûts liés</span>
                          <span className="font-medium text-orange-600">
                            {formatMontant(p.depenses)} DA
                          </span>
                        </div>

                        {/* Margin bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <motion.div
                            className={`h-full rounded-full ${p.marge_pct >= 40 ? "bg-emerald-500" : "bg-red-400"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, p.marge_pct))}%` }}
                            transition={{ delay: i * 0.05 + 0.15, duration: 0.5, ease: "easeOut" }}
                          />
                        </div>

                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-100">
                          <span className="text-gray-700">Marge réelle</span>
                          <span className={p.marge >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {p.marge < 0 && "–"}{formatMontant(Math.abs(p.marge))} DA
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* ── SECTION 3 : Dépenses par employé ────────────────── */}
            <section className="mb-10">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Dépenses par employé
              </h2>
              {stats.par_employe.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Aucune dépense enregistrée sur cette période.
                </p>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {stats.par_employe.map((emp, i) => {
                    const pct = Math.round((emp.total / maxEmpTotal) * 100);
                    return (
                      <motion.div
                        key={emp.employe_id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">{emp.nom}</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {formatMontant(emp.total)} DA
                          </span>
                        </div>

                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: "#1a2e1e" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(emp.par_categorie)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, amt]) => {
                              const cfg = catCfg(cat);
                              return (
                                <span
                                  key={cat}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                                >
                                  {cfg.label} · {formatMontant(amt)}
                                </span>
                              );
                            })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── SECTION 4 : Frais généraux ───────────────────────── */}
            <section className="mb-10">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">Frais généraux</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dépenses non rattachées à un projet
                </p>
              </div>

              {stats.depenses_non_liees.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Aucun frais général sur cette période.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.depenses_non_liees.map((group, i) => {
                    const cfg = catCfg(group.categorie);
                    return (
                      <motion.div
                        key={group.categorie}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-gray-800">
                            {formatMontant(group.total)} DA
                          </span>
                        </div>

                        <div className="divide-y divide-gray-50">
                          {group.items.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between px-5 py-2.5"
                            >
                              <div className="min-w-0 mr-4">
                                <p className="text-xs text-gray-700 truncate">
                                  {item.description ?? "—"}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {item.employe} · {item.date_depense}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-semibold text-gray-800">
                                {formatMontant(item.montant)} DA
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
