"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormDataStep3, LigneBudget } from "@/types";
import { formatMontant } from "@/lib/utils";
import { CATALOGUE_TACHES, GROUPES_ETUDE } from "@/constants/catalogue-budget";

const BTH_GREEN = "#1a2e1e";
const CUSTOM_SENTINEL = "__custom__";

type Section = {
  id: string;
  groupe: string;
  lignes: LigneBudget[];
};

interface Props {
  data: FormDataStep3;
  generating?: boolean;
  onBack: () => void;
  onNext: (data: FormDataStep3) => void;
}

function emptyLigne(groupe: string): LigneBudget {
  return { numero: 1, designation: "", quantite: 1, prix_unitaire: 0, ordre: 0, groupe };
}

function sectionsFromLignes(lignes: LigneBudget[]): Section[] {
  const map = new Map<string, LigneBudget[]>();
  for (const l of lignes) {
    const g = l.groupe || "Mission";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(l);
  }
  return Array.from(map.entries()).map(([groupe, sectionLignes]) => ({
    id: crypto.randomUUID(),
    groupe,
    lignes: sectionLignes,
  }));
}

function initCustomSet(sections: Section[]): Set<string> {
  const set = new Set<string>();
  for (const s of sections) {
    const catalogue = CATALOGUE_TACHES[s.groupe] ?? [];
    s.lignes.forEach((l, i) => {
      if (l.designation && !catalogue.includes(l.designation)) {
        set.add(`${s.id}-${i}`);
      }
    });
  }
  return set;
}

function flattenSections(sections: Section[]): LigneBudget[] {
  let counter = 0;
  return sections.flatMap((s, si) =>
    s.lignes.map((l, li) => ({
      ...l,
      groupe: s.groupe,
      numero: ++counter,
      ordre: si * 1000 + li,
    }))
  );
}

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function StepBudget({ data, generating, onBack, onNext }: Props) {
  const [{ sections, customSet }, setAll] = useState(() => {
    const sections: Section[] =
      data.lignes.length > 0
        ? sectionsFromLignes(data.lignes)
        : [
            {
              id: crypto.randomUUID(),
              groupe: "Attestation de classification",
              lignes: [emptyLigne("Attestation de classification")],
            },
          ];
    return { sections, customSet: initCustomSet(sections) };
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newGroupeChoice, setNewGroupeChoice] = useState<string>(GROUPES_ETUDE[0]);
  const [customGroupeText, setCustomGroupeText] = useState("");

  function toggleSection(id: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function lineOffset(sectionIdx: number): number {
    let count = 0;
    for (let i = 0; i < sectionIdx; i++) count += sections[i].lignes.length;
    return count;
  }

  const allLignes = sections.flatMap((s) => s.lignes);
  const total_ht = allLignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  function setSections(fn: (prev: Section[]) => Section[]) {
    setAll((prev) => ({ ...prev, sections: fn(prev.sections) }));
  }

  function setCustomKey(key: string, value: boolean) {
    setAll((prev) => {
      const next = new Set(prev.customSet);
      value ? next.add(key) : next.delete(key);
      return { ...prev, customSet: next };
    });
  }

  function updateLigne(
    sectionId: string,
    lineIdx: number,
    field: keyof LigneBudget,
    value: string | number
  ) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, lignes: s.lignes.map((l, i) => (i === lineIdx ? { ...l, [field]: value } : l)) }
      )
    );
  }

  function addLigneToSection(sectionId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId ? s : { ...s, lignes: [...s.lignes, emptyLigne(s.groupe)] }
      )
    );
  }

  function removeLigne(sectionId: string, lineIdx: number) {
    setAll((prev) => {
      const newSections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const lignes = s.lignes.filter((_, i) => i !== lineIdx);
        return { ...s, lignes: lignes.length ? lignes : [emptyLigne(s.groupe)] };
      });
      const newCustomSet = new Set(prev.customSet);
      newCustomSet.delete(`${sectionId}-${lineIdx}`);
      return { sections: newSections, customSet: newCustomSet };
    });
  }

  function removeSection(sectionId: string) {
    setSections((prev) => {
      const filtered = prev.filter((s) => s.id !== sectionId);
      return filtered.length ? filtered : prev;
    });
  }

  function confirmAddSection() {
    const groupe =
      newGroupeChoice === "Personnalisé"
        ? customGroupeText.trim() || "Personnalisé"
        : newGroupeChoice;
    const id = crypto.randomUUID();
    setSections((prev) => [...prev, { id, groupe, lignes: [emptyLigne(groupe)] }]);
    setAddingSection(false);
    setNewGroupeChoice(GROUPES_ETUDE[0]);
    setCustomGroupeText("");
  }

  function validate(): boolean {
    if (allLignes.length === 0) {
      setErrors("Ajoutez au moins une ligne de budget avant de continuer.");
      return false;
    }
    for (const s of sections) {
      for (const l of s.lignes) {
        if (!l.designation.trim()) {
          setErrors("Toutes les lignes doivent avoir une désignation.");
          return false;
        }
      }
    }
    if (total_ht <= 0) {
      setErrors("Le budget total doit être supérieur à 0.");
      return false;
    }
    setErrors(null);
    return true;
  }

  function handleNext() {
    if (validate()) onNext({ lignes: flattenSections(sections) });
  }

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Budget</h2>
      <p className="text-sm text-gray-500 mb-4 md:mb-6">
        Organisez le devis en tableaux — un par type d'étude. La TVA (19%) est calculée automatiquement.
      </p>

      {errors && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors}
        </div>
      )}

      {/* Sections */}
      <AnimatePresence>
        {sections.map((section, sectionIdx) => {
          const offset = lineOffset(sectionIdx);
          const catalogue = CATALOGUE_TACHES[section.groupe] ?? [];
          const isCollapsed = collapsedSections.has(section.id);

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left min-h-[44px] md:cursor-default md:pointer-events-none"
                  onClick={() => toggleSection(section.id)}
                >
                  <h3 className="text-sm font-semibold" style={{ color: BTH_GREEN }}>
                    {section.groupe}
                  </h3>
                  <svg
                    className={`w-4 h-4 md:hidden shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    style={{ color: BTH_GREEN }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Supprimer ce tableau
                  </button>
                )}
              </div>

              {/* Collapsible body */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {/* Mobile: card layout */}
                    <div className="md:hidden space-y-3 mb-3">
                      <AnimatePresence>
                        {section.lignes.map((ligne, lineIdx) => {
                          const isCustom = customSet.has(`${section.id}-${lineIdx}`);
                          const lineNum = offset + lineIdx + 1;

                          return (
                            <motion.div
                              key={`mobile-${section.id}-${lineIdx}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-sm text-gray-400 font-medium w-5 shrink-0 pt-3">{lineNum}.</span>
                                  <div className="flex-1 min-w-0">
                                    {isCustom ? (
                                      <div>
                                        <textarea
                                          value={ligne.designation}
                                          onChange={(e) =>
                                            updateLigne(section.id, lineIdx, "designation", e.target.value)
                                          }
                                          placeholder="Saisissez la désignation..."
                                          rows={3}
                                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base outline-none focus:border-[#1a2e1e] transition-colors resize-y"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateLigne(section.id, lineIdx, "designation", "");
                                            setCustomKey(`${section.id}-${lineIdx}`, false);
                                          }}
                                          className="mt-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                          ← Retour au catalogue
                                        </button>
                                      </div>
                                    ) : (
                                      <select
                                        value={ligne.designation}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === CUSTOM_SENTINEL) {
                                            updateLigne(section.id, lineIdx, "designation", "");
                                            setCustomKey(`${section.id}-${lineIdx}`, true);
                                          } else {
                                            updateLigne(section.id, lineIdx, "designation", val);
                                            setCustomKey(`${section.id}-${lineIdx}`, false);
                                          }
                                        }}
                                        className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg text-base outline-none focus:border-[#1a2e1e] transition-colors bg-white cursor-pointer"
                                      >
                                        <option value="">— Choisir une tâche —</option>
                                        {catalogue.map((task, i) => (
                                          <option key={i} value={task}>
                                            {task.length > 60 ? task.substring(0, 60) + "…" : task}
                                          </option>
                                        ))}
                                        <option value={CUSTOM_SENTINEL}>Personnalisé...</option>
                                      </select>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeLigne(section.id, lineIdx)}
                                    disabled={section.lignes.length === 1}
                                    className="shrink-0 w-[44px] h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                                <div className="flex gap-2 ml-7">
                                  <div className="w-[80px] shrink-0">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                                      Qté
                                    </label>
                                    <input
                                      type="number"
                                      value={ligne.quantite}
                                      min={1}
                                      onChange={(e) =>
                                        updateLigne(section.id, lineIdx, "quantite", parseInt(e.target.value) || 1)
                                      }
                                      className="w-full px-2 py-2 min-h-[44px] border border-gray-200 rounded-lg text-base text-center outline-none focus:border-[#1a2e1e] transition-colors"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                                      Prix (DZD)
                                    </label>
                                    <input
                                      type="number"
                                      value={ligne.prix_unitaire || ""}
                                      min={0}
                                      step={1000}
                                      placeholder="0"
                                      onChange={(e) =>
                                        updateLigne(section.id, lineIdx, "prix_unitaire", parseFloat(e.target.value) || 0)
                                      }
                                      className="w-full px-2 py-2 min-h-[44px] border border-gray-200 rounded-lg text-base text-right outline-none focus:border-[#1a2e1e] transition-colors"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Desktop: table layout */}
                    <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden mb-3">
                      <div className="grid grid-cols-[40px_1fr_72px_140px_40px] gap-0 bg-[#F4F6F7] px-4 py-2.5">
                        <span className="text-xs font-semibold text-gray-500">N°</span>
                        <span className="text-xs font-semibold text-gray-500">Désignation</span>
                        <span className="text-xs font-semibold text-gray-500 text-center">Qté</span>
                        <span className="text-xs font-semibold text-gray-500 text-right">Prix (DZD)</span>
                        <span />
                      </div>

                      <AnimatePresence>
                        {section.lignes.map((ligne, lineIdx) => {
                          const isCustom = customSet.has(`${section.id}-${lineIdx}`);
                          const lineNum = offset + lineIdx + 1;

                          return (
                            <motion.div
                              key={`${section.id}-${lineIdx}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="grid grid-cols-[40px_1fr_72px_140px_40px] gap-0 items-start px-4 py-2.5 border-t border-gray-100"
                            >
                              <span className="text-sm text-gray-400 font-medium pt-2.5">{lineNum}</span>

                              <div className="mr-3">
                                {isCustom ? (
                                  <div>
                                    <textarea
                                      value={ligne.designation}
                                      onChange={(e) =>
                                        updateLigne(section.id, lineIdx, "designation", e.target.value)
                                      }
                                      placeholder="Saisissez la désignation de la prestation..."
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a2e1e] transition-colors resize-y"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateLigne(section.id, lineIdx, "designation", "");
                                        setCustomKey(`${section.id}-${lineIdx}`, false);
                                      }}
                                      className="mt-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                      ← Retour au catalogue
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={ligne.designation}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === CUSTOM_SENTINEL) {
                                        updateLigne(section.id, lineIdx, "designation", "");
                                        setCustomKey(`${section.id}-${lineIdx}`, true);
                                      } else {
                                        updateLigne(section.id, lineIdx, "designation", val);
                                        setCustomKey(`${section.id}-${lineIdx}`, false);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a2e1e] transition-colors bg-white cursor-pointer"
                                  >
                                    <option value="">— Choisir une tâche —</option>
                                    {catalogue.map((task, i) => (
                                      <option key={i} value={task}>
                                        {task.length > 80 ? task.substring(0, 80) + "…" : task}
                                      </option>
                                    ))}
                                    <option value={CUSTOM_SENTINEL}>Personnalisé...</option>
                                  </select>
                                )}
                              </div>

                              <input
                                type="number"
                                value={ligne.quantite}
                                min={1}
                                onChange={(e) =>
                                  updateLigne(section.id, lineIdx, "quantite", parseInt(e.target.value) || 1)
                                }
                                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-[#1a2e1e] transition-colors mx-1 mt-0.5"
                              />

                              <input
                                type="number"
                                value={ligne.prix_unitaire || ""}
                                min={0}
                                step={1000}
                                placeholder="0"
                                onChange={(e) =>
                                  updateLigne(section.id, lineIdx, "prix_unitaire", parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-[#1a2e1e] transition-colors ml-1 mt-0.5"
                              />

                              <button
                                type="button"
                                onClick={() => removeLigne(section.id, lineIdx)}
                                disabled={section.lignes.length === 1}
                                className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mt-1.5"
                              >
                                <TrashIcon />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Add task button */}
                    <button
                      type="button"
                      onClick={() => addLigneToSection(section.id)}
                      className="flex items-center justify-center gap-1.5 w-full md:w-auto min-h-[44px] md:min-h-0 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border border-dashed border-gray-200 md:border-0 rounded-xl md:rounded-none px-3 py-2 md:ml-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter une tâche
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add section panel */}
      <AnimatePresence mode="wait">
        {addingSection ? (
          <motion.div
            key="add-section-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3">Type d'étude / tableau à ajouter</p>
              <div className="flex flex-col gap-3">
                <select
                  value={newGroupeChoice}
                  onChange={(e) => setNewGroupeChoice(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg text-base md:text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors cursor-pointer"
                >
                  {GROUPES_ETUDE.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {newGroupeChoice === "Personnalisé" && (
                  <input
                    type="text"
                    value={customGroupeText}
                    onChange={(e) => setCustomGroupeText(e.target.value)}
                    placeholder="Nom du tableau personnalisé..."
                    className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg text-base md:text-sm outline-none focus:border-[#1a2e1e] transition-colors"
                    autoFocus
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmAddSection}
                    className="flex-1 sm:flex-none px-4 min-h-[44px] rounded-lg text-sm font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: BTH_GREEN }}
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSection(false); setCustomGroupeText(""); }}
                    className="flex-1 sm:flex-none px-4 min-h-[44px] rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="add-section-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={() => setAddingSection(true)}
            className="flex items-center justify-center gap-2 w-full mb-6 px-4 py-3 min-h-[44px] border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un tableau / type d'étude
          </motion.button>
        )}
      </AnimatePresence>

      {/* Totaux */}
      <div className="bg-[#F4F6F7] rounded-xl p-4 md:p-5 mb-6 md:mb-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium text-gray-900 tnum">{formatMontant(total_ht)} DZD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TVA 19%</span>
            <span className="font-medium text-gray-900 tnum">{formatMontant(tva)} DZD</span>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
            <span className="font-semibold text-gray-900">Total TTC</span>
            <span className="font-bold text-lg tnum" style={{ color: BTH_GREEN }}>
              {formatMontant(total_ttc)} DZD
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-5 min-h-[44px] w-full sm:w-auto rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-6 min-h-[44px] w-full sm:w-auto rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: BTH_GREEN }}
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Génération en cours…
            </>
          ) : (
            <>
              Générer la soumission
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
