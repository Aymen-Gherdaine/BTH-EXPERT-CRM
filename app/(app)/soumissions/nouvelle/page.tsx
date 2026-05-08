"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StepClientInfo from "@/components/forms/StepClientInfo";
import StepProjectInfo from "@/components/forms/StepProjectInfo";
import StepBudget from "@/components/forms/StepBudget";
import StepPreview from "@/components/forms/StepPreview";
import { FormDataStep1, FormDataStep2, FormDataStep3 } from "@/types";

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
  lignes: [
    { numero: 1, designation: "", quantite: 1, prix_unitaire: 0, ordre: 0 },
  ],
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

export default function NouvelleSoumissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step1, setStep1] = useState<FormDataStep1>(defaultStep1);
  const [step2, setStep2] = useState<FormDataStep2>(defaultStep2);
  const [step3, setStep3] = useState<FormDataStep3>(defaultStep3);
  const [contexte, setContexte] = useState<{ section_1: string; section_1_1: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [leaveWarning, setLeaveWarning] = useState(false);

  // Avertissement navigateur (onglet fermé, bouton précédent) quand à l'étape preview non sauvegardée
  useEffect(() => {
    if (step !== 3 || saved) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step, saved]);

  function goTo(newStep: number) {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  }

  function handleBackFromPreview() {
    if (!saved) {
      setLeaveWarning(true);
    } else {
      goTo(2);
    }
  }

  async function handleStep2Complete(data: FormDataStep2) {
    setStep2(data);
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step1, step2: data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContexte(json.data);
      goTo(2);
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle soumission</h1>
        <p className="text-gray-500 text-sm mt-1">Générez une offre de services professionnelle</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && goTo(i)}
              className="flex items-center gap-2 group cursor-pointer"
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
                className={`flex-1 h-0.5 mx-3 transition-colors ${i < step ? "" : "bg-gray-200"}`}
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
                loading={generating}
                onBack={() => goTo(0)}
                onNext={handleStep2Complete}
              />
            )}
            {step === 2 && (
              <StepBudget
                data={step3}
                onBack={() => goTo(1)}
                onNext={(data) => {
                  setStep3(data);
                  goTo(3);
                }}
              />
            )}
            {step === 3 && contexte && (
              <StepPreview
                step1={step1}
                step2={step2}
                step3={step3}
                contexte={contexte}
                saving={saving}
                onBack={handleBackFromPreview}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal — soumission non enregistrée */}
      <AnimatePresence>
        {leaveWarning && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setLeaveWarning(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">Soumission non enregistrée</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Les données de prévisualisation seront perdues</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Si vous revenez en arrière maintenant, la prévisualisation générée ne sera pas sauvegardée.
                    Cliquez sur <strong>Enregistrer</strong> d'abord pour ne pas perdre votre travail.
                  </p>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLeaveWarning(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: "#1a2e1e" }}
                  >
                    Rester
                  </motion.button>
                  <button
                    onClick={() => { setLeaveWarning(false); goTo(2); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Quitter sans enregistrer
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
