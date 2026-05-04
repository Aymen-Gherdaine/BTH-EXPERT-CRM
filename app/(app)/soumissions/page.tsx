"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Soumission, StatutSoumission } from "@/types";
import { formatMontant, formatDateFr } from "@/lib/utils";

const STATUTS: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];

const STATUT_STYLES: Record<StatutSoumission, string> = {
  Brouillon: "bg-gray-100 text-gray-600",
  Envoyée: "bg-blue-100 text-blue-700",
  Acceptée: "bg-emerald-100 text-emerald-700",
  Refusée: "bg-red-100 text-red-600",
};

const STATUT_ICONS: Record<StatutSoumission, React.ReactNode> = {
  Brouillon: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
  Envoyée: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
  Acceptée: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
  Refusée: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
};

const PAGE_SIZE = 10;

export default function SoumissionsPage() {
  const router = useRouter();
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<StatutSoumission | "">("");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "montant">("date");
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingStatutId, setChangingStatutId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const params = new URLSearchParams();
    if (filterStatut) params.set("statut", filterStatut);
    const res = await fetch(`/api/soumissions?${params}`);
    const json = await res.json();
    setSoumissions(json.data ?? []);
    setLoading(false);
  }, [filterStatut]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = soumissions
    .filter((s) => {
      if (!filterSearch) return true;
      const q = filterSearch.toLowerCase();
      return (
        s.titre_projet.toLowerCase().includes(q) ||
        s.client?.entreprise?.toLowerCase().includes(q) ||
        s.client?.nom_contact?.toLowerCase().includes(q) ||
        s.numero_offre.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "montant") return b.total_ttc - a.total_ttc;
      return new Date(b.date_offre).getTime() - new Date(a.date_offre).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette soumission définitivement ?")) return;
    setDeletingId(id);
    await fetch(`/api/soumissions/${id}`, { method: "DELETE" });
    setSoumissions((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
    setActionMenuId(null);
  }

  async function handleStatut(id: string, statut: StatutSoumission) {
    setChangingStatutId(id);
    await fetch(`/api/soumissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setSoumissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, statut } : s))
    );
    setChangingStatutId(null);
    setActionMenuId(null);
  }

  async function handleDuplicate(s: Soumission) {
    setActionMenuId(null);
    router.push(`/soumissions/${s.id}?duplicate=1`);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soumissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {soumissions.length} soumission{soumissions.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/soumissions/nouvelle">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: "#1a2e1e" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle soumission
          </motion.button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Rechercher par client, projet, N° offre…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1a2e1e] bg-white transition-colors"
          />
        </div>

        {/* Statut filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatut("")}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
              filterStatut === ""
                ? "border-[#1a2e1e] bg-[#1a2e1e]/5 text-[#1a2e1e]"
                : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
            }`}
          >
            Tous
          </button>
          {STATUTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(filterStatut === s ? "" : s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                filterStatut === s
                  ? "border-[#1a2e1e] bg-[#1a2e1e]/5 text-[#1a2e1e]"
                  : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "montant")}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer transition-colors"
          >
            <option value="date">Trier par date</option>
            <option value="montant">Trier par montant</option>
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Aucune soumission trouvée</p>
            <Link href="/soumissions/nouvelle">
              <span className="text-sm font-medium mt-2 inline-block cursor-pointer" style={{ color: "#1a2e1e" }}>
                Créer votre première soumission →
              </span>
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_160px_120px_130px_48px] gap-0 px-6 py-3 bg-[#F4F6F7] border-b border-gray-100 rounded-t-2xl">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projet / Client</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Montant TTC</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Statut</span>
              <span />
            </div>

            {/* Rows */}
            <AnimatePresence>
              {paginated.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative grid grid-cols-[1fr_160px_120px_130px_48px] gap-0 items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Projet / Client */}
                  <Link href={`/soumissions/${s.id}`} className="min-w-0 cursor-pointer">
                    <p className="font-medium text-sm text-gray-900 truncate group-hover:text-[#1a2e1e] transition-colors">
                      {s.titre_projet}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.numero_offre} · {s.client?.entreprise ?? "—"}
                    </p>
                  </Link>

                  {/* Date */}
                  <span className="text-sm text-gray-500">
                    {formatDateFr(s.date_offre)}
                  </span>

                  {/* Montant */}
                  <span className="text-sm font-semibold text-gray-900 text-right">
                    {formatMontant(s.total_ttc)}
                    <span className="text-xs font-normal text-gray-400 ml-1">DZD</span>
                  </span>

                  {/* Statut */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUT_STYLES[s.statut]}`}>
                      {STATUT_ICONS[s.statut]}
                      {s.statut}
                    </span>
                  </div>

                  {/* Actions menu */}
                  <div className="relative flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuId(actionMenuId === s.id ? null : s.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {actionMenuId === s.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/soumissions/${s.id}`}>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Voir le détail
                            </div>
                          </Link>

                          <button
                            onClick={() => handleDuplicate(s)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Dupliquer
                          </button>

                          <div className="border-t border-gray-100 my-1" />

                          {/* Changer statut */}
                          <div className="px-4 py-2">
                            <p className="text-xs text-gray-400 font-medium mb-1.5">Changer le statut</p>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUTS.filter((st) => st !== s.statut).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleStatut(s.id, st)}
                                  disabled={changingStatutId === s.id}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${STATUT_STYLES[st]}`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 my-1" />

                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {deletingId === s.id ? "Suppression…" : "Supprimer"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} soumission{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, idx) =>
                      n === "…" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                          style={page === n
                            ? { backgroundColor: "#1a2e1e", color: "white" }
                            : { color: "#374151" }}
                        >
                          {n}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Click outside to close menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
}
