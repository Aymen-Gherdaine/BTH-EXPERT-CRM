"use client";

import { useState } from "react";
import { FormDataStep2, TypeEtude } from "@/types";

interface Props {
  data: FormDataStep2;
  loading: boolean;
  onBack: () => void;
  onNext: (data: FormDataStep2) => void;
}

const TYPE_ETUDE_OPTIONS: { value: TypeEtude; label: string; desc: string }[] = [
  {
    value: "EIE+Dangers",
    label: "EIE + Étude de Dangers",
    desc: "Installations classées de 1ère catégorie",
  },
  {
    value: "Notice+ProduitsDangereux",
    label: "Notice d'Impact + Produits Dangereux",
    desc: "Installations classées de 2ème catégorie",
  },
  {
    value: "Audit",
    label: "Audit environnemental",
    desc: "Établissements existants en activité",
  },
  {
    value: "Audit+RapportProduits",
    label: "Audit env + Rapport produits dangereux",
    desc: "Audit environnemental et rapport sur les produits dangereux",
  },
  {
    value: "Autre",
    label: "Autre étude réglementaire",
    desc: "Autre type d'étude environnementale",
  },
];

const DELAIS = [15, 30, 45, 60, 90, 120];

export default function StepProjectInfo({ data, loading, onBack, onNext }: Props) {
  const [form, setForm] = useState<FormDataStep2>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataStep2, string>>>({});

  function validate() {
    const e: Partial<Record<keyof FormDataStep2, string>> = {};
    if (!form.titre_projet.trim()) e.titre_projet = "Requis";
    if (!form.secteur_activite.trim()) e.secteur_activite = "Requis";
    if (!form.description_projet.trim()) e.description_projet = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations projet</h2>

      <div className="space-y-5">
        {/* Titre projet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Titre du projet <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.titre_projet}
            onChange={(e) => setForm({ ...form, titre_projet: e.target.value })}
            placeholder="ex. Étude environnementale de l'unité SARL SAFMA..."
            className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 ${
              errors.titre_projet
                ? "border-red-300 focus:ring-red-100"
                : "border-gray-200 focus:border-[#1a2e1e] focus:ring-[#1a2e1e]/10"
            }`}
          />
          {errors.titre_projet && (
            <p className="text-red-500 text-xs mt-1">{errors.titre_projet}</p>
          )}
        </div>

        {/* Secteur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Secteur d'activité <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.secteur_activite}
            onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })}
            placeholder="ex. Production et stockage de garnitures de frein"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 ${
              errors.secteur_activite
                ? "border-red-300 focus:ring-red-100"
                : "border-gray-200 focus:border-[#1a2e1e] focus:ring-[#1a2e1e]/10"
            }`}
          />
          {errors.secteur_activite && (
            <p className="text-red-500 text-xs mt-1">{errors.secteur_activite}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description du projet <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description_projet}
            onChange={(e) => setForm({ ...form, description_projet: e.target.value })}
            placeholder="Décrivez le projet, les activités, les installations concernées..."
            rows={4}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 resize-none ${
              errors.description_projet
                ? "border-red-300 focus:ring-red-100"
                : "border-gray-200 focus:border-[#1a2e1e] focus:ring-[#1a2e1e]/10"
            }`}
          />
          {errors.description_projet && (
            <p className="text-red-500 text-xs mt-1">{errors.description_projet}</p>
          )}
        </div>

        {/* Type étude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'étude <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TYPE_ETUDE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, type_etude: opt.value })}
                className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                  form.type_etude === opt.value
                    ? "border-[#1a2e1e] bg-[#1a2e1e]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    form.type_etude === opt.value ? "text-[#1a2e1e]" : "text-gray-800"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Délai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Délai d'exécution (jours)
          </label>
          <div className="flex flex-wrap gap-2">
            {DELAIS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, delai_jours: d })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  form.delai_jours === d
                    ? "border-[#1a2e1e] bg-[#1a2e1e]/5 text-[#1a2e1e]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {d} j
              </button>
            ))}
            <input
              type="number"
              value={DELAIS.includes(form.delai_jours) ? "" : form.delai_jours}
              onChange={(e) =>
                setForm({ ...form, delai_jours: parseInt(e.target.value) || 45 })
              }
              placeholder="Autre"
              min={1}
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a2e1e]"
            />
          </div>
        </div>
      </div>

      {/* Note IA */}
      <div className="mt-6 p-4 bg-[#1a2e1e]/5 rounded-xl border border-[#1a2e1e]/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#1a2e1e] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[#1a2e1e]">Génération IA</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Les sections "Contexte et objectifs" et "Objectifs du projet" seront générées automatiquement par Claude AI en style formel algérien.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
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
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Génération en cours…
            </>
          ) : (
            <>
              Générer avec l'IA
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
