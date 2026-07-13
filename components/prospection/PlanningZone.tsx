"use client";

import { m as motion } from "framer-motion";
import type { Prospect } from "@/types";
import ProspectCard from "./ProspectCard";

interface PlanningZoneProps {
  title: string;
  subtitle?: string;
  color: string;
  bgColor: string;
  prospects: Prospect[];
  urgency: "retard" | "aujourd_hui" | "semaine";
  emptyLabel: string;
  alertBanner?: React.ReactNode;
}

export default function PlanningZone({
  title,
  subtitle,
  color,
  bgColor,
  prospects,
  urgency,
  emptyLabel,
  alertBanner,
}: PlanningZoneProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Zone header */}
      <div className="flex items-center gap-3 mb-1.5">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: bgColor, color }}
        >
          {prospects.length}
        </span>
      </div>

      {subtitle && (
        <p className="text-xs text-gray-400 ml-6 mb-3 leading-relaxed">{subtitle}</p>
      )}

      {/* Bannière d'alerte optionnelle */}
      {alertBanner && prospects.length > 0 && (
        <div className="mb-3">{alertBanner}</div>
      )}

      {/* Cards */}
      {prospects.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed px-4 py-8 text-center w-full mt-3"
          style={{ borderColor: `${color}40` }}
        >
          <p className="text-sm text-gray-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-2.5 mt-3">
          {prospects.map((p, i) => (
            <ProspectCard key={p.id} prospect={p} index={i} urgency={urgency} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
