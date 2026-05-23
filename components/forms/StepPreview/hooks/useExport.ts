"use client";

import { useState } from "react";
import type { EditablePreview, FormDataStep2 } from "@/types";
import { buildAIContent } from "../utils";

interface UseExportParams {
  editablePreview: EditablePreview;
  soumissionId?: string;
  clientId?: string;
  step2: FormDataStep2;
  total_ht: number;
  tva: number;
  total_ttc: number;
}

export function useExport({
  editablePreview,
  soumissionId,
  clientId,
  step2,
  total_ht,
  tva,
  total_ttc,
}: UseExportParams) {
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  async function handleExport(format: "docx" | "pdf") {
    setExporting(format);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        editablePreview,
        soumission: {
          id: soumissionId ?? "preview",
          numero_offre: editablePreview.numero_offre,
          date_offre: today,
          client_id: clientId ?? "",
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
          contexte_genere: JSON.stringify(buildAIContent(editablePreview)),
          created_at: today,
        },
        lignes: editablePreview.lignes_budget,
      };

      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("export failed");

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

  return { exporting, handleExport };
}
