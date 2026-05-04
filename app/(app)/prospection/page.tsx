"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";

const PAGE_SIZE = 10;

const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee: "Soumission demandée",
  rappel_planifie:     "Rappel planifié",
  pas_interesse:       "Pas intéressé",
  absent:              "Absent",
  autre:               "Autre",
};

const RESULTAT_STYLES: Record<string, string> = {
  soumission_demandee: "bg-emerald-100 text-emerald-700",
  rappel_planifie:     "bg-blue-100 text-blue-700",
  pas_interesse:       "bg-red-100 text-red-600",
  absent:              "bg-amber-100 text-amber-700",
  autre:               "bg-gray-100 text-gray-500",
};

function getLastVisite(prospect: Prospect): Visite | null {
  if (!prospect.visites || prospect.visites.length === 0) return null;
  return [...prospect.visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

function getDateAction(prospect: Prospect): Date | null {
  const v = getLastVisite(prospect);
  if (!v?.date_prochaine_action) return null;
  const d = new Date(v.date_prochaine_action);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Tab = "planning" | "tous";

export default function ProspectionPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<Tab>("planning");

  // Filtres onglet Tous
  const [search, setSearch]             = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterResultat, setFilterResultat] = useState("");
  const [sortBy, setSortBy]             = useState<"visite" | "action">("visite");
  const [page, setPage]                 = useState(1);
  const [menuId, setMenuId]             = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prospects?statut=actif")
      .then((r) => r.json())
      .then((json) => {
        setProspects(json.data ?? []);
        setLoading(false);
      });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const enRetard     = prospects.filter((p) => { const d = getDateAction(p); return d && d < today; });
  const aujourdHui   = prospects.filter((p) => { const d = getDateAction(p); return d && d.getTime() === today.getTime(); });
  const cetteSemaine = prospects.filter((p) => { const d = getDateAction(p); return d && d >= tomorrow && d <= nextWeek; });
  const nonPlanifies = prospects.filter((p) => !getDateAction(p));
  const totalUrgent  = enRetard.length + aujourdHui.length;

  // Secteurs uniques pour le select
  const secteurs = useMemo(
    () => [...new Set(prospects.map((p) => p.secteur_activite).filter(Boolean))].sort(),
    [prospects]
  );

  // Résultats uniques pour le select
  const resultats = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach((p) => {
      const v = getLastVisite(p);
      if (v?.resultat) set.add(v.resultat);
    });
    return [...set];
  }, [prospects]);

  // ── Filtrage + tri pour le tableau Tous ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prospects
      .filter((p) => {
        const v = getLastVisite(p);
        const matchSearch = !q ||
          p.entreprise.toLowerCase().includes(q) ||
          p.nom_contact.toLowerCase().includes(q) ||
          p.secteur_activite.toLowerCase().includes(q);
        const matchSecteur  = !filterSecteur  || p.secteur_activite === filterSecteur;
        const matchResultat = !filterResultat || v?.resultat === filterResultat;
        return matchSearch && matchSecteur && matchResultat;
      })
      .sort((a, b) => {
        if (sortBy === "action") {
          const da = getDateAction(a)?.getTime() ?? 0;
          const db = getDateAction(b)?.getTime() ?? 0;
          return da - db;
        }
        const da = getLastVisite(a) ? new Date(getLastVisite(a)!.date_visite).getTime() : 0;
        const db = getLastVisite(b) ? new Date(getLastVisite(b)!.date_visite).getTime() : 0;
        return db - da;
      });
  }, [prospects, search, filterSecteur, filterResultat, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  async function handleDeleteProspect(prospectId: string) {
    if (!confirm("Supprimer ce prospect définitivement ?")) return;
    setDeletingId(prospectId);
    setMenuId(null);
    await fetch(`/api/prospects/${prospectId}`, { method: "DELETE" });
    setProspects((prev) => prev.filter((p) => p.id !== prospectId));
    setDeletingId(null);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "…" : `${prospects.length} prospect${prospects.length !== 1 ? "s" : ""} actif${prospects.length !== 1 ? "s" : ""}`}
            {totalUrgent > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {totalUrgent} urgent{totalUrgent > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Link href="/prospection/nouveau">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer flex-shrink-0"
            style={{ backgroundColor: "#1a2e1e" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau
          </motion.div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {([["planning", "Planning"], ["tous", "Tous"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
            style={
              tab === t
                ? { backgroundColor: "white", color: "#1a2e1e", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#6b7280" }
            }
          >
            {label}
            {t === "planning" && totalUrgent > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {totalUrgent}
              </span>
            )}
            {t === "tous" && prospects.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">{prospects.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : tab === "planning" ? (

        /* ── ONGLET PLANNING — TABLEAU ── */
        <div>
          {/* Bannière urgence */}
          {enRetard.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-red-700">
                <span className="font-semibold">{enRetard.length} prospect{enRetard.length > 1 ? "s" : ""} non traité{enRetard.length > 1 ? "s" : ""}</span>
                {" "}— la date de relance est dépassée. Ouvre chaque fiche pour enregistrer l'action.
              </p>
            </motion.div>
          )}

          {prospects.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-3">Aucun prospect pour l'instant</p>
              <Link href="/prospection/nouveau">
                <span className="text-sm font-medium cursor-pointer" style={{ color: "#1a2e1e" }}>
                  Ajouter votre premier prospect →
                </span>
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">

              {/* En-tête tableau */}
              <div className="grid grid-cols-[20px_2fr_1.5fr_140px_1.5fr_1fr_40px] gap-0 px-6 py-3 bg-[#F4F6F7] border-b border-gray-100 rounded-t-2xl">
                <span />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entreprise</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date relance</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Action requise</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernier résultat</span>
                <span />
              </div>

              {/* Sections avec séparateurs */}
              {([
                {
                  key: "today",
                  label: "Aujourd'hui",
                  desc: "À contacter aujourd'hui",
                  dot: "bg-blue-500",
                  labelStyle: "bg-blue-100 text-blue-700",
                  rowBg: "hover:bg-blue-50/30",
                  dateCls: "text-blue-600 font-semibold",
                  items: aujourdHui,
                },
                {
                  key: "semaine",
                  label: "Cette semaine",
                  desc: "Relances dans les 7 prochains jours",
                  dot: "bg-gray-400",
                  labelStyle: "bg-gray-100 text-gray-600",
                  rowBg: "hover:bg-gray-50/60",
                  dateCls: "text-gray-700",
                  items: cetteSemaine,
                },
                {
                  key: "retard",
                  label: "Non traités",
                  desc: "Date de relance dépassée",
                  dot: "bg-red-500",
                  labelStyle: "bg-red-100 text-red-700",
                  rowBg: "hover:bg-red-50/40",
                  dateCls: "text-red-600 font-semibold",
                  items: enRetard,
                },
                {
                  key: "nonplan",
                  label: "Sans relance planifiée",
                  desc: "Aucune prochaine action définie",
                  dot: "bg-gray-300",
                  labelStyle: "bg-gray-100 text-gray-400",
                  rowBg: "hover:bg-gray-50/40",
                  dateCls: "text-gray-400",
                  items: nonPlanifies,
                },
              ]).map((section) => (
                <div key={section.key}>
                  {/* Séparateur section */}
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-gray-50 border-y border-gray-100">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${section.dot}`} />
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${section.labelStyle}`}>
                      {section.label}
                    </span>
                    <span className="text-xs text-gray-400">{section.desc}</span>
                    <div className="flex-1" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${section.labelStyle}`}>
                      {section.items.length}
                    </span>
                  </div>

                  {section.items.length === 0 ? (
                    <div className="px-6 py-4 text-xs text-gray-400 italic">
                      {section.key === "retard" && "Aucun prospect en retard — tout est à jour ✓"}
                      {section.key === "today" && "Aucune action prévue aujourd'hui"}
                      {section.key === "semaine" && "Aucune relance planifiée cette semaine"}
                      {section.key === "nonplan" && "Tous les prospects ont une relance planifiée"}
                    </div>
                  ) : (
                    <AnimatePresence>
                      {section.items.map((p, i) => {
                        const lastV  = getLastVisite(p);
                        const dateAct = getDateAction(p);
                        const resultatStyle = lastV?.resultat ? (RESULTAT_STYLES[lastV.resultat] ?? "bg-gray-100 text-gray-500") : "";
                        return (
                          <motion.div key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}>
                            <Link href={`/prospection/${p.id}`}>
                              <div className={`grid grid-cols-[20px_2fr_1.5fr_140px_1.5fr_1fr_40px] gap-0 items-center px-6 py-3.5 border-b border-gray-50 transition-colors group cursor-pointer ${section.rowBg}`}>

                                {/* Barre couleur urgence */}
                                <div className={`w-1 h-8 rounded-full flex-shrink-0 ${section.dot}`} />

                                {/* Entreprise */}
                                <div className="flex items-center gap-3 min-w-0 pr-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{ backgroundColor: "#1a2e1e" }}>
                                    {p.entreprise.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate group-hover:text-[#1a2e1e] transition-colors">
                                      {p.entreprise}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{p.secteur_activite}</p>
                                  </div>
                                </div>

                                {/* Contact */}
                                <div className="min-w-0 pr-3">
                                  <p className="text-sm text-gray-700 truncate">{p.nom_contact}</p>
                                  {p.poste_contact && <p className="text-xs text-gray-400 truncate">{p.poste_contact}</p>}
                                </div>

                                {/* Date relance */}
                                <div>
                                  {dateAct ? (
                                    <span className={`text-sm ${section.dateCls}`}>
                                      {formatDateFr(lastV!.date_prochaine_action!)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300 italic">—</span>
                                  )}
                                </div>

                                {/* Action requise */}
                                <div className="min-w-0 pr-3">
                                  {lastV?.action_requise ? (
                                    <p className="text-sm text-gray-600 truncate">{lastV.action_requise}</p>
                                  ) : (
                                    <span className="text-xs text-gray-300 italic">—</span>
                                  )}
                                </div>

                                {/* Dernier résultat */}
                                <div>
                                  {lastV?.resultat ? (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resultatStyle}`}>
                                      {RESULTAT_LABELS[lastV.resultat]}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300 italic">Jamais visité</span>
                                  )}
                                </div>

                                {/* Flèche */}
                                <div className="flex justify-center">
                                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#1a2e1e] transition-colors"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>

      ) : (

        /* ── ONGLET TOUS — TABLEAU ── */
        <div className="space-y-4">

          {/* Filtres */}
          <div className="flex flex-wrap gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                placeholder="Rechercher par entreprise, contact, secteur…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
              />
              {search && (
                <button onClick={() => { setSearch(""); resetPage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Secteur */}
            {secteurs.length > 1 && (
              <div className="relative">
                <select
                  value={filterSecteur}
                  onChange={(e) => { setFilterSecteur(e.target.value); resetPage(); }}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer transition-colors"
                >
                  <option value="">Tous les secteurs</option>
                  {secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}

            {/* Résultat dernière visite */}
            {resultats.length > 0 && (
              <div className="relative">
                <select
                  value={filterResultat}
                  onChange={(e) => { setFilterResultat(e.target.value); resetPage(); }}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer transition-colors"
                >
                  <option value="">Tous les résultats</option>
                  {resultats.map((r) => (
                    <option key={r} value={r}>{RESULTAT_LABELS[r] ?? r}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}

            {/* Tri */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as "visite" | "action"); resetPage(); }}
                className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer transition-colors"
              >
                <option value="visite">Trier par dernière visite</option>
                <option value="action">Trier par prochain contact</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {prospects.length === 0 ? "Aucun prospect actif" : "Aucun résultat pour ces filtres"}
                </p>
              </div>
            ) : (
              <>
                {/* En-tête */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_44px] gap-0 px-6 py-3 bg-[#F4F6F7] border-b border-gray-100 rounded-t-2xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entreprise</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Secteur</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernière visite</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prochain contact</span>
                  <span />
                </div>

                {/* Lignes */}
                <AnimatePresence>
                  {paginated.map((p, i) => {
                    const lastV   = getLastVisite(p);
                    const dateAct = getDateAction(p);
                    const nbV     = p.visites?.length ?? 0;

                    const isOverdue = dateAct && dateAct < today;
                    const isToday   = dateAct && dateAct.getTime() === today.getTime();
                    const actionStyle = isOverdue
                      ? "text-red-600 font-semibold"
                      : isToday
                      ? "text-blue-600 font-semibold"
                      : "text-gray-500";

                    const resultatStyle = lastV?.resultat
                      ? (RESULTAT_STYLES[lastV.resultat] ?? "bg-gray-100 text-gray-500")
                      : "";

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="relative"
                      >
                        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_44px] gap-0 items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">

                          {/* Entreprise — cliquable vers fiche */}
                          <Link href={`/prospection/${p.id}`} className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: deletingId === p.id ? "#9ca3af" : "#1a2e1e" }}>
                              {deletingId === p.id
                                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                : p.entreprise.charAt(0).toUpperCase()
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate group-hover:text-[#1a2e1e] transition-colors">
                                {p.entreprise}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{nbV} visite{nbV !== 1 ? "s" : ""}</p>
                            </div>
                          </Link>

                          {/* Secteur */}
                          <Link href={`/prospection/${p.id}`} className="text-sm text-gray-500 truncate pr-2 block">{p.secteur_activite}</Link>

                          {/* Contact */}
                          <Link href={`/prospection/${p.id}`} className="min-w-0 pr-2 block">
                            <p className="text-sm text-gray-700 truncate">{p.nom_contact}</p>
                            {p.poste_contact && <p className="text-xs text-gray-400 truncate">{p.poste_contact}</p>}
                          </Link>

                          {/* Dernière visite */}
                          <Link href={`/prospection/${p.id}`} className="min-w-0 pr-2 block">
                            {lastV ? (
                              <>
                                <p className="text-sm text-gray-700">{formatDateFr(lastV.date_visite)}</p>
                                {lastV.resultat && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${resultatStyle}`}>
                                    {RESULTAT_LABELS[lastV.resultat]}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Jamais visité</span>
                            )}
                          </Link>

                          {/* Prochain contact */}
                          <Link href={`/prospection/${p.id}`} className="block">
                            {dateAct ? (
                              <span className={`text-sm ${actionStyle}`}>{formatDateFr(lastV!.date_prochaine_action!)}</span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                            {lastV?.action_requise && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{lastV.action_requise}</p>
                            )}
                          </Link>

                          {/* Menu ⋮ */}
                          <div className="relative flex justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuId(menuId === p.id ? null : p.id); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                              </svg>
                            </button>

                            <AnimatePresence>
                              {menuId === p.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.12 }}
                                  className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link href={`/prospection/${p.id}`}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Voir la fiche
                                  </Link>
                                  <Link href={`/prospection/${p.id}?edit=1`}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Modifier
                                  </Link>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    onClick={() => handleDeleteProspect(p.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Supprimer
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Click-outside menu */}
              {menuId && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
              )}

              {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} prospect{filtered.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((n) => Math.max(1, n - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >←</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                        .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                          if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                          acc.push(n);
                          return acc;
                        }, [])
                        .map((n, idx) =>
                          n === "…" ? (
                            <span key={`e-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                          ) : (
                            <button key={n} onClick={() => setPage(n as number)}
                              className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                              style={page === n ? { backgroundColor: "#1a2e1e", color: "white" } : { color: "#374151" }}>
                              {n}
                            </button>
                          )
                        )}
                      <button
                        onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >→</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
