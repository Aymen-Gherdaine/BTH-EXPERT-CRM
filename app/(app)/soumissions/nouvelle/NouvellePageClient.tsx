"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import StepClientInfo from "@/components/forms/StepClientInfo";
import StepProjectInfo from "@/components/forms/StepProjectInfo";
import { FormDataStep1, FormDataStep2, FormDataStep3, UserRole } from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";

// Fallback léger affiché pendant le chargement d'une étape différée.
function StepLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-64 bg-gray-50 rounded-xl animate-pulse mt-6" />
    </div>
  );
}

// Étapes lourdes (Budget ~730 lignes ; Prévisualisation ~1800 lignes avec ses
// sous-composants et modales) chargées à la demande : elles ne sont montées
// qu'aux étapes 3 et 4, donc leur JS ne pèse plus sur le bundle initial de la
// page « Nouvelle soumission ».
const StepBudget = dynamic(() => import("@/components/forms/StepBudget"), {
  loading: StepLoading,
  ssr: false,
});
const StepPreview = dynamic(() => import("@/components/forms/StepPreview"), {
  loading: StepLoading,
  ssr: false,
});

const STEPS = ["Informations client", "Projet", "Budget", "Prévisualisation"];

const defaultStep1: FormDataStep1 = {
  titre: "M.",
  nom_contact: "",
  poste: "",
  entreprise: "",
  adresse: "",
  ville: "",
};

const defaultStep2: FormDataStep2 = {
  titre_projet: "",
  secteur_activite: "",
  description_projet: "",
  type_etude: "EIE+Dangers",
  delai_jours: 45,
};

const defaultStep3: FormDataStep3 = {
  // Pas de tableau « Mission » par défaut : l'utilisateur choisit directement
  // son premier type d'étude (prédéfini ou personnalisé).
  lignes: [],
};

import type { Variants } from "framer-motion";

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  }),
};

interface Props {
  parametres: {
    signataire1_nom: string | null;
    signataire1_titre: string | null;
    signataire2_nom: string | null;
    signataire2_titre: string | null;
  } | null;
}

export default function NouvellePageClient({ parametres }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step1, setStep1] = useState<FormDataStep1>(defaultStep1);
  const [step2, setStep2] = useState<FormDataStep2>(defaultStep2);
  const [step3, setStep3] = useState<FormDataStep3>(defaultStep3);
  const [contexte, setContexte] = useState<SoumissionAIContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const isDirty = !saved && (step > 0 || step1.nom_contact.trim() !== "" || step1.entreprise.trim() !== "");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data: { role?: UserRole } | null) => {
        if (data?.role === "commercial") {
          router.replace("/soumissions");
          return;
        }
        setRole(data?.role ?? "admin");
      })
      .catch(() => router.replace("/soumissions"));
  }, [router]);

  function requestLeave(action: () => void) {
    if (!isDirty) { action(); return; }
    pendingActionRef.current = action;
    setShowLeaveModal(true);
  }

  function confirmLeave() {
    setShowLeaveModal(false);
    pendingActionRef.current?.();
    pendingActionRef.current = null;
  }

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
  }, [isDirty]);

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
  }, [isDirty]);

  function goTo(newStep: number) {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  }

  function handleBackFromPreview() {
    requestLeave(() => goTo(2));
  }

  function handleStep2Complete(data: FormDataStep2) {
    setStep2(data);
    goTo(2);
  }

  async function handleStep3Complete(data: FormDataStep3) {
    setStep3(data);
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step1, step2, step3: data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContexte(json.data);
      goTo(3);
    } catch {
      setError("Erreur lors de la génération IA. Veuillez réessayer.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/soumissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: { step1, step2, step3 },
          contexte,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaved(true);
      router.push(`/soumissions/${json.data.id}`);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAsReference(data: FormDataStep3) {
    setStep3(data);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/soumissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: { step1, step2, step3: data },
          // Pas de contexte → soumission de référence sans génération IA
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaved(true);
      router.push(`/soumissions/${json.data.id}`);
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (!role) {
    return (
      <div className="px-4 py-6 md:p-8 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-80 bg-gray-50 rounded-lg animate-pulse mt-3" />
        <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse mt-8" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nouvelle soumission</h1>
        <p className="text-gray-500 text-sm mt-1">Générez une offre de services professionnelle</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-5 md:mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && goTo(i)}
              className="flex items-center gap-2 group cursor-pointer min-h-[44px]"
              disabled={i >= step}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i === step
                    ? "text-white"
                    : i < step
                    ? "text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
                style={i <= step ? { backgroundColor: "#1a2e1e" } : {}}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  i === step ? "text-gray-900" : i < step ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1.5 sm:mx-3 transition-colors ${i < step ? "" : "bg-gray-200"}`}
                style={i < step ? { backgroundColor: "#1a2e1e" } : {}}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {step === 0 && (
              <StepClientInfo
                data={step1}
                onNext={(data) => {
                  setStep1(data);
                  goTo(1);
                }}
              />
            )}
            {step === 1 && (
              <StepProjectInfo
                data={step2}
                onBack={() => goTo(0)}
                onNext={handleStep2Complete}
              />
            )}
            {step === 2 && (
              <StepBudget
                data={step3}
                generating={generating}
                saving={saving}
                onBack={() => goTo(1)}
                onNext={handleStep3Complete}
                onSaveAsReference={handleSaveAsReference}
              />
            )}
            {step === 3 && contexte && (
              <StepPreview
                step1={step1}
                step2={step2}
                step3={step3}
                aiContent={contexte}
                saving={saving}
                onBack={handleBackFromPreview}
                onSave={handleSave}
                parametres={parametres}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal — quitter le formulaire sans sauvegarder */}
      <AnimatePresence>
        {showLeaveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowLeaveModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Quitter le formulaire ?</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Vos données non sauvegardées seront perdues.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                    style={{ backgroundColor: "#1a2e1e" }}
                  >
                    Rester sur le formulaire
                  </button>
                  <button
                    onClick={confirmLeave}
                    className="w-full py-1.5 rounded-xl text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer min-h-[36px]"
                  >
                    Quitter sans sauvegarder
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
