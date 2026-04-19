"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormDataStep3, LigneBudget } from "@/types";
import { formatMontant } from "@/lib/utils";

interface Props {
  data: FormDataStep3;
  onBack: () => void;
  onNext: (data: FormDataStep3) => void;
}

export default function StepBudget({ data, onBack, onNext }: Props) {
  const [lignes, setLignes] = useState<LigneBudget[]>(
    data.lignes.length > 0
      ? data.lignes
      : [{ numero: 1, designation: "", quantite: 1, prix_unitaire: 0, ordre: 0 }]
  );
  const [errors, setErrors] = useState<string | null>(null);

  const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  function addLigne() {
    setLignes((prev) => [
      ...prev,
      {
        numero: prev.length + 1,
        designation: "",
        quantite: 1,
        prix_unitaire: 0,
        ordre: prev.length,
      },
    ]);
  }

  function removeLigne(idx: number) {
    setLignes((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, numero: i + 1, ordre: i }))
    );
  }

  function updateLigne(idx: number, field: keyof LigneBudget, value: string | number) {
    setLignes((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  }

  function validate() {
    if (lignes.some((l) => !l.designation.trim())) {
      setErrors("Toutes les lignes doivent avoir une désignation.");
      return false;
    }
    if (total_ht <= 0) {
      setErrors("Le budget total doit être supérieur à 0.");
      return false;
    }
    setErrors(null);
    return true;
  }

  function handleNext() {
    if (validate()) onNext({ lignes });
  }

  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Budget</h2>
      <p className="text-sm text-gray-500 mb-6">
        Saisissez les lignes du devis. La TVA (19%) est calculée automatiquement.
      </p>

      {errors && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors}
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_80px_140px_40px] gap-0 bg-[#F4F6F7] px-4 py-3">
          <span className="text-xs font-semibold text-gray-500">N°</span>
          <span className="text-xs font-semibold text-gray-500">Désignation</span>
          <span className="text-xs font-semibold text-gray-500 text-center">Qté</span>
          <span className="text-xs font-semibold text-gray-500 text-right">Prix unitaire (DZD)</span>
          <span />
        </div>

        <AnimatePresence>
          {lignes.map((ligne, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[40px_1fr_80px_140px_40px] gap-0 items-center px-4 py-3 border-t border-gray-100"
            >
              <span className="text-sm text-gray-400 font-medium">{ligne.numero}</span>

              <input
                type="text"
                value={ligne.designation}
                onChange={(e) => updateLigne(idx, "designation", e.target.value)}
                placeholder="Désignation de la prestation..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E7DB2] transition-colors mr-3"
              />

              <input
                type="number"
                value={ligne.quantite}
                onChange={(e) =>
                  updateLigne(idx, "quantite", parseInt(e.target.value) || 1)
                }
                min={1}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-[#2E7DB2] transition-colors mx-1"
              />

              <input
                type="number"
                value={ligne.prix_unitaire || ""}
                onChange={(e) =>
                  updateLigne(idx, "prix_unitaire", parseFloat(e.target.value) || 0)
                }
                min={0}
                step={1000}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-[#2E7DB2] transition-colors ml-1"
              />

              <button
                type="button"
                onClick={() => removeLigne(idx)}
                disabled={lignes.length === 1}
                className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add line */}
      <button
        type="button"
        onClick={addLigne}
        className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors cursor-pointer"
        style={{ color: "#2E7DB2" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter une ligne
      </button>

      {/* Totaux */}
      <div className="bg-[#F4F6F7] rounded-xl p-5 mb-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium text-gray-900">{formatMontant(total_ht)} DZD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TVA 19%</span>
            <span className="font-medium text-gray-900">{formatMontant(tva)} DZD</span>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
            <span className="font-semibold text-gray-900">Total TTC</span>
            <span className="font-bold text-lg" style={{ color: "#2E7DB2" }}>
              {formatMontant(total_ttc)} DZD
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#2E7DB2" }}
        >
          Prévisualiser
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
