"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormDataStep1, FormDataStep2, FormDataStep3, EditablePreview } from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";
import type { TitreContact } from "@/types";
import { formatMontant, generateNumeroOffre } from "@/lib/utils";
import EditableSection from "@/components/soumissions/EditableSection";

interface Props {
  step1: FormDataStep1;
  step2: FormDataStep2;
  step3: FormDataStep3;
  aiContent: SoumissionAIContent;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

const ACCENT = "#3C7C95";
const GREEN = "#1a2e1e";

function initEditablePreview(
  step1: FormDataStep1,
  step2: FormDataStep2,
  ai: SoumissionAIContent,
  numeroOffre: string
): EditablePreview {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    titre: step1.titre,
    nom_contact: step1.nom_contact,
    poste_contact: step1.poste,
    entreprise: step1.entreprise,
    adresse: step1.adresse,
    ville: step1.ville,
    numero_offre: numeroOffre,
    date_offre: today,
    titre_projet: step2.titre_projet,
    contexte_paragraphe_1: ai.contexte_paragraphe_1,
    contexte_paragraphe_2: ai.contexte_paragraphe_2,
    objectif_1: ai.objectif_1,
    objectif_2: ai.objectif_2,
    objectif_3: ai.objectif_3,
    objectif_4: ai.objectif_4,
    livrable_1: ai.livrable_1,
    livrable_2: ai.livrable_2,
    livrable_3: ai.livrable_3 ?? "",
    hypothese_specifique: [ai.hypothese_1, ai.hypothese_2, ai.hypothese_3]
      .filter(Boolean)
      .join("\n\n"),
    description_echeancier: ai.description_echeancier,
    inclusions_specifiques: ai.inclusions_specifiques,
    exclusions_specifiques: ai.exclusions_specifiques,
  };
}

export default function StepPreview({
  step1,
  step2,
  step3,
  aiContent,
  saving,
  onBack,
  onSave,
}: Props) {
  const [numeroOffre] = useState(() => generateNumeroOffre());
  const [editablePreview, setEditablePreview] = useState<EditablePreview>(() =>
    initEditablePreview(step1, step2, aiContent, numeroOffre)
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  const total_ht = step3.lignes.reduce(
    (s, l) => s + l.quantite * l.prix_unitaire,
    0
  );
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  function requestEdit(sectionId: string) {
    if (activeSection && activeSection !== sectionId) {
      setPendingSection(sectionId);
    } else {
      setActiveSection(sectionId);
    }
  }

  function handleSave(sectionId: string, updates: Record<string, string>) {
    setEditablePreview((prev) => ({ ...prev, ...updates }));
    setActiveSection(null);
    setSavedSections((prev) => new Set([...prev, sectionId]));
    setTimeout(() => {
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }, 600);
  }

  function handleCancel() {
    setActiveSection(null);
  }

  function confirmSwitch() {
    setActiveSection(pendingSection);
    setPendingSection(null);
  }

  function cancelSwitch() {
    setPendingSection(null);
  }

  async function handleExport(format: "docx" | "pdf") {
    setExporting(format);
    try {
      const today = new Date().toISOString().split("T")[0];
      // Convert editablePreview back to the format expected by export routes
      const contexteData = {
        section_1: [
          editablePreview.contexte_paragraphe_1,
          editablePreview.contexte_paragraphe_2,
        ]
          .filter(Boolean)
          .join("\n"),
        section_1_1: [
          editablePreview.objectif_1,
          editablePreview.objectif_2,
          editablePreview.objectif_3,
          editablePreview.objectif_4,
        ]
          .filter(Boolean)
          .map((o) => `- ${o}`)
          .join("\n"),
      };

      const payload = {
        soumission: {
          id: "preview",
          numero_offre: editablePreview.numero_offre,
          date_offre: today,
          client_id: "",
          titre_projet: editablePreview.titre_projet,
          secteur_activite: step2.secteur_activite,
          description_projet: step2.description_projet,
          type_etude: step2.type_etude,
          delai_jours: step2.delai_jours,
          total_ht,
          tva,
          total_ttc,
          versement_recu: 0,
          statut: "Brouillon" as const,
          contexte_genere: JSON.stringify(aiContent),
          created_at: today,
        },
        client: {
          id: "preview",
          titre: editablePreview.titre as TitreContact,
          nom_contact: editablePreview.nom_contact,
          poste: editablePreview.poste_contact,
          entreprise: editablePreview.entreprise,
          adresse: editablePreview.adresse,
          ville: editablePreview.ville,
          created_at: today,
        },
        lignes: step3.lignes,
        contexteData,
      };

      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offre_${editablePreview.numero_offre}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  const civiliteLong =
    editablePreview.titre === "M."
      ? "Monsieur"
      : editablePreview.titre === "Mme"
      ? "Madame"
      : editablePreview.titre;

  return (
    <div className="p-4 md:p-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prévisualisation</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Cliquez sur{" "}
            <svg
              className="inline w-3.5 h-3.5 text-gray-400 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>{" "}
            pour modifier chaque section
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {exporting === "docx" ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            .docx
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50 hover:opacity-90 min-h-[44px]"
            style={{ backgroundColor: GREEN, borderColor: GREEN }}
          >
            {exporting === "pdf" ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            .pdf
          </button>
        </div>
      </div>

      {/* Editable sections */}
      <div className="space-y-3">

        {/* Destinataire */}
        <EditableSection
          title="Destinataire"
          accentColor={GREEN}
          isEditing={activeSection === "destinataire"}
          showSaved={savedSections.has("destinataire")}
          onEditRequest={() => requestEdit("destinataire")}
          onSave={(u) => handleSave("destinataire", u)}
          onCancel={handleCancel}
          fields={[
            { key: "titre", label: "Civilité", value: editablePreview.titre },
            { key: "nom_contact", label: "Nom et prénom", value: editablePreview.nom_contact },
            { key: "poste_contact", label: "Poste", value: editablePreview.poste_contact },
            { key: "entreprise", label: "Entreprise", value: editablePreview.entreprise },
            { key: "adresse", label: "Adresse", value: editablePreview.adresse },
            { key: "ville", label: "Ville", value: editablePreview.ville },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4">
              <p className="text-sm font-semibold text-gray-900">
                {editablePreview.titre} {editablePreview.nom_contact},{" "}
                {editablePreview.poste_contact}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{editablePreview.entreprise}</p>
              <p className="text-sm text-gray-500">{editablePreview.adresse}</p>
              <p className="text-sm text-gray-500">{editablePreview.ville}</p>
            </div>
          }
        />

        {/* Offre & Objet */}
        <EditableSection
          title="Offre & Objet"
          accentColor={GREEN}
          isEditing={activeSection === "objet"}
          showSaved={savedSections.has("objet")}
          onEditRequest={() => requestEdit("objet")}
          onSave={(u) => handleSave("objet", u)}
          onCancel={handleCancel}
          fields={[
            { key: "numero_offre", label: "Numéro d'offre", value: editablePreview.numero_offre },
            { key: "date_offre", label: "Date", value: editablePreview.date_offre },
            { key: "titre_projet", label: "Titre du projet", value: editablePreview.titre_projet },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">OBJET :</p>
                <p className="text-sm font-semibold" style={{ color: GREEN }}>
                  Offre de services professionnels
                </p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">
                  {editablePreview.titre_projet}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400">Offre N° :</p>
                <p className="font-bold text-sm" style={{ color: GREEN }}>
                  {editablePreview.numero_offre}
                </p>
                <p className="text-xs text-gray-400 mt-1">{editablePreview.date_offre}</p>
              </div>
            </div>
          }
        />

        {/* Intro paragraph (static) */}
        <div className="bg-[#F4F6F7] rounded-xl px-5 py-4">
          <p className="text-sm text-gray-700">
            {civiliteLong} {editablePreview.nom_contact.split(" ")[0]},
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Sarl BTH EXPERT a le plaisir de vous transmettre son offre de
            services professionnels relative au projet{" "}
            {editablePreview.titre_projet.toLowerCase()}.
          </p>
        </div>

        {/* 1. Contexte et objectifs */}
        <EditableSection
          title="1. Contexte et objectifs"
          accentColor={ACCENT}
          isEditing={activeSection === "contexte"}
          showSaved={savedSections.has("contexte")}
          onEditRequest={() => requestEdit("contexte")}
          onSave={(u) => handleSave("contexte", u)}
          onCancel={handleCancel}
          fields={[
            {
              key: "contexte_paragraphe_1",
              label: "Paragraphe 1 — Description factuelle",
              value: editablePreview.contexte_paragraphe_1,
              multiline: true,
            },
            {
              key: "contexte_paragraphe_2",
              label: "Paragraphe 2 — Enjeux réglementaires",
              value: editablePreview.contexte_paragraphe_2,
              multiline: true,
            },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 space-y-3">
              {[editablePreview.contexte_paragraphe_1, editablePreview.contexte_paragraphe_2]
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {p}
                  </p>
                ))}
            </div>
          }
        />

        {/* 1.1 Objectifs */}
        <EditableSection
          title="1.1 Objectifs du projet"
          accentColor={ACCENT}
          isEditing={activeSection === "objectifs"}
          showSaved={savedSections.has("objectifs")}
          onEditRequest={() => requestEdit("objectifs")}
          onSave={(u) => handleSave("objectifs", u)}
          onCancel={handleCancel}
          fields={[
            { key: "objectif_1", label: "Objectif 1", value: editablePreview.objectif_1, multiline: true },
            { key: "objectif_2", label: "Objectif 2", value: editablePreview.objectif_2, multiline: true },
            { key: "objectif_3", label: "Objectif 3", value: editablePreview.objectif_3, multiline: true },
            { key: "objectif_4", label: "Objectif 4", value: editablePreview.objectif_4, multiline: true },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4">
              <p className="text-sm text-gray-500 mb-2">
                Les objectifs du projet et du mandat sont les suivants :
              </p>
              <ol className="space-y-1.5">
                {[
                  editablePreview.objectif_1,
                  editablePreview.objectif_2,
                  editablePreview.objectif_3,
                  editablePreview.objectif_4,
                ]
                  .filter(Boolean)
                  .map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span
                        className="shrink-0 font-semibold mt-0.5 text-xs"
                        style={{ color: ACCENT }}
                      >
                        {i + 1}.
                      </span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
              </ol>
            </div>
          }
        />

        {/* 2. Livrables */}
        <EditableSection
          title="2. Livrables"
          accentColor={ACCENT}
          isEditing={activeSection === "livrables"}
          showSaved={savedSections.has("livrables")}
          onEditRequest={() => requestEdit("livrables")}
          onSave={(u) => handleSave("livrables", u)}
          onCancel={handleCancel}
          fields={[
            { key: "livrable_1", label: "Livrable 1", value: editablePreview.livrable_1, multiline: true },
            { key: "livrable_2", label: "Livrable 2", value: editablePreview.livrable_2, multiline: true },
            { key: "livrable_3", label: "Livrable 3 (optionnel)", value: editablePreview.livrable_3, multiline: true },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4">
              <ol className="space-y-2">
                {[
                  editablePreview.livrable_1,
                  editablePreview.livrable_2,
                  editablePreview.livrable_3,
                ]
                  .filter(Boolean)
                  .map((liv, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span
                        className="shrink-0 font-semibold mt-0.5 text-xs"
                        style={{ color: ACCENT }}
                      >
                        L{i + 1}.
                      </span>
                      <span className="leading-relaxed">{liv}</span>
                    </li>
                  ))}
              </ol>
            </div>
          }
        />

        {/* 3. Hypothèses */}
        <EditableSection
          title="3. Hypothèses de travail"
          accentColor={ACCENT}
          isEditing={activeSection === "hypotheses"}
          showSaved={savedSections.has("hypotheses")}
          onEditRequest={() => requestEdit("hypotheses")}
          onSave={(u) => handleSave("hypotheses", u)}
          onCancel={handleCancel}
          fields={[
            {
              key: "hypothese_specifique",
              label: "Hypothèses (séparées par une ligne vide)",
              value: editablePreview.hypothese_specifique,
              multiline: true,
            },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 space-y-2">
              {editablePreview.hypothese_specifique
                .split("\n\n")
                .filter(Boolean)
                .map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 font-semibold text-xs mt-0.5"
                      style={{ color: ACCENT }}
                    >
                      H{i + 1}.
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{h.trim()}</p>
                  </div>
                ))}
            </div>
          }
        />

        {/* 3.1 Périmètre d'intervention */}
        <EditableSection
          title="3.1 Périmètre d'intervention"
          accentColor={ACCENT}
          isEditing={activeSection === "perimetre"}
          showSaved={savedSections.has("perimetre")}
          onEditRequest={() => requestEdit("perimetre")}
          onSave={(u) => handleSave("perimetre", u)}
          onCancel={handleCancel}
          fields={[
            {
              key: "inclusions_specifiques",
              label: "Inclusions (une par ligne)",
              value: editablePreview.inclusions_specifiques,
              multiline: true,
            },
            {
              key: "exclusions_specifiques",
              label: "Exclusions (une par ligne)",
              value: editablePreview.exclusions_specifiques,
              multiline: true,
            },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700 mb-1.5">
                  Inclus dans l'offre
                </p>
                <ul className="space-y-1">
                  {editablePreview.inclusions_specifiques
                    .split("\n")
                    .filter(Boolean)
                    .map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 shrink-0 mt-0.5 text-xs">✓</span>
                        <span className="leading-relaxed">{item.trim()}</span>
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600 mb-1.5">
                  Non inclus / Exclusions
                </p>
                <ul className="space-y-1">
                  {editablePreview.exclusions_specifiques
                    .split("\n")
                    .filter(Boolean)
                    .map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-red-400 shrink-0 mt-0.5 text-xs">✗</span>
                        <span className="leading-relaxed">{item.trim()}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          }
        />

        {/* 4. Échéancier */}
        <EditableSection
          title="4. Échéancier"
          accentColor={ACCENT}
          isEditing={activeSection === "echeancier"}
          showSaved={savedSections.has("echeancier")}
          onEditRequest={() => requestEdit("echeancier")}
          onSave={(u) => handleSave("echeancier", u)}
          onCancel={handleCancel}
          fields={[
            {
              key: "description_echeancier",
              label: "Description du délai",
              value: editablePreview.description_echeancier,
              multiline: true,
            },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {editablePreview.description_echeancier}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#F4F6F7] rounded-lg px-3 py-1.5">
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600">
                  {step2.delai_jours} jours
                </span>
              </div>
            </div>
          }
        />

        {/* 5. Budget (non-editable) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center pl-5 pr-3 pt-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              5. Budget
            </span>
          </div>
          <div className="pl-5 pr-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F6F7]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-8 rounded-tl-lg">
                      N°
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Désignation
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-12">
                      Q
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 w-36 rounded-tr-lg">
                      Prix (DZD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step3.lignes.map((l) => (
                    <tr key={l.numero} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-center text-gray-500">{l.numero}</td>
                      <td className="px-3 py-2 text-gray-700">{l.designation}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{l.quantite}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatMontant(l.prix_unitaire)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-[#F4F6F7]">
                    <td colSpan={3} className="px-3 py-2 text-right font-medium text-gray-700 text-xs">
                      Total HT
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {formatMontant(total_ht)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td colSpan={3} className="px-3 py-2 text-right text-gray-600 text-xs">
                      TVA 19%
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {formatMontant(tva)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200" style={{ backgroundColor: `${GREEN}0d` }}>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-gray-900 text-sm">
                      Total TTC
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-lg" style={{ color: GREEN }}>
                      {formatMontant(total_ttc)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Signataires (static) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-2">Responsable de l'offre :</p>
            <p className="font-semibold text-sm" style={{ color: GREEN }}>
              Hakim Belghouini
            </p>
            <p className="text-xs text-gray-400">Expert Co-gérant</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Autorisé par :</p>
            <p className="font-semibold text-sm" style={{ color: GREEN }}>
              Amine Lahmer
            </p>
            <p className="text-xs text-gray-400">Expert Gérant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-60 min-h-[44px]"
          style={{ backgroundColor: GREEN }}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sauvegarde…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegarder et terminer
            </>
          )}
        </button>
      </div>

      {/* Confirmation modal — switch section with unsaved changes */}
      <AnimatePresence>
        {pendingSection && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={cancelSwitch}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Modifications non sauvegardées
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Annuler les modifications en cours ?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmSwitch}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                    style={{ backgroundColor: GREEN }}
                  >
                    Oui, continuer
                  </motion.button>
                  <button
                    onClick={cancelSwitch}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer min-h-[44px]"
                  >
                    Rester ici
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
