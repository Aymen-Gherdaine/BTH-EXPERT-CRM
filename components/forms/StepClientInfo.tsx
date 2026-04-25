"use client";

import { useState } from "react";
import { FormDataStep1, TitreContact } from "@/types";

interface Props {
  data: FormDataStep1;
  onNext: (data: FormDataStep1) => void;
}

const TITRES: TitreContact[] = ["M.", "Mme", "Dr.", "Pr."];

export default function StepClientInfo({ data, onNext }: Props) {
  const [form, setForm] = useState<FormDataStep1>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataStep1, string>>>({});

  function validate() {
    const e: Partial<Record<keyof FormDataStep1, string>> = {};
    if (!form.nom_contact.trim()) e.nom_contact = "Requis";
    if (!form.poste.trim()) e.poste = "Requis";
    if (!form.entreprise.trim()) e.entreprise = "Requis";
    if (!form.adresse.trim()) e.adresse = "Requis";
    if (!form.ville.trim()) e.ville = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  function field(
    label: string,
    key: keyof FormDataStep1,
    placeholder?: string,
    required = true
  ) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
          type="text"
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 ${
            errors[key]
              ? "border-red-300 focus:ring-red-100"
              : "border-gray-200 focus:border-[#1a2e1e] focus:ring-[#1a2e1e]/10"
          }`}
        />
        {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations client</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Titre */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Titre <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {TITRES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, titre: t })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  form.titre === t
                    ? "border-[#1a2e1e] bg-[#1a2e1e]/5 text-[#1a2e1e]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {field("Nom et prénom", "nom_contact", "ex. Mohamed Ghemri")}
        {field("Poste / Fonction", "poste", "ex. Président-directeur général")}
        {field("Entreprise", "entreprise", "ex. Sarl SAFMA")}
        <div className="sm:col-span-2">
          {field("Adresse", "adresse", "ex. Zone industrielle, Rue 12")}
        </div>
        {field("Ville", "ville", "ex. Oran 31000")}
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          Suivant
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
