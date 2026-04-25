"use client";

import { useState } from "react";
import { FormDataStep1, FormDataStep2, FormDataStep3 } from "@/types";
import { formatMontant, generateNumeroOffre } from "@/lib/utils";

interface Props {
  step1: FormDataStep1;
  step2: FormDataStep2;
  step3: FormDataStep3;
  contexte: { section_1: string; section_1_1: string };
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  "EIE+Dangers": "EIE + Étude de Dangers",
  "Notice+ProduitsDangereux": "Notice d'Impact + Produits Dangereux",
  Audit: "Audit environnemental",
  Autre: "Autre étude réglementaire",
};

export default function StepPreview({
  step1,
  step2,
  step3,
  contexte,
  saving,
  onBack,
  onSave,
}: Props) {
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  const total_ht = step3.lignes.reduce(
    (s, l) => s + l.quantite * l.prix_unitaire,
    0
  );
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  const civiliteLong =
    step1.titre === "M."
      ? "Monsieur"
      : step1.titre === "Mme"
      ? "Madame"
      : step1.titre;

  const objectifs = contexte.section_1_1
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  async function handleExport(format: "docx" | "pdf") {
    setExporting(format);
    try {
      const numeroOffre = generateNumeroOffre();
      const today = new Date().toISOString().split("T")[0];

      const payload = {
        soumission: {
          id: "preview",
          numero_offre: numeroOffre,
          date_offre: today,
          client_id: "",
          titre_projet: step2.titre_projet,
          secteur_activite: step2.secteur_activite,
          description_projet: step2.description_projet,
          type_etude: step2.type_etude,
          delai_jours: step2.delai_jours,
          total_ht,
          tva,
          total_ttc,
          statut: "Brouillon" as const,
          contexte_genere: JSON.stringify(contexte),
          created_at: today,
        },
        client: {
          id: "preview",
          ...step1,
          created_at: today,
        },
        lignes: step3.lignes,
        contexteData: contexte,
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
      a.download = `Offre_${numeroOffre}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prévisualisation</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vérifiez votre document avant export</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border text-white transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: "#1a2e1e", borderColor: "#1a2e1e" }}
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

      {/* Document preview */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white divide-y divide-gray-100">
        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-[#F4F6F7]">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {step1.titre} {step1.nom_contact}, {step1.poste}
            </p>
            <p className="text-sm text-gray-600">{step1.entreprise}</p>
            <p className="text-sm text-gray-500">{step1.adresse}</p>
            <p className="text-sm text-gray-500">{step1.ville}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Offre No :</p>
            <p className="font-bold text-sm" style={{ color: "#1a2e1e" }}>
              {generateNumeroOffre()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Subject */}
        <div className="p-6">
          <p className="font-bold text-sm text-gray-700 mb-1">OBJET :</p>
          <p className="font-semibold text-sm mb-1" style={{ color: "#1a2e1e" }}>
            Offre de services professionnels
          </p>
          <p className="font-semibold text-sm" style={{ color: "#1a2e1e" }}>
            {step2.titre_projet}
          </p>
        </div>

        {/* Intro */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            {civiliteLong} {step1.nom_contact.split(" ")[0]},
          </p>
          <p className="text-sm text-gray-700">
            Sarl BTH EXPERT a le plaisir de vous transmettre son offre de services professionnels
            relative au projet {step2.titre_projet.toLowerCase()}.
          </p>
        </div>

        {/* Section 1 */}
        <div className="p-6">
          <h3 className="font-bold text-base mb-3" style={{ color: "#1a2e1e" }}>
            1. Contexte et objectifs
          </h3>
          {contexte.section_1.split("\n").filter(p => p.trim()).map((p, i) => (
            <p key={i} className="text-sm text-gray-700 mb-3 leading-relaxed">{p.trim()}</p>
          ))}

          <h4 className="font-semibold text-sm mb-2 mt-4" style={{ color: "#1a2e1e" }}>
            1.1 Objectifs du projet
          </h4>
          <p className="text-sm text-gray-700 mb-2">Les objectifs du projet et du mandat sont les suivants :</p>
          <ul className="space-y-1.5">
            {objectifs.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5">▪</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Budget summary */}
        <div className="p-6">
          <h3 className="font-bold text-base mb-3" style={{ color: "#1a2e1e" }}>
            4. Budget
          </h3>
          <div className="overflow-x-auto">
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
                {step3.lignes.map((l) => (
                  <tr key={l.numero} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-center text-gray-500">{l.numero}</td>
                    <td className="px-3 py-2 text-gray-700">{l.designation}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{l.quantite}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatMontant(l.prix_unitaire)}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-[#F4F6F7]">
                  <td colSpan={3} className="px-3 py-2 text-right font-medium text-gray-700 text-xs">Total HT</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{formatMontant(total_ht)}</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td colSpan={3} className="px-3 py-2 text-right text-gray-600 text-xs">TVA 19%</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMontant(tva)}</td>
                </tr>
                <tr className="border-t border-gray-200 bg-[#1a2e1e]/5">
                  <td colSpan={3} className="px-3 py-2 text-right font-bold text-gray-900 text-sm">Total TTC</td>
                  <td className="px-3 py-2 text-right font-bold text-lg" style={{ color: "#1a2e1e" }}>
                    {formatMontant(total_ttc)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="bg-[#F4F6F7] rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">Type d'étude</p>
              <p>{TYPE_LABELS[step2.type_etude]}</p>
            </div>
            <div className="bg-[#F4F6F7] rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">Délai d'exécution</p>
              <p>{step2.delai_jours} jours</p>
            </div>
          </div>
        </div>

        {/* Signataires */}
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-3">Responsable de l'offre :</p>
            <p className="font-semibold text-sm" style={{ color: "#1a2e1e" }}>Hakim Belghouini</p>
            <p className="text-xs text-gray-400">Expert Co-gérant</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-3">Autorisé par :</p>
            <p className="font-semibold text-sm" style={{ color: "#1a2e1e" }}>Amine Lahmer</p>
            <p className="text-xs text-gray-400">Expert Gérant</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
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
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#1a2e1e" }}
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
    </div>
  );
}
