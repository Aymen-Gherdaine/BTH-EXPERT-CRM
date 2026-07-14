"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import type { ResultatVisite } from "@/types";

export interface VisiteFormData {
  date_visite: string;
  resultat: ResultatVisite | "";
  notes_visite: string;
  date_prochaine_action: string;
  action_requise: string;
}

const RESULTATS: { value: ResultatVisite; label: string; color: string; bg: string }[] = [
  { value: "soumission_demandee",    label: "Soumission demandée",      color: "#059669", bg: "#d1fae5" },
  { value: "visite_expert_demandee", label: "Visite d'expert demandée", color: "#7c3aed", bg: "#ede9fe" },
  { value: "rappel_planifie",        label: "Rappel planifié",          color: "#2563eb", bg: "#dbeafe" },
  { value: "absent",                 label: "Absent",                   color: "#d97706", bg: "#fef3c7" },
  { value: "pas_interesse",          label: "Pas intéressé",            color: "#dc2626", bg: "#fee2e2" },
  { value: "autre",                  label: "Autre",                    color: "#6b7280", bg: "#f3f4f6" },
];

interface VisiteFormProps {
  onSubmit: (data: VisiteFormData) => void;
  loading?: boolean;
  submitLabel?: string;
  initialData?: VisiteFormData;
}

const today = new Date().toISOString().split("T")[0];

export default function VisiteForm({ onSubmit, loading, submitLabel = "Enregistrer", initialData }: VisiteFormProps) {
  const [form, setForm] = useState<VisiteFormData>(initialData ?? {
    date_visite: today,
    resultat: "",
    notes_visite: "",
    date_prochaine_action: "",
    action_requise: "",
  });

  // Toujours afficher le suivi sauf si "pas intéressé"
  const needsFollowUp = !!form.resultat && form.resultat !== "pas_interesse";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.resultat) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date visite */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de la visite</label>
        <input
          type="date"
          value={form.date_visite}
          onChange={(e) => setForm((f) => ({ ...f, date_visite: e.target.value }))}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
        />
      </div>

      {/* Résultat — gros boutons touch-friendly */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Résultat de la visite</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {RESULTATS.map((r) => {
            const selected = form.resultat === r.value;
            return (
              <motion.button
                key={r.value}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm((f) => ({ ...f, resultat: r.value }))}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all text-left min-h-[48px]"
                style={{
                  borderColor: selected ? r.color : "#e5e7eb",
                  backgroundColor: selected ? r.bg : "white",
                  color: selected ? r.color : "#374151",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.color }}
                />
                {r.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
        <textarea
          value={form.notes_visite}
          onChange={(e) => setForm((f) => ({ ...f, notes_visite: e.target.value }))}
          rows={3}
          placeholder="Compte-rendu de la visite…"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors resize-none"
        />
      </div>

      {/* Suivi — visible si résultat le requiert */}
      {needsFollowUp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 pt-1"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de prochaine action</label>
            <input
              type="date"
              value={form.date_prochaine_action}
              min={today}
              onChange={(e) => setForm((f) => ({ ...f, date_prochaine_action: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Action requise</label>
            <input
              type="text"
              value={form.action_requise}
              onChange={(e) => setForm((f) => ({ ...f, action_requise: e.target.value }))}
              placeholder="Ex: Préparer devis EIE…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
            />
          </div>
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={!form.resultat || loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 min-h-[48px]"
        style={{ backgroundColor: "#1a2e1e" }}
      >
        {loading ? "Enregistrement…" : submitLabel}
      </motion.button>
    </form>
  );
}
