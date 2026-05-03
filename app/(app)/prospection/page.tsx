"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";
import PlanningZone from "@/components/prospection/PlanningZone";
import ProspectCard from "@/components/prospection/ProspectCard";

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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("planning");
  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");

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

  // Secteurs uniques pour les filtres
  const secteurs = useMemo(
    () => [...new Set(prospects.map((p) => p.secteur_activite))].sort(),
    [prospects]
  );

  const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  // Libellé humain pour une date passée (date de visite)
  function visiteDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff === 2) return "Avant-hier";
    if (diff < 7)   return `${JOURS[d.getDay()]} ${formatDateFr(dateStr)}`;
    // Au-delà d'une semaine : mois groupés
    const mois = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return mois.charAt(0).toUpperCase() + mois.slice(1);
  }

  // Libellé pour une date future (prochaine action)
  function futureDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Demain";
    if (diff < 7)   return `${JOURS[d.getDay()]} ${formatDateFr(dateStr)}`;
    return formatDateFr(dateStr);
  }

  // Filtre de base
  const baseFiltered = useMemo(() => prospects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.entreprise.toLowerCase().includes(q) ||
      p.nom_contact.toLowerCase().includes(q) ||
      p.secteur_activite.toLowerCase().includes(q);
    return matchSearch && (!filterSecteur || p.secteur_activite === filterSecteur);
  }), [prospects, search, filterSecteur]);

  // Section 1 : "À visiter" — date_prochaine_action >= aujourd'hui, triées asc
  const aVisiter = useMemo(() => {
    return baseFiltered
      .filter((p) => { const d = getDateAction(p); return d && d >= today; })
      .sort((a, b) => getDateAction(a)!.getTime() - getDateAction(b)!.getTime());
  }, [baseFiltered, today]);

  // Groupes "À visiter" par date future
  const aVisiterGroups = useMemo(() => {
    const groups: { label: string; prospects: Prospect[] }[] = [];
    for (const p of aVisiter) {
      const label = futureDateLabel(getLastVisite(p)!.date_prochaine_action!);
      const last  = groups[groups.length - 1];
      if (last && last.label === label) last.prospects.push(p);
      else groups.push({ label, prospects: [p] });
    }
    return groups;
  }, [aVisiter]);

  // Section 2 : historique — groupés par date_visite de la dernière visite, tri desc (plus récent en premier)
  const historique = useMemo(() => {
    const withVisit = baseFiltered
      .filter((p) => (p.visites?.length ?? 0) > 0)
      .sort((a, b) => {
        const da = new Date(getLastVisite(a)!.date_visite).getTime();
        const db = new Date(getLastVisite(b)!.date_visite).getTime();
        return db - da; // plus récent en premier
      });

    const groups: { label: string; prospects: Prospect[] }[] = [];
    for (const p of withVisit) {
      const label = visiteDateLabel(getLastVisite(p)!.date_visite);
      const last  = groups[groups.length - 1];
      if (last && last.label === label) last.prospects.push(p);
      else groups.push({ label, prospects: [p] });
    }
    return groups;
  }, [baseFiltered]);

  // Sans visite du tout
  const sansVisite = useMemo(
    () => baseFiltered.filter((p) => (p.visites?.length ?? 0) === 0),
    [baseFiltered]
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-2xl mx-auto overflow-x-hidden">
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
        /* ── ONGLET PLANNING ── */
        <div className="space-y-7">
          <PlanningZone
            title="Aujourd'hui"
            subtitle="Prospects à contacter ou visiter aujourd'hui."
            color="#2563eb" bgColor="#dbeafe"
            prospects={aujourdHui} urgency="aujourd_hui"
            emptyLabel="Aucune action prévue aujourd'hui — bonne journée !" />
          <PlanningZone
            title="Cette semaine"
            subtitle="Relances planifiées dans les 7 prochains jours."
            color="#6b7280" bgColor="#f3f4f6"
            prospects={cetteSemaine} urgency="semaine"
            emptyLabel="Aucune action prévue cette semaine" />
          <PlanningZone
            title="Non traités"
            subtitle="La date de relance est passée sans action. Ces prospects attendent une réponse — contacte-les dès que possible."
            color="#ef4444" bgColor="#fee2e2"
            prospects={enRetard} urgency="retard"
            emptyLabel="Aucun prospect en attente — tout est à jour ✓"
            alertBanner={
              enRetard.length > 0 ? (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-700 leading-relaxed">
                    <span className="font-semibold">{enRetard.length} prospect{enRetard.length > 1 ? "s" : ""}</span> n'ont pas été relancés à la date prévue.
                    Ouvre chaque fiche pour noter le résultat et planifier la prochaine action.
                  </p>
                </div>
              ) : undefined
            }
          />

          {nonPlanifies.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
                <h2 className="font-semibold text-gray-400 text-sm">Sans relance planifiée</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  {nonPlanifies.length}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3 ml-6">
                Ces prospects n'ont pas de date de prochain contact. Ouvre leur fiche pour planifier une relance.
              </p>
              <div className="space-y-2.5">
                {nonPlanifies.map((p, i) => (
                  <ProspectCard key={p.id} prospect={p} index={i} />
                ))}
              </div>
            </motion.section>
          )}

          {prospects.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-3">Aucun prospect pour l'instant</p>
              <Link href="/prospection/nouveau">
                <span className="text-sm font-medium cursor-pointer" style={{ color: "#1a2e1e" }}>
                  Ajouter votre premier prospect →
                </span>
              </Link>
            </motion.div>
          )}
        </div>
      ) : (
        /* ── ONGLET TOUS LES PROSPECTS ── */
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher par entreprise, contact, secteur…"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtres secteur — chips scrollables */}
          {secteurs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setFilterSecteur("")}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={!filterSecteur
                  ? { backgroundColor: "#1a2e1e", color: "white" }
                  : { backgroundColor: "#f3f4f6", color: "#6b7280" }}
              >
                Tous
              </button>
              {secteurs.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSecteur(s === filterSecteur ? "" : s)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap"
                  style={filterSecteur === s
                    ? { backgroundColor: "#1a2e1e", color: "white" }
                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Résultats */}
          {baseFiltered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {prospects.length === 0 ? "Aucun prospect actif" : "Aucun résultat pour cette recherche"}
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── Section À visiter ── */}
              {aVisiterGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-sm font-bold text-emerald-700">À visiter</h3>
                    <div className="flex-1 h-px bg-emerald-100" />
                    <span className="text-xs text-emerald-600 font-medium">{aVisiter.length}</span>
                  </div>
                  <div className="space-y-4">
                    {aVisiterGroups.map((group) => {
                      const isToday = group.label === "Aujourd'hui";
                      const isTomorrow = group.label === "Demain";
                      return (
                        <div key={group.label}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isToday   ? "bg-blue-100 text-blue-700" :
                              isTomorrow ? "bg-emerald-100 text-emerald-700" :
                                           "bg-gray-100 text-gray-600"
                            }`}>
                              {group.label}
                            </span>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">{group.prospects.length}</span>
                          </div>
                          <div className="space-y-2.5">
                            {group.prospects.map((p, i) => (
                              <ProspectCard key={p.id} prospect={p} index={i}
                                urgency={isToday ? "aujourd_hui" : undefined} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Historique des visites ── */}
              {historique.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-500">Historique des visites</h3>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-4">
                    {historique.map((group) => {
                      const isToday     = group.label === "Aujourd'hui";
                      const isYesterday = group.label === "Hier";
                      return (
                        <div key={group.label}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isToday     ? "bg-blue-100 text-blue-700" :
                              isYesterday ? "bg-gray-200 text-gray-700" :
                                            "bg-gray-100 text-gray-500"
                            }`}>
                              {group.label}
                            </span>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">{group.prospects.length}</span>
                          </div>
                          <div className="space-y-2.5">
                            {group.prospects.map((p, i) => (
                              <ProspectCard key={p.id} prospect={p} index={i} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Jamais visités ── */}
              {sansVisite.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
                    <h3 className="text-sm font-bold text-gray-400">Jamais visités</h3>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">{sansVisite.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {sansVisite.map((p, i) => (
                      <ProspectCard key={p.id} prospect={p} index={i} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
