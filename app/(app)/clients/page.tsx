"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Client, Soumission, StatutSoumission } from "@/types";
import { formatMontant, formatDateFr } from "@/lib/utils";

const STATUT_STYLES: Record<StatutSoumission, string> = {
  Brouillon: "bg-gray-100 text-gray-600",
  Envoyée: "bg-blue-100 text-blue-700",
  Acceptée: "bg-emerald-100 text-emerald-700",
  Refusée: "bg-red-100 text-red-600",
};

interface ClientWithSoumissions extends Client {
  soumissions?: Soumission[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithSoumissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [soumissionsMap, setSoumissionsMap] = useState<Record<string, Soumission[]>>({});
  const [loadingSoumissions, setLoadingSoumissions] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/clients${params}`);
    const json = await res.json();
    setClients(json.data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleExpand(clientId: string) {
    if (expandedId === clientId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(clientId);

    if (soumissionsMap[clientId]) return;

    setLoadingSoumissions(clientId);
    const res = await fetch(`/api/soumissions?client_id=${clientId}`);
    const json = await res.json();
    setSoumissionsMap((prev) => ({ ...prev, [clientId]: json.data ?? [] }));
    setLoadingSoumissions(null);
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
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

      {/* Search */}
      <div className="relative mb-6 max-w-md">
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par entreprise ou contact…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
        />
      </div>

      {/* Clients list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            {search ? "Aucun client trouvé pour cette recherche" : "Aucun client pour l'instant"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Les clients sont créés automatiquement lors d'une soumission
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {clients.map((client, i) => {
              const isExpanded = expandedId === client.id;
              const clientSoumissions = soumissionsMap[client.id] ?? [];
              const isLoadingS = loadingSoumissions === client.id;

              return (
                <motion.div
                  key={client.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Client row */}
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(client.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: "#1a2e1e" }}
                      >
                        {client.entreprise.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">{client.entreprise}</p>
                        <p className="text-sm text-gray-500">
                          {client.titre} {client.nom_contact}
                          <span className="text-gray-300 mx-2">·</span>
                          {client.poste}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">{client.ville}</p>
                      </div>

                      <motion.svg
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </div>
                  </div>

                  {/* Expanded: soumissions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="px-6 py-4 bg-[#F4F6F7]">
                          {/* Client details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Adresse</p>
                              <p className="text-gray-700">{client.adresse}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Ville</p>
                              <p className="text-gray-700">{client.ville}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Client depuis</p>
                              <p className="text-gray-700">{formatDateFr(client.created_at)}</p>
                            </div>
                          </div>

                          {/* Soumissions */}
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Historique des soumissions
                          </p>

                          {isLoadingS ? (
                            <div className="space-y-2">
                              {[1, 2].map((j) => (
                                <div key={j} className="h-10 bg-white rounded-xl animate-pulse" />
                              ))}
                            </div>
                          ) : clientSoumissions.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Aucune soumission pour ce client</p>
                          ) : (
                            <div className="space-y-2">
                              {clientSoumissions.map((s) => (
                                <Link key={s.id} href={`/soumissions/${s.id}`}>
                                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-all cursor-pointer border border-gray-100 hover:border-[#1a2e1e]/30">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{s.titre_projet}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {s.numero_offre} · {formatDateFr(s.date_offre)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {formatMontant(s.total_ttc)} DZD
                                      </span>
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[s.statut]}`}>
                                        {s.statut}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Stats client */}
                          {clientSoumissions.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-6 text-xs text-gray-500">
                              <span>
                                <strong className="text-gray-900">{clientSoumissions.length}</strong> soumission{clientSoumissions.length > 1 ? "s" : ""}
                              </span>
                              <span>
                                <strong className="text-gray-900">
                                  {clientSoumissions.filter((s) => s.statut === "Acceptée").length}
                                </strong> acceptée{clientSoumissions.filter((s) => s.statut === "Acceptée").length > 1 ? "s" : ""}
                              </span>
                              <span>
                                CA total :{" "}
                                <strong style={{ color: "#1a2e1e" }}>
                                  {formatMontant(
                                    clientSoumissions
                                      .filter((s) => s.statut === "Acceptée")
                                      .reduce((sum, s) => sum + s.total_ttc, 0)
                                  )}{" "}
                                  DZD
                                </strong>
                              </span>
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
        </div>
      )}
    </div>
  );
}
