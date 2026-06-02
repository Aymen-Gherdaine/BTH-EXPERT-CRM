"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LigneBudget } from "@/types";
import { formatMontant } from "@/lib/utils";
import { BTH_GREEN } from "../constants";
import type { Dispatch, RefObject, SetStateAction } from "react";

interface Props {
  activeSection: string | null;
  savedSections: Set<string>;
  draftLignes: LigneBudget[];
  setDraftLignes: Dispatch<SetStateAction<LigneBudget[]>>;
  lignes: LigneBudget[];
  budgetSectionRef: RefObject<HTMLDivElement | null>;
  onEditRequest: () => void;
  onSave: (lignes: LigneBudget[]) => void;
  onCancel: () => void;
}

function groupByGroupe(lignes: LigneBudget[]): Map<string, LigneBudget[]> {
  const map = new Map<string, LigneBudget[]>();
  for (const l of lignes) {
    const g = l.groupe || "Mission";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(l);
  }
  return map;
}

const trashIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const inputStyle = { borderColor: BTH_GREEN };
const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.boxShadow = "0 0 0 3px rgba(26,46,30,0.12)";
};
const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.boxShadow = "none";
};

export function BudgetSection({
  activeSection,
  savedSections,
  draftLignes,
  setDraftLignes,
  lignes,
  budgetSectionRef,
  onEditRequest,
  onSave,
  onCancel,
}: Props) {
  const isEditing = activeSection === "budget";

  const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  const draftTotal_ht = draftLignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const draftTva = draftTotal_ht * 0.19;
  const draftTotal_ttc = draftTotal_ht + draftTva;

  return (
    <div
      ref={budgetSectionRef}
      className={`group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${
        isEditing ? "scroll-mt-20" : ""
      }`}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: BTH_GREEN }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pl-5 pr-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Budget
        </span>
        <AnimatePresence mode="wait">
          {!isEditing && (
            <motion.button
              key="pencil-budget"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              type="button"
              onClick={onEditRequest}
              aria-label="Éditer le budget"
              className="min-w-[44px] min-h-[44px] md:min-w-[28px] md:min-h-[28px] w-11 h-11 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-150"
            >
              <AnimatePresence mode="wait">
                {savedSections.has("budget") ? (
                  <motion.svg
                    key="check-budget"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="pencil-budget-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key="budget-edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pl-5 pr-4 pb-3">
              {(() => {
                const grouped = groupByGroupe(draftLignes);
                return Array.from(grouped.entries()).map(([groupe, groupLignes]) => {
                  const groupIndices = draftLignes.reduce<number[]>((acc, l, i) => {
                    if ((l.groupe || "Mission") === groupe) acc.push(i);
                    return acc;
                  }, []);
                  const cantDeleteLast = groupLignes.length === 1 && grouped.size === 1;

                  return (
                    <div key={groupe} className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2 pt-1"
                        style={{ color: BTH_GREEN }}>
                        {groupe}
                      </p>

                      {/* ── Mobile cards (< sm) ── */}
                      <div className="sm:hidden space-y-2">
                        {groupIndices.map((flatIdx) => {
                          const l = draftLignes[flatIdx];
                          return (
                            <div key={flatIdx} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  Ligne {flatIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftLignes((prev) =>
                                      prev
                                        .filter((_, idx) => idx !== flatIdx)
                                        .map((ligne, idx) => ({ ...ligne, numero: idx + 1, ordre: idx + 1 }))
                                    )
                                  }
                                  disabled={cantDeleteLast}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <input
                                value={l.designation}
                                placeholder="Désignation"
                                onChange={(e) =>
                                  setDraftLignes((prev) =>
                                    prev.map((ligne, idx) =>
                                      idx === flatIdx ? { ...ligne, designation: e.target.value } : ligne
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow mb-2"
                                style={inputStyle}
                                onFocus={focusHandler}
                                onBlur={blurHandler}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Qté</p>
                                  <input
                                    type="number"
                                    value={l.quantite}
                                    min={1}
                                    onChange={(e) =>
                                      setDraftLignes((prev) =>
                                        prev.map((ligne, idx) =>
                                          idx === flatIdx ? { ...ligne, quantite: Math.max(1, Number(e.target.value)) } : ligne
                                        )
                                      )
                                    }
                                    className="w-full px-2.5 py-2.5 rounded-lg text-sm border text-center outline-none transition-shadow"
                                    style={inputStyle}
                                    onFocus={focusHandler}
                                    onBlur={blurHandler}
                                  />
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Prix unitaire</p>
                                  <input
                                    type="number"
                                    value={l.prix_unitaire}
                                    min={0}
                                    onChange={(e) =>
                                      setDraftLignes((prev) =>
                                        prev.map((ligne, idx) =>
                                          idx === flatIdx ? { ...ligne, prix_unitaire: Math.max(0, Number(e.target.value)) } : ligne
                                        )
                                      )
                                    }
                                    className="w-full px-2.5 py-2.5 rounded-lg text-sm border text-right outline-none transition-shadow"
                                    style={inputStyle}
                                    onFocus={focusHandler}
                                    onBlur={blurHandler}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Desktop grid (≥ sm) ── */}
                      <div className="hidden sm:block">
                        <div className="grid grid-cols-[32px_1fr_60px_130px_36px] gap-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 px-1">
                          <span className="text-center">N°</span>
                          <span>Désignation</span>
                          <span className="text-center">Qté</span>
                          <span className="text-right">Prix unitaire</span>
                          <span />
                        </div>
                        <div className="space-y-2">
                          {groupIndices.map((flatIdx) => {
                            const l = draftLignes[flatIdx];
                            return (
                              <div
                                key={flatIdx}
                                className="grid grid-cols-[32px_1fr_60px_130px_36px] gap-2 items-center"
                              >
                                <span className="text-xs text-gray-400 text-center py-2.5 shrink-0">
                                  {flatIdx + 1}
                                </span>
                                <input
                                  value={l.designation}
                                  placeholder="Désignation"
                                  onChange={(e) =>
                                    setDraftLignes((prev) =>
                                      prev.map((ligne, idx) =>
                                        idx === flatIdx ? { ...ligne, designation: e.target.value } : ligne
                                      )
                                    )
                                  }
                                  className="w-full px-2.5 py-2 rounded-lg text-sm border outline-none transition-shadow"
                                  style={inputStyle}
                                  onFocus={focusHandler}
                                  onBlur={blurHandler}
                                />
                                <input
                                  type="number"
                                  value={l.quantite}
                                  min={1}
                                  onChange={(e) =>
                                    setDraftLignes((prev) =>
                                      prev.map((ligne, idx) =>
                                        idx === flatIdx ? { ...ligne, quantite: Math.max(1, Number(e.target.value)) } : ligne
                                      )
                                    )
                                  }
                                  className="w-full px-2 py-2 rounded-lg text-sm border text-center outline-none transition-shadow"
                                  style={inputStyle}
                                  onFocus={focusHandler}
                                  onBlur={blurHandler}
                                />
                                <input
                                  type="number"
                                  value={l.prix_unitaire}
                                  min={0}
                                  onChange={(e) =>
                                    setDraftLignes((prev) =>
                                      prev.map((ligne, idx) =>
                                        idx === flatIdx ? { ...ligne, prix_unitaire: Math.max(0, Number(e.target.value)) } : ligne
                                      )
                                    )
                                  }
                                  className="w-full px-2.5 py-2 rounded-lg text-sm border text-right outline-none transition-shadow"
                                  style={inputStyle}
                                  onFocus={focusHandler}
                                  onBlur={blurHandler}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftLignes((prev) =>
                                      prev
                                        .filter((_, idx) => idx !== flatIdx)
                                        .map((ligne, idx) => ({ ...ligne, numero: idx + 1, ordre: idx + 1 }))
                                    )
                                  }
                                  disabled={cantDeleteLast}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  {trashIcon}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Add ligne */}
              <button
                type="button"
                onClick={() =>
                  setDraftLignes((prev) => [
                    ...prev,
                    {
                      numero: prev.length + 1,
                      designation: "",
                      quantite: 1,
                      prix_unitaire: 0,
                      ordre: prev.length + 1,
                      groupe: prev[prev.length - 1]?.groupe ?? "Mission",
                    },
                  ])
                }
                className="w-full mt-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une ligne
              </button>

              {/* Live totals */}
              <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="font-medium">Total HT</span>
                  <span className="font-medium tnum">{formatMontant(draftTotal_ht)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>TVA 19%</span>
                  <span className="tnum">{formatMontant(draftTva)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5">
                  <span style={{ color: BTH_GREEN }}>Total TTC</span>
                  <span style={{ color: BTH_GREEN }} className="tnum">{formatMontant(draftTotal_ttc)}</span>
                </div>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="pl-5 pr-4 pb-4 flex gap-2">
              <motion.button
                type="button"
                onClick={() => onSave(draftLignes)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                style={{ backgroundColor: BTH_GREEN }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Sauvegarder
              </motion.button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer min-h-[44px]"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="budget-read"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="pl-5 pr-4 pb-4">
              {Array.from(groupByGroupe(lignes).entries()).map(([groupe, groupLignes]) => {
                const sous_total = groupLignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
                return (
                  <div key={groupe} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold mb-1.5" style={{ color: BTH_GREEN }}>
                      {groupe}
                    </p>

                    {/* ── Mobile: stacked rows (< sm) ── */}
                    <div className="sm:hidden divide-y divide-gray-50">
                      {groupLignes.map((l) => (
                        <div key={l.numero} className="flex items-start justify-between gap-3 py-2.5">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="text-[11px] text-gray-400 shrink-0 mt-0.5 tabular-nums w-4 text-right">
                              {l.numero}.
                            </span>
                            <span className="text-sm text-gray-700 leading-snug">{l.designation}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] text-gray-400">×{l.quantite}</p>
                            <p className="text-sm font-medium tnum" style={{ color: BTH_GREEN }}>
                              {formatMontant(l.prix_unitaire)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 pb-0.5 text-xs">
                        <span className="font-semibold text-gray-500">Sous-total</span>
                        <span className="font-semibold tnum text-gray-800">{formatMontant(sous_total)}</span>
                      </div>
                    </div>

                    {/* ── Desktop: table (≥ sm) ── */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F4F6F7]">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-8">N°</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Désignation</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-12">Q</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 w-36">Prix (DZD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupLignes.map((l) => (
                            <tr key={l.numero} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-center text-gray-500">{l.numero}</td>
                              <td className="px-3 py-2 text-gray-700">{l.designation}</td>
                              <td className="px-3 py-2 text-center text-gray-500">{l.quantite}</td>
                              <td className="px-3 py-2 text-right text-gray-700 tnum">
                                {formatMontant(l.prix_unitaire)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-gray-200 bg-[#F4F6F7]">
                            <td colSpan={3} className="px-3 py-2 text-right font-medium text-gray-700 text-xs">
                              Sous-total
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900 tnum">
                              {formatMontant(sous_total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Grand totals */}
              <div className="border-t border-gray-200 pt-3 space-y-1 mt-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total HT</span>
                  <span className="font-medium tnum">{formatMontant(total_ht)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>TVA 19%</span>
                  <span className="tnum">{formatMontant(tva)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5">
                  <span style={{ color: BTH_GREEN }}>Total TTC</span>
                  <span style={{ color: BTH_GREEN }} className="tnum">{formatMontant(total_ttc)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
