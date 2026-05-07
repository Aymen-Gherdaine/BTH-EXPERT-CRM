"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Depense } from "@/types";
import { formatMontant } from "@/lib/utils";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "mission",       label: "Mission",       bg: "bg-blue-100",   text: "text-blue-700"   },
  { value: "vehicule",      label: "Véhicule",      bg: "bg-amber-100",  text: "text-amber-700"  },
  { value: "repas",         label: "Repas",         bg: "bg-emerald-100",text: "text-emerald-700"},
  { value: "materiel",      label: "Matériel",      bg: "bg-purple-100", text: "text-purple-700" },
  { value: "communication", label: "Communication", bg: "bg-indigo-100", text: "text-indigo-700" },
  { value: "autre",         label: "Autre",         bg: "bg-gray-100",   text: "text-gray-500"   },
] as const;

function catLabel(val: string) {
  return CATEGORIES.find((c) => c.value === val)?.label ?? val;
}
function catCls(val: string) {
  const c = CATEGORIES.find((x) => x.value === val);
  return c ? `${c.bg} ${c.text}` : "bg-gray-100 text-gray-500";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DepenseAdmin = Depense & {
  profiles: { full_name: string } | null;
  soumissions: {
    id: string;
    titre_projet: string;
    numero_offre: string;
    total_ht: number;
  } | null;
};

type ProjectMargin = {
  projet_lie: string;
  titre: string;
  numero_offre: string;
  revenue: number;
  depenses: number;
  marge: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function marginColor(pct: number) {
  if (pct >= 70) return "text-emerald-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-500";
}
function marginRingColor(pct: number) {
  if (pct >= 70) return "border-emerald-200 bg-emerald-50";
  if (pct >= 40) return "border-amber-200 bg-amber-50";
  return "border-red-200 bg-red-50";
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const selectCls =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] appearance-none pr-8 cursor-pointer transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDepensesPage() {
  const [depenses, setDepenses] = useState<DepenseAdmin[]>([]);
  const [projectMargins, setProjectMargins] = useState<ProjectMargin[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/depenses").then((r) => r.json()),
      fetch("/api/depenses/stats").then((r) => r.json()),
    ]).then(([depData, statsData]) => {
      setDepenses(depData.data ?? []);
      setProjectMargins(statsData.data?.by_project ?? []);
      setLoading(false);
    });
  }, []);

  // ── Filter options (built from raw data) ───────────────────────────────────
  const employeeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of depenses) {
      if (!seen.has(d.employe_id))
        seen.set(d.employe_id, d.profiles?.full_name ?? `ID:${d.employe_id.slice(0, 6)}`);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [depenses]);

  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const d of depenses) seen.add(d.date_depense.slice(0, 7));
    return Array.from(seen).sort().reverse();
  }, [depenses]);

  // ── Filtered depenses ───────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      depenses.filter((d) => {
        if (filterEmployee && d.employe_id !== filterEmployee) return false;
        if (filterCategory && d.categorie !== filterCategory) return false;
        if (filterMonth && !d.date_depense.startsWith(filterMonth)) return false;
        if (filterProject && d.projet_lie !== filterProject) return false;
        return true;
      }),
    [depenses, filterEmployee, filterCategory, filterMonth, filterProject]
  );

  // ── Aggregations from filtered rows ────────────────────────────────────────
  const total = useMemo(
    () => filtered.reduce((s, d) => s + Number(d.montant), 0),
    [filtered]
  );

  const byEmployee = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    for (const d of filtered) {
      const name = d.profiles?.full_name ?? `ID:${d.employe_id.slice(0, 6)}`;
      if (!map[d.employe_id]) map[d.employe_id] = { name, total: 0 };
      map[d.employe_id].total += Number(d.montant);
    }
    return Object.entries(map)
      .map(([id, v]) => ({ employe_id: id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of filtered) {
      map[d.categorie] = (map[d.categorie] ?? 0) + Number(d.montant);
    }
    return map;
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of filtered) {
      const m = d.date_depense.slice(0, 7);
      map[m] = (map[m] ?? 0) + Number(d.montant);
    }
    return map;
  }, [filtered]);

  // Chart — last 12 months with data
  const chartMonths = useMemo(
    () => Object.keys(byMonth).sort().slice(-12),
    [byMonth]
  );
  const chartMax = useMemo(
    () => Math.max(...chartMonths.map((m) => byMonth[m] ?? 0), 1),
    [chartMonths, byMonth]
  );

  // Project margins filtered by project selection
  const displayedMargins = useMemo(
    () =>
      filterProject
        ? projectMargins.filter((p) => p.projet_lie === filterProject)
        : projectMargins,
    [projectMargins, filterProject]
  );

  const hasFilters = filterEmployee || filterCategory || filterMonth || filterProject;

  // ── Export ──────────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/depenses/export");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-10 bg-white rounded-2xl animate-pulse border border-gray-100" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
        <div className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
        <div className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto pb-24 md:pb-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coûts &amp; Marges</h1>
          <p className="text-sm text-gray-500">Vue consolidée — tous les employés</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-60 flex-shrink-0"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          {exporting ? (
            <Spinner />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">Export Excel</span>
        </motion.button>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Employee */}
          <div className="relative">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className={selectCls}
            >
              <option value="">Tous les employés</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectCls}
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Month */}
          <div className="relative">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={selectCls}
            >
              <option value="">Toutes périodes</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Project */}
          <div className="relative">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={selectCls}
            >
              <option value="">Tous les projets</option>
              {projectMargins.map((p) => (
                <option key={p.projet_lie} value={p.projet_lie}>
                  {p.numero_offre} — {p.titre}
                </option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {filtered.length} dépense{filtered.length !== 1 ? "s" : ""} filtrée{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => {
                    setFilterEmployee("");
                    setFilterCategory("");
                    setFilterMonth("");
                    setFilterProject("");
                  }}
                  className="text-xs text-red-500 hover:text-red-600 cursor-pointer underline underline-offset-2"
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-gray-500">Total dépenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatMontant(total)}{" "}
            <span className="text-sm font-normal text-gray-400">DZD</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{filtered.length} entrée{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500">Employés actifs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{byEmployee.length}</p>
          {byEmployee[0] && (
            <p className="text-xs text-gray-400 mt-1 truncate">1er : {byEmployee[0].name}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500">Catégorie principale</p>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-gray-400 mt-2">—</p>
          ) : (
            <>
              <p className="text-base font-bold text-gray-900 mt-1 capitalize">
                {catLabel(
                  Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0]
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMontant(Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][1])} DZD
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Monthly trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Tendance mensuelle</p>
        </div>
        <div className="p-4">
          {chartMonths.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {chartMonths.map((month, i) => {
                const val = byMonth[month] ?? 0;
                const pct = (val / chartMax) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
                    <div className="relative w-full flex flex-col justify-end h-32">
                      {/* Tooltip */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                        {formatMontant(val)}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                        className="w-full rounded-t-md"
                        style={{ backgroundColor: "#1a2e1e" }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 leading-none">{month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* By employee */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Par employé</p>
        </div>
        {byEmployee.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">Aucune donnée</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {byEmployee.map((emp, i) => {
              const pct = total > 0 ? (emp.total / total) * 100 : 0;
              // Top category for this employee
              const empRows = filtered.filter((d) => d.employe_id === emp.employe_id);
              const catMap: Record<string, number> = {};
              for (const d of empRows) catMap[d.categorie] = (catMap[d.categorie] ?? 0) + Number(d.montant);
              const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0];

              return (
                <motion.li
                  key={emp.employe_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-4 py-3 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                    style={{ backgroundColor: "#1a2e1e" }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{emp.name}</span>
                      <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                        {formatMontant(emp.total)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: "#1a2e1e" }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{pct.toFixed(0)}% du total</span>
                      {topCat && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${catCls(topCat)}`}>
                          {catLabel(topCat)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Par catégorie</p>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt], i) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-gray-100 p-3"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catCls(cat)}`}>
                    {catLabel(cat)}
                  </span>
                  <p className="text-base font-bold text-gray-900 mt-2">{formatMontant(amt)}</p>
                  <p className="text-xs text-gray-400">DZD</p>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Project margins */}
      {displayedMargins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Marges par projet</p>
            <p className="text-xs text-gray-400 mt-0.5">CA HT soumission − dépenses liées = marge réelle</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedMargins.map((p, i) => {
              const margePct = p.revenue > 0 ? (p.marge / p.revenue) * 100 : 0;
              return (
                <motion.div
                  key={p.projet_lie}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-xl border p-4 ${marginRingColor(margePct)}`}
                >
                  {/* Project title */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">{p.numero_offre}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{p.titre}</p>
                    </div>
                    <div className={`text-lg font-bold flex-shrink-0 ${marginColor(margePct)}`}>
                      {margePct.toFixed(0)}%
                    </div>
                  </div>

                  {/* Revenue / Expenses / Margin */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">CA HT</span>
                      <span className="font-medium text-gray-700">{formatMontant(p.revenue)} DZD</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Dépenses liées</span>
                      <span className="font-medium text-red-500">− {formatMontant(p.depenses)} DZD</span>
                    </div>
                    <div className="h-px bg-current opacity-10" />
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">Marge nette</span>
                      <span className={`font-bold ${marginColor(margePct)}`}>
                        {p.marge >= 0 ? "" : "−"}{formatMontant(Math.abs(p.marge))} DZD
                      </span>
                    </div>
                  </div>

                  {/* Margin bar */}
                  <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max(margePct, 0), 100)}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: "easeOut" }}
                      className={`h-full rounded-full ${margePct >= 70 ? "bg-emerald-500" : margePct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {depenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <p className="text-sm text-gray-400">Aucune dépense enregistrée par l&apos;équipe</p>
        </motion.div>
      )}
    </div>
  );
}
