"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import VisiteForm, { type VisiteFormData } from "@/components/prospection/VisiteForm";

interface ProspectFormData {
  entreprise: string;
  secteur_activite: string;
  nom_contact: string;
  poste_contact: string;
  telephone: string;
  email: string;
  adresse: string;
  notes_generales: string;
}

const EMPTY_PROSPECT: ProspectFormData = {
  entreprise: "",
  secteur_activite: "",
  nom_contact: "",
  poste_contact: "",
  telephone: "",
  email: "",
  adresse: "",
  notes_generales: "",
};

export default function NouveauProspectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [prospectData, setProspectData] = useState<ProspectFormData>(EMPTY_PROSPECT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStep2(visiteData: VisiteFormData) {
    setLoading(true);
    setError("");
    try {
      // 1. Créer le prospect
      const prospectRes = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prospectData),
      });
      const prospectJson = await prospectRes.json();
      if (!prospectRes.ok) throw new Error(prospectJson.error ?? "Erreur création prospect");

      const prospectId: string = prospectJson.data.id;

      // 2. Créer la première visite
      const visiteRes = await fetch("/api/visites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId, ...visiteData }),
      });
      const visiteJson = await visiteRes.json();
      if (!visiteRes.ok) throw new Error(visiteJson.error ?? "Erreur création visite");

      router.push(`/prospection/${prospectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.back())}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouveau prospect</h1>
          <p className="text-sm text-gray-500">Étape {step} sur 2</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: s <= step ? "#1a2e1e" : "#e5e7eb" }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleStep1}
            className="space-y-4"
          >
            <p className="text-sm font-semibold text-gray-700 mb-1">Informations entreprise</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Entreprise *</label>
                <input
                  required
                  value={prospectData.entreprise}
                  onChange={(e) => setProspectData((f) => ({ ...f, entreprise: e.target.value }))}
                  placeholder="Nom de l'entreprise"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur d'activité *</label>
                <input
                  required
                  value={prospectData.secteur_activite}
                  onChange={(e) => setProspectData((f) => ({ ...f, secteur_activite: e.target.value }))}
                  placeholder="Ex: Industrie pharmaceutique, BTP…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact *</label>
                <input
                  required
                  value={prospectData.nom_contact}
                  onChange={(e) => setProspectData((f) => ({ ...f, nom_contact: e.target.value }))}
                  placeholder="Nom complet"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Poste *</label>
                <input
                  required
                  value={prospectData.poste_contact}
                  onChange={(e) => setProspectData((f) => ({ ...f, poste_contact: e.target.value }))}
                  placeholder="Ex: DG, Responsable HSE…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone *</label>
                <input
                  required
                  type="tel"
                  value={prospectData.telephone}
                  onChange={(e) => setProspectData((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="0555 00 00 00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={prospectData.email}
                  onChange={(e) => setProspectData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contact@entreprise.dz"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse *</label>
                <input
                  required
                  value={prospectData.adresse}
                  onChange={(e) => setProspectData((f) => ({ ...f, adresse: e.target.value }))}
                  placeholder="Adresse complète"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes générales</label>
                <textarea
                  value={prospectData.notes_generales}
                  onChange={(e) => setProspectData((f) => ({ ...f, notes_generales: e.target.value }))}
                  rows={2}
                  placeholder="Informations utiles sur l'entreprise…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors resize-none"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white min-h-[48px]"
              style={{ backgroundColor: "#1a2e1e" }}
            >
              Suivant — Première visite →
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-semibold text-gray-700 mb-4">Première visite chez {prospectData.entreprise}</p>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}
            <VisiteForm
              onSubmit={handleStep2}
              loading={loading}
              submitLabel="Créer le prospect"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
