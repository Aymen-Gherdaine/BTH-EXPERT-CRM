"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardStats, Soumission } from "@/types";
import { formatMontant } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const STATUT_COLORS: Record<string, string> = {
  Brouillon: "bg-gray-100 text-gray-600",
  Envoyée: "bg-blue-100 text-blue-700",
  Acceptée: "bg-green-100 text-green-700",
  Refusée: "bg-red-100 text-red-600",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recents, setRecents] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, soumRes] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/soumissions").then((r) => r.json()),
      ]);
      setStats(statsRes);
      setRecents((soumRes.data ?? []).slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    {
      label: "Soumissions ce mois",
      value: stats?.soumissions_mois ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "#2E7DB2",
    },
    {
      label: "Mandats acceptés (DZD)",
      value: formatMontant(stats?.total_mandats_acceptes ?? 0),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      label: "Taux d'acceptation",
      value: `${stats?.taux_acceptation ?? 0} %`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "#f59e0b",
    },
    {
      label: "CA ce mois (TTC)",
      value: formatMontant(stats?.montant_total_mois ?? 0),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble des activités BTH Expert</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${card.color}18`, color: card.color }}
            >
              {card.icon}
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            {loading ? (
              <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent submissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Soumissions récentes</h2>
          <Link
            href="/soumissions"
            className="text-sm font-medium transition-colors"
            style={{ color: "#2E7DB2" }}
          >
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm">Aucune soumission pour l'instant</p>
            <Link href="/soumissions/nouvelle">
              <span
                className="text-sm font-medium mt-2 inline-block cursor-pointer"
                style={{ color: "#2E7DB2" }}
              >
                Créer votre première soumission →
              </span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recents.map((s) => (
              <Link key={s.id} href={`/soumissions/${s.id}`}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{s.titre_projet}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.numero_offre} · {s.client?.entreprise ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatMontant(s.total_ttc)} DZD
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[s.statut]}`}
                    >
                      {s.statut}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
