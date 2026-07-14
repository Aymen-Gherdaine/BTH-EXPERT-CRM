"use client";

import { useState, useRef, useEffect } from "react";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import type { EditablePreview, FormDataStep2 } from "@/types";
import { buildAIContent } from "../utils";

interface UseLeaveGuardParams {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  soumissionId?: string;
  step2: FormDataStep2;
  editablePreview: EditablePreview;
  total_ht: number;
  tva: number;
  total_ttc: number;
}

export function useLeaveGuard({
  isDirty,
  setIsDirty,
  soumissionId,
  step2,
  editablePreview,
  total_ht,
  tva,
  total_ttc,
}: UseLeaveGuardParams) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingLeaveRef = useRef<(() => void) | null>(null);

  // Intercept browser/tab close when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Intercept sidebar / internal anchor clicks when dirty
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      if (target.download || target.target === "_blank") return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
      requestLeave(() => router.push(href));
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, router]);

  // Intercept browser back/forward when dirty
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      requestLeave(() => router.back());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, router]);

  function requestLeave(action: () => void) {
    if (isDirty) {
      pendingLeaveRef.current = action;
      setShowLeaveModal(true);
    } else {
      action();
    }
  }

  function confirmLeave() {
    setShowLeaveModal(false);
    pendingLeaveRef.current?.();
    pendingLeaveRef.current = null;
  }

  async function handleSaveAsDraft() {
    setSavingDraft(true);
    try {
      if (soumissionId) {
        const res = await fetch(`/api/soumissions/${soumissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statut: "brouillon",
            titre_projet: editablePreview.titre_projet,
            numero_offre: editablePreview.numero_offre,
            contexte_genere: JSON.stringify(buildAIContent(editablePreview)),
            total_ht,
            tva,
            total_ttc,
          }),
        });
        if (!res.ok) throw new Error("patch failed");
      } else {
        const step1ForApi = {
          titre: editablePreview.titre,
          nom_contact: editablePreview.nom_contact,
          poste: editablePreview.poste_contact,
          entreprise: editablePreview.entreprise,
          adresse: editablePreview.adresse,
          ville: editablePreview.ville,
        };
        const res = await fetch("/api/soumissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData: {
              step1: step1ForApi,
              step2,
              step3: { lignes: editablePreview.lignes_budget },
            },
            contexte: buildAIContent(editablePreview),
          }),
        });
        if (!res.ok) throw new Error("post failed");
      }
      // Brouillon créé/mis à jour → la liste soumissions se rafraîchit sans refresh.
      mutate((key) => typeof key === "string" && key.startsWith("/api/soumissions"));
      mutate("/api/dashboard");
      setIsDirty(false);
      setShowLeaveModal(false);
      pendingLeaveRef.current?.();
      pendingLeaveRef.current = null;
    } catch {
      setSaveError("Erreur lors de la sauvegarde");
      setTimeout(() => setSaveError(null), 6000);
    } finally {
      setSavingDraft(false);
    }
  }

  return {
    showLeaveModal,
    setShowLeaveModal,
    savingDraft,
    saveError,
    pendingLeaveRef,
    requestLeave,
    confirmLeave,
    handleSaveAsDraft,
  };
}
