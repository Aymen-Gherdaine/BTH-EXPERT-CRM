"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";

// ─────────────────────────── types ───────────────────────────────────────────

type Tab = "planning" | "tous";
type Urgency = "retard" | "aujourd_hui" | "semaine" | "non_planifie";

// ─────────────────────────── constants ───────────────────────────────────────

const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee:    "Demande de soumission",
  rappel_planifie:        "À rappeler",
  visite_expert_demandee: "Visite expert demandée",
  pas_interesse:          "Pas intéressé",
  absent:                 "Absent",
  autre:                  "Autre",
};

const BADGE_STYLES: Record<string, string> = {
  soumission_demandee:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rappel_planifie:        "bg-red-50 text-red-600 border border-red-200",
  visite_expert_demandee: "bg-purple-50 text-purple-700 border border-purple-200",
  pas_interesse:          "bg-gray-100 text-gray-500",
  absent:                 "bg-amber-50 text-amber-700 border border-amber-200",
  autre:                  "bg-gray-100 text-gray-500",
};

// ─────────────────────────── helpers ─────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getLocalToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLastVisite(prospect: Prospect): Visite | null {
  if (!prospect.visites?.length) return null;
  return [...prospect.visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

function getDateAction(prospect: Prospect): Date | null {
  const v = getLastVisite(prospect);
  if (!v?.date_prochaine_action) return null;
  return parseLocalDate(v.date_prochaine_action);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getDateGroupKey(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const today = getLocalToday();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date.getTime() === today.getTime()) return "__today";
  if (date.getTime() === yesterday.getTime()) return "__yesterday";
  if (date < today && date >= weekAgo) return "__week";
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function groupKeyToLabel(key: string): string {
  if (key === "__today") return "Aujourd'hui";
  if (key === "__yesterday") return "Hier";
  if (key === "__week") return "Cette semaine";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function groupKeyToDisplayDate(key: string, sampleDateStr: string): string {
  if (key !== "__today" && key !== "__yesterday") return "";
  const d = parseLocalDate(sampleDateStr);
  return d
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

function prospectRef(index: number): string {
  return `#PR-${String(index + 1).padStart(3, "0")}`;
}

async function exportProspects() {
  const res = await fetch("/api/prospects/export");
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospects_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────── sub-components ──────────────────────────────────

function ActionIcon({ resultat }: { resultat: string }) {
  if (resultat === "soumission_demandee")
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  if (resultat === "rappel_planifie")
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    );
  if (resultat === "visite_expert_demandee")
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  if (resultat === "absent")
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HistoryCard({
  visite,
  prospect,
  refCode,
  index,
}: {
  visite: Visite;
  prospect: Prospect;
  refCode: string;
  index: number;
}) {
  const badgeStyle = BADGE_STYLES[visite.resultat] ?? "bg-gray-100 text-gray-500";
  const label = RESULTAT_LABELS[visite.resultat] ?? visite.resultat;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.22, ease: "easeOut" }}
    >
      <Link href={`/prospection/${prospect.id}`}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all px-4 py-3.5 group cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5 group-hover:bg-gray-200 transition-colors">
              <ActionIcon resultat={visite.resultat} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 group-hover:text-[#1a2e1e] transition-colors">
                      {prospect.entreprise}
                    </span>
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">{refCode}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{prospect.secteur_activite}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeStyle}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums hidden sm:block">
                    {formatTime(visite.created_at)}
                  </span>
                </div>
              </div>
              {visite.notes_visite && (
                <p className="mt-2 text-sm text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-3">
                  &ldquo;{visite.notes_visite}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PlanningCard({
  prospect,
  refCode,
  urgency,
  index,
}: {
  prospect: Prospect;
  refCode: string;
  urgency: Urgency;
  index: number;
}) {
  const lastVisite = getLastVisite(prospect);
  const resultat = lastVisite?.resultat ?? "autre";
  const badgeStyle = BADGE_STYLES[resultat] ?? "bg-gray-100 text-gray-500";
  const label = RESULTAT_LABELS[resultat] ?? resultat;

  const timeEl =
    urgency === "retard" ? (
      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
        ASAP
      </span>
    ) : urgency === "aujourd_hui" ? (
      <span className="text-xs text-blue-600 font-semibold tabular-nums hidden sm:block">
        {lastVisite ? formatTime(lastVisite.created_at) : "—"}
      </span>
    ) : lastVisite?.date_prochaine_action ? (
      <span className="text-xs text-gray-400 hidden sm:block">
        {parseLocalDate(lastVisite.date_prochaine_action).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}
      </span>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.22, ease: "easeOut" }}
    >
      <Link href={`/prospection/${prospect.id}`}>
        <div
          className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all px-4 py-3.5 group cursor-pointer ${
            urgency === "retard"
              ? "border-red-100 hover:border-red-200"
              : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                urgency === "retard"
                  ? "bg-red-50 text-red-400 group-hover:bg-red-100"
                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
              }`}
            >
              <ActionIcon resultat={resultat} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 group-hover:text-[#1a2e1e] transition-colors">
                      {prospect.entreprise}
                    </span>
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">{refCode}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{prospect.secteur_activite}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeStyle}`}>
                    {label}
                  </span>
                  {timeEl}
                </div>
              </div>
              {(lastVisite?.action_requise || lastVisite?.notes_visite) && (
                <p className="mt-2 text-sm text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-3">
                  &ldquo;{lastVisite.action_requise || lastVisite.notes_visite}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DateGroupHeader({ label, displayDate }: { label: string; displayDate: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
        {label}
      </span>
      {displayDate && <span className="text-xs text-gray-400">{displayDate}</span>}
    </div>
  );
}

function PlanningSection({
  title,
  subtitle,
  prospects,
  prospectRefMap,
  urgency,
  emptyText,
}: {
  title: string;
  subtitle: string;
  prospects: Prospect[];
  prospectRefMap: Map<string, number>;
  urgency: Urgency;
  emptyText: string;
}) {
  const dotColor =
    urgency === "retard"
      ? "bg-red-500"
      : urgency === "aujourd_hui"
      ? "bg-blue-500"
      : urgency === "semaine"
      ? "bg-gray-400"
      : "bg-gray-300";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">{subtitle}</span>
        <div className="flex-1" />
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {prospects.length}
        </span>
      </div>
      {prospects.length === 0 ? (
        <p className="text-xs text-gray-400 italic px-1 mb-4">{emptyText}</p>
      ) : (
        <div className="space-y-2 mb-4">
          {prospects.map((p, i) => (
            <PlanningCard
              key={p.id}
              prospect={p}
              refCode={prospectRef(prospectRefMap.get(p.id) ?? 0)}
              urgency={urgency}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── main page ───────────────────────────────────────

export default function ProspectionPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("planning");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterResultat, setFilterResultat] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/prospects?statut=actif")
      .then((r) => r.json())
      .then((json) => {
        setProspects(json.data ?? []);
        setLoading(false);
      });
  }, []);

  // Stable ref numbering (by creation order)
  const prospectRefMap = useMemo(() => {
    const sorted = [...prospects].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const m = new Map<string, number>();
    sorted.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [prospects]);

  // ── Planning tab data ──
  const today = useMemo(getLocalToday, []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);
  const nextWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const { enRetard, aujProspects, cetteSemaine, nonPlanifies } = useMemo(() => {
    const enRetard: Prospect[] = [];
    const aujProspects: Prospect[] = [];
    const cetteSemaine: Prospect[] = [];
    const nonPlanifies: Prospect[] = [];
    prospects.forEach((p) => {
      const d = getDateAction(p);
      if (!d) { nonPlanifies.push(p); return; }
      if (d < today) enRetard.push(p);
      else if (d.getTime() === today.getTime()) aujProspects.push(p);
      else if (d > today && d <= nextWeek) cetteSemaine.push(p);
    });
    return { enRetard, aujProspects, cetteSemaine, nonPlanifies };
  }, [prospects, today, nextWeek]);

  const totalUrgent = enRetard.length + aujProspects.length;

  // ── Tous tab: flatten all visites, sort desc, group by date ──
  const feedEntries = useMemo(() => {
    const entries: { visite: Visite; prospect: Prospect }[] = [];
    prospects.forEach((p) => {
      (p.visites ?? []).forEach((v) => entries.push({ visite: v, prospect: p }));
    });
    return entries.sort(
      (a, b) =>
        parseLocalDate(b.visite.date_visite).getTime() -
          parseLocalDate(a.visite.date_visite).getTime() ||
        new Date(b.visite.created_at).getTime() - new Date(a.visite.created_at).getTime()
    );
  }, [prospects]);

  const filteredFeed = useMemo(() => {
    const q = search.toLowerCase();
    return feedEntries.filter(({ visite, prospect }) => {
      const matchSearch =
        !q ||
        prospect.entreprise.toLowerCase().includes(q) ||
        prospect.nom_contact.toLowerCase().includes(q) ||
        prospect.secteur_activite.toLowerCase().includes(q);
      const matchResultat = !filterResultat || visite.resultat === filterResultat;
      return matchSearch && matchResultat;
    });
  }, [feedEntries, search, filterResultat]);

  const groupedFeed = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      displayDate: string;
      entries: { visite: Visite; prospect: Prospect }[];
    }[] = [];
    const seen = new Set<string>();
    filteredFeed.forEach((entry) => {
      const key = getDateGroupKey(entry.visite.date_visite);
      if (!seen.has(key)) {
        seen.add(key);
        groups.push({
          key,
          label: groupKeyToLabel(key),
          displayDate: groupKeyToDisplayDate(key, entry.visite.date_visite),
          entries: [],
        });
      }
      groups.find((g) => g.key === key)!.entries.push(entry);
    });
    return groups;
  }, [filteredFeed]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;Activité</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suivi chronologique des actions commerciales</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters
                ? "border-[#1a2e1e] bg-[#1a2e1e] text-white"
                : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="hidden sm:inline">Filtres</span>
          </motion.button>
          <Link href="/prospection/nouveau">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: "#1a2e1e" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nouvelle Action</span>
              <span className="sm:hidden">+</span>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* ── FILTERS PANEL ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-wrap gap-3 p-4 bg-white border border-gray-200 rounded-2xl">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Entreprise, contact, secteur…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Resultat filter */}
              <div className="relative">
                <select
                  value={filterResultat}
                  onChange={(e) => setFilterResultat(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer transition-colors"
                >
                  <option value="">Toutes les actions</option>
                  {Object.entries(RESULTAT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Export */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => { setExporting(true); await exportProspects(); setExporting(false); }}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Exporter
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABS ── */}
      <div className="flex gap-2 mb-6">
        {(
          [
            ["planning", "Planning (À faire)"],
            ["tous", "Tous (Historique)"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={
              tab === t
                ? { backgroundColor: "#1a2e1e", color: "white" }
                : { backgroundColor: "#f3f4f6", color: "#374151" }
            }
          >
            {label}
            {t === "planning" && totalUrgent > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {totalUrgent}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[76px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : tab === "tous" ? (
        /* ──────── ONGLET TOUS — FEED CHRONOLOGIQUE ──────── */
        filteredFeed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {prospects.length === 0 ? "Aucune activité pour l'instant" : "Aucun résultat pour ces filtres"}
            </p>
            {prospects.length === 0 && (
              <Link href="/prospection/nouveau">
                <span className="text-sm font-medium cursor-pointer mt-2 inline-block" style={{ color: "#1a2e1e" }}>
                  Ajouter votre premier prospect →
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {groupedFeed.map((group) => (
              <div key={group.key}>
                <DateGroupHeader label={group.label} displayDate={group.displayDate} />
                <div className="space-y-2">
                  {group.entries.map(({ visite, prospect }, i) => (
                    <HistoryCard
                      key={visite.id}
                      visite={visite}
                      prospect={prospect}
                      refCode={prospectRef(prospectRefMap.get(prospect.id) ?? 0)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ──────── ONGLET PLANNING — ACTIONS À FAIRE ──────── */
        prospects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Aucun prospect actif</p>
            <Link href="/prospection/nouveau">
              <span className="text-sm font-medium cursor-pointer mt-2 inline-block" style={{ color: "#1a2e1e" }}>
                Ajouter votre premier prospect →
              </span>
            </Link>
          </div>
        ) : (
          <div>
            {enRetard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5"
              >
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm text-red-700">
                  <span className="font-semibold">
                    {enRetard.length} prospect{enRetard.length > 1 ? "s" : ""} non traité{enRetard.length > 1 ? "s" : ""}
                  </span>{" "}
                  — date de relance dépassée.
                </p>
              </motion.div>
            )}

            <PlanningSection
              title="Non traités (ASAP)"
              subtitle="Date de relance dépassée"
              prospects={enRetard}
              prospectRefMap={prospectRefMap}
              urgency="retard"
              emptyText="Aucun prospect en retard — tout est à jour ✓"
            />

            <PlanningSection
              title="Aujourd'hui"
              subtitle="À contacter aujourd'hui"
              prospects={aujProspects}
              prospectRefMap={prospectRefMap}
              urgency="aujourd_hui"
              emptyText="Aucune action prévue aujourd'hui"
            />

            <PlanningSection
              title="Cette semaine"
              subtitle="Relances dans les 7 prochains jours"
              prospects={cetteSemaine}
              prospectRefMap={prospectRefMap}
              urgency="semaine"
              emptyText="Aucune relance planifiée cette semaine"
            />

            <PlanningSection
              title="Sans relance planifiée"
              subtitle="Aucune prochaine action définie"
              prospects={nonPlanifies}
              prospectRefMap={prospectRefMap}
              urgency="non_planifie"
              emptyText="Tous les prospects ont une relance planifiée ✓"
            />
          </div>
        )
      )}
    </div>
  );
}
