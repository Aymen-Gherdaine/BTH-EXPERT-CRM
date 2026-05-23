"use client";

import { useState, useRef, useEffect } from "react";
import type {
  EditablePreview,
  FormDataStep1,
  FormDataStep2,
  FormDataStep3,
  LigneBudget,
  TitreContact,
} from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";
import { generateNumeroOffre } from "@/lib/utils";
import { SECTION_ENTITY, AI_SECTIONS } from "../constants";
import type { SectionId } from "../constants";
import { buildAIContent, initEditablePreview } from "../utils";

interface UseSectionEditParams {
  step1: FormDataStep1;
  step2: FormDataStep2;
  step3: FormDataStep3;
  aiContent: SoumissionAIContent;
  soumissionId?: string;
  clientId?: string;
  setIsDirty: (dirty: boolean) => void;
}

export function useSectionEdit({
  step1,
  step2,
  step3,
  aiContent,
  soumissionId,
  clientId,
  setIsDirty,
}: UseSectionEditParams) {
  const [numeroOffre] = useState(() => generateNumeroOffre());
  const [editablePreview, setEditablePreview] = useState<EditablePreview>(() =>
    initEditablePreview(step1, step2, aiContent, numeroOffre, step3.lignes)
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());
  const [flashingSections, setFlashingSections] = useState<Set<string>>(new Set());
  const [unsavedSections, setUnsavedSections] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftLignes, setDraftLignes] = useState<LigneBudget[]>([]);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const budgetSectionRef = useRef<HTMLDivElement>(null);

  // Init draft lignes and scroll when budget enters edit mode
  useEffect(() => {
    if (activeSection === "budget") {
      setDraftLignes(editablePreview.lignes_budget.map((l) => ({ ...l })));
      setTimeout(() => {
        budgetSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  function requestEdit(sectionId: string) {
    if (activeSection && activeSection !== sectionId) {
      setPendingSection(sectionId);
    } else {
      setActiveSection(sectionId);
    }
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

  async function autoSave(sectionId: SectionId, newPreview: EditablePreview) {
    const entity = SECTION_ENTITY[sectionId];

    if (entity === "local") return;

    if (entity === "client" && clientId) {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: newPreview.titre,
          nom_contact: newPreview.nom_contact,
          poste: newPreview.poste_contact,
          entreprise: newPreview.entreprise,
          adresse: newPreview.adresse,
          ville: newPreview.ville,
        }),
      });
      if (!res.ok) throw new Error("client patch failed");
    }

    if (entity === "soumission" && soumissionId) {
      const res = await fetch(`/api/soumissions/${soumissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre_projet: newPreview.titre_projet,
          numero_offre: newPreview.numero_offre,
          date_offre: newPreview.date_offre,
        }),
      });
      if (!res.ok) throw new Error("soumission patch failed");
    }

    if (entity === "ai" && soumissionId) {
      const res = await fetch(`/api/soumissions/${soumissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contexte_genere: JSON.stringify(buildAIContent(newPreview)),
        }),
      });
      if (!res.ok) throw new Error("ai patch failed");
    }

    if (entity === "budget" && soumissionId) {
      const ht = newPreview.lignes_budget.reduce(
        (s, l) => s + l.quantite * l.prix_unitaire,
        0
      );
      const tvaAmt = ht * 0.19;
      const [r1, r2] = await Promise.all([
        fetch(`/api/soumissions/${soumissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ total_ht: ht, tva: tvaAmt, total_ttc: ht + tvaAmt }),
        }),
        fetch(`/api/soumissions/${soumissionId}/lignes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lignes: newPreview.lignes_budget }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("budget save failed");
    }
  }

  async function handleSave(sectionId: string, updates: Record<string, string>) {
    const newPreview = { ...editablePreview, ...updates };
    setEditablePreview(newPreview);
    setActiveSection(null);
    setIsDirty(true);
    setUnsavedSections((prev) => new Set([...prev, sectionId]));

    setSavedSections((prev) => new Set([...prev, sectionId]));
    setTimeout(() => {
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }, 600);

    const knownSection = sectionId as SectionId;
    if (SECTION_ENTITY[knownSection] && (soumissionId || clientId)) {
      setSaveError(null);
      try {
        await autoSave(knownSection, newPreview);
        setUnsavedSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      } catch {
        setSaveError("Sauvegarde échouée, vos modifications sont conservées localement");
        setTimeout(() => setSaveError(null), 6000);
      }
    }
  }

  async function handleBudgetSave(lignes: LigneBudget[]) {
    const validLignes = lignes
      .filter((l) => l.designation.trim())
      .map((l, i) => ({ ...l, numero: i + 1, ordre: i + 1 }));

    const newPreview = { ...editablePreview, lignes_budget: validLignes };
    setEditablePreview(newPreview);
    setActiveSection(null);
    setIsDirty(true);
    setUnsavedSections((prev) => new Set([...prev, "budget"]));

    setSavedSections((prev) => new Set([...prev, "budget"]));
    setTimeout(() => {
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete("budget");
        return next;
      });
    }, 600);

    if (soumissionId) {
      setSaveError(null);
      try {
        await autoSave("budget", newPreview);
        setUnsavedSections((prev) => {
          const next = new Set(prev);
          next.delete("budget");
          return next;
        });
      } catch {
        setSaveError("Sauvegarde échouée, vos modifications sont conservées localement");
        setTimeout(() => setSaveError(null), 6000);
      }
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const step1Regen: FormDataStep1 = {
        titre: editablePreview.titre as TitreContact,
        nom_contact: editablePreview.nom_contact,
        poste: editablePreview.poste_contact,
        entreprise: editablePreview.entreprise,
        adresse: editablePreview.adresse,
        ville: editablePreview.ville,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step1: step1Regen, step2 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const newAI: SoumissionAIContent = json.data;

      setEditablePreview((prev) => ({
        ...prev,
        contexte_paragraphe_1: newAI.contexte_paragraphe_1,
        contexte_paragraphe_2: newAI.contexte_paragraphe_2,
        objectif_1: newAI.objectif_1,
        objectif_2: newAI.objectif_2,
        objectif_3: newAI.objectif_3,
        objectif_4: newAI.objectif_4,
        livrable_1: newAI.livrable_1,
        livrable_2: newAI.livrable_2,
        livrable_3: newAI.livrable_3 ?? "",
        hypothese_specifique: [newAI.hypothese_1, newAI.hypothese_2, newAI.hypothese_3]
          .filter(Boolean)
          .join("\n\n"),
        description_echeancier: newAI.description_echeancier,
        inclusions_specifiques: newAI.inclusions_specifiques,
        exclusions_specifiques: newAI.exclusions_specifiques,
      }));
      setIsDirty(true);

      setFlashingSections(new Set(AI_SECTIONS));
      setTimeout(() => setFlashingSections(new Set()), 1800);

      setShowRegenerateModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  }

  return {
    numeroOffre,
    editablePreview,
    setEditablePreview,
    activeSection,
    setActiveSection,
    pendingSection,
    savedSections,
    flashingSections,
    unsavedSections,
    saveError,
    draftLignes,
    setDraftLignes,
    budgetSectionRef,
    showRegenerateModal,
    setShowRegenerateModal,
    regenerating,
    requestEdit,
    handleCancel,
    confirmSwitch,
    cancelSwitch,
    handleSave,
    handleBudgetSave,
    handleRegenerate,
  };
}
