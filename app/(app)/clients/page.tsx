"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Client, Soumission, StatutSoumission } from "@/types";
import { formatDateFr } from "@/lib/utils";

const PAGE_SIZE = 10;

interface ClientWithSoumissions extends Client {
  soumissions?: Soumission[];
}

const STATUT_STYLES: Record<StatutSoumission, string> = {
  Brouillon: "bg-gray-100 text-gray-600",
  Envoyée:   "bg-blue-100 text-blue-700",
  Acceptée:  "bg-emerald-100 text-emerald-700",
  Refusée:   "bg-red-100 text-red-600",
};

export default function ClientsPage() {
  const [clients, setClients]     = useState<ClientWithSoumissions[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [soumissionsMap, setSoumissionsMap] = useState<Record<string, Soumission[]>>({});
  const [loadingS, setLoadingS]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const res  = await fetch(`/api/clients${params}`);
    const json = await res.json();
    setClients(json.data ?? []);
    setPage(1);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleExpand(clientId: string) {
    if (expandedId === clientId) { setExpandedId(null); return; }
    setExpandedId(clientId);
    if (soumissionsMap[clientId]) return;
    setLoadingS(clientId);
    const res  = await fetch(`/api/soumissions?client_id=${clientId}`);
    const json = await res.json();
    setSoumissionsMap((prev) => ({ ...prev, [clientId]: json.data ?? [] }));
    setLoadingS(null);
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginated  = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par entreprise ou contact…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {search ? "Aucun client trouvé pour cette recherche" : "Aucun client pour l'instant"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Les clients sont créés automatiquement lors d'une soumission</p>
          </div>
        ) : (
          <>
            {/* En-tête tableau */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_44px] gap-0 px-6 py-3 bg-[#F4F6F7] border-b border-gray-100 rounded-t-2xl">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entreprise</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client depuis</span>
              <span />
            </div>

            {/* Lignes */}
            <AnimatePresence>
              {paginated.map((client, i) => {
                const isExpanded  = expandedId === client.id;
                const clientSoum  = soumissionsMap[client.id] ?? [];
                const isFetching  = loadingS === client.id;

                return (
                  <motion.div key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}>

                    {/* Ligne principale */}
                    <div
                      className="grid grid-cols-[2fr_1.5fr_1fr_1fr_44px] gap-0 items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => toggleExpand(client.id)}
                    >
                      {/* Entreprise */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: "#1a2e1e" }}>
                          {client.entreprise.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-sm text-gray-900 truncate group-hover:text-[#1a2e1e] transition-colors">
                          {client.entreprise}
                        </p>
                      </div>

                      {/* Contact */}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{client.titre} {client.nom_contact}</p>
                        <p className="text-xs text-gray-400 truncate">{client.poste}</p>
                      </div>

                      {/* Ville */}
                      <span className="text-sm text-gray-500 truncate">{client.ville}</span>

                      {/* Date */}
                      <span className="text-sm text-gray-500">{formatDateFr(client.created_at)}</span>

                      {/* Chevron */}
                      <div className="flex justify-center">
                        <motion.svg animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}
                          className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </div>
                    </div>

                    {/* Section dépliée — soumissions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden border-b border-gray-100">
                          <div className="px-6 py-4 bg-[#F4F6F7]">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Soumissions de ce client
                            </p>

                            {isFetching ? (
                              <div className="space-y-2">
                                {[1, 2].map((j) => <div key={j} className="h-10 bg-white rounded-xl animate-pulse" />)}
                              </div>
                            ) : clientSoum.length === 0 ? (
                              <p className="text-xs text-gray-400 italic py-2">Aucune soumission pour ce client</p>
                            ) : (
                              <div className="space-y-2">
                                {clientSoum.map((s) => (
                                  <Link key={s.id} href={`/soumissions/${s.id}`}>
                                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-all border border-gray-100 hover:border-[#1a2e1e]/20 cursor-pointer">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{s.titre_projet}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.numero_offre} · {formatDateFr(s.date_offre)}</p>
                                      </div>
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_STYLES[s.statut]}`}>
                                        {s.statut}
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, clients.length)} sur {clients.length} clients
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
    </div>
  );
}
