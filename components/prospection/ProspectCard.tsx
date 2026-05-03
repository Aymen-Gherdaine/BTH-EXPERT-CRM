"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Prospect, Visite } from "@/types";
import { formatDateFr } from "@/lib/utils";

const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee: "Soumission demandée",
  rappel_planifie:     "Rappel planifié",
  pas_interesse:       "Pas intéressé",
  absent:              "Absent",
  autre:               "Autre",
};

const RESULTAT_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  soumission_demandee: { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  rappel_planifie:     { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  pas_interesse:       { bg: "bg-red-50",      text: "text-red-600",     dot: "bg-red-500"     },
  absent:              { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  autre:               { bg: "bg-gray-100",    text: "text-gray-500",    dot: "bg-gray-400"    },
};

const URGENCY_BORDER: Record<string, string> = {
  retard:      "border-l-red-400",
  aujourd_hui: "border-l-blue-400",
  semaine:     "border-l-gray-300",
};

const DATE_URGENCY_STYLE: Record<string, string> = {
  retard:      "bg-red-50 text-red-600 font-semibold",
  aujourd_hui: "bg-blue-50 text-blue-700 font-semibold",
  semaine:     "bg-gray-100 text-gray-600",
};

function getLastVisite(prospect: Prospect): Visite | null {
  if (!prospect.visites || prospect.visites.length === 0) return null;
  return [...prospect.visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

interface ProspectCardProps {
  prospect: Prospect;
  index: number;
  urgency?: "retard" | "aujourd_hui" | "semaine";
}


export default function ProspectCard({ prospect, index, urgency }: ProspectCardProps) {
  const lastVisite = getLastVisite(prospect);
  const resultatStyle = lastVisite ? (RESULTAT_STYLES[lastVisite.resultat] ?? RESULTAT_STYLES.autre) : null;
  const borderClass = urgency ? `border-l-4 ${URGENCY_BORDER[urgency]}` : "";
  const dateStyle = urgency ? DATE_URGENCY_STYLE[urgency] : "bg-gray-100 text-gray-600";
  const nbVisites = prospect.visites?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.28, ease: "easeOut" }}
      whileTap={{ scale: 0.985 }}
    >
      <Link href={`/prospection/${prospect.id}`} className="block">
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all ${borderClass}`}>
          <div className="px-4 pt-4 pb-3">
            {/* Ligne 1 : avatar + nom + badge résultat */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: "#1a2e1e" }}
              >
                {prospect.entreprise.charAt(0).toUpperCase()}
              </div>

              {/* Infos principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 leading-tight">{prospect.entreprise}</p>
                  {resultatStyle && (
                    <span className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${resultatStyle.bg} ${resultatStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${resultatStyle.dot}`} />
                      {RESULTAT_LABELS[lastVisite!.resultat]}
                    </span>
                  )}
                </div>
                {/* Secteur — affiché en entier, pas tronqué */}
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{prospect.secteur_activite}</p>
              </div>
            </div>

            {/* Ligne 2 : contact */}
            <div className="mt-2.5 ml-13 flex items-center gap-1.5" style={{ marginLeft: "52px" }}>
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-xs text-gray-500 truncate">
                <span className="font-medium text-gray-700">{prospect.nom_contact}</span>
                {prospect.poste_contact && <span className="text-gray-400"> · {prospect.poste_contact}</span>}
              </p>
            </div>
          </div>

          {/* Footer : date prochaine action + nb visites */}
          {(lastVisite?.date_prochaine_action || nbVisites > 0) && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              {lastVisite?.date_prochaine_action ? (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dateStyle}`}>
                    {formatDateFr(lastVisite.date_prochaine_action)}
                  </span>
                  {lastVisite.action_requise && (
                    <span className="text-xs text-gray-500 truncate max-w-[140px]">
                      · {lastVisite.action_requise}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Aucune relance planifiée</span>
              )}

              <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {nbVisites} visite{nbVisites !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
