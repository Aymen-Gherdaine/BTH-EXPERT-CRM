"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// ── Type ────────────────────────────────────────────────────

export interface Parametres {
  nom_societe: string;
  adresse: string;
  ville: string;
  email_contact: string;
  telephone: string;
  site_web: string;
  signataire1_nom: string;
  signataire1_titre: string;
  signataire2_nom: string;
  signataire2_titre: string;
  tva_pct: number;
  delai_jours: number;
  validite_jours: number;
  modalites_paiement: string;
  signature_responsable_url: string;
  signature_autorise_url: string;
}

const DEFAULTS: Parametres = {
  nom_societe: "BTH Expert",
  adresse: "",
  ville: "",
  email_contact: "",
  telephone: "",
  site_web: "",
  signataire1_nom: "Hakim Belghouini",
  signataire1_titre: "Expert Co-gérant",
  signataire2_nom: "Amine Lahmer",
  signataire2_titre: "Expert Gérant",
  tva_pct: 19,
  delai_jours: 45,
  validite_jours: 30,
  modalites_paiement: "50% à l'acceptation, 50% à la remise des livrables",
  signature_responsable_url: "",
  signature_autorise_url: "",
};

// ── Composants UI ────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  value: string | number;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1a2e1e] focus:border-transparent ${
        readOnly ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-200"
      }`}
    />
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

function Feedback({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <p
      className={`text-sm px-3 py-2 rounded-lg ${
        type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      {message}
    </p>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ParametresPage() {
  const [form, setForm] = useState<Parametres>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("parametres")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nom_societe: data.nom_societe ?? DEFAULTS.nom_societe,
            adresse: data.adresse ?? DEFAULTS.adresse,
            ville: data.ville ?? DEFAULTS.ville,
            email_contact: data.email_contact ?? DEFAULTS.email_contact,
            telephone: data.telephone ?? DEFAULTS.telephone,
            site_web: data.site_web ?? DEFAULTS.site_web,
            signataire1_nom: data.signataire1_nom ?? DEFAULTS.signataire1_nom,
            signataire1_titre: data.signataire1_titre ?? DEFAULTS.signataire1_titre,
            signataire2_nom: data.signataire2_nom ?? DEFAULTS.signataire2_nom,
            signataire2_titre: data.signataire2_titre ?? DEFAULTS.signataire2_titre,
            tva_pct: data.tva_pct ?? DEFAULTS.tva_pct,
            delai_jours: data.delai_jours ?? DEFAULTS.delai_jours,
            validite_jours: data.validite_jours ?? DEFAULTS.validite_jours,
            modalites_paiement: data.modalites_paiement ?? DEFAULTS.modalites_paiement,
            signature_responsable_url: data.signature_responsable_url ?? "",
            signature_autorise_url: data.signature_autorise_url ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  const [uploadingSignature, setUploadingSignature] = useState<"responsable" | "autorise" | null>(null);

  function set<K extends keyof Parametres>(key: K, value: Parametres[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSignatureUpload(
    file: File,
    field: "signature_responsable_url" | "signature_autorise_url",
    filename: string
  ) {
    const supabase = createSupabaseBrowserClient();
    setUploadingSignature(field === "signature_responsable_url" ? "responsable" : "autorise");
    const { data, error } = await supabase.storage
      .from("signatures")
      .upload(filename, file, { upsert: true, contentType: file.type });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from("signatures").getPublicUrl(data.path);
      set(field, publicUrl);
    }
    setUploadingSignature(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("parametres").upsert(
      { id: 1, ...form, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    if (error) {
      setFeedback({ type: "error", message: "Erreur lors de la sauvegarde : " + error.message });
    } else {
      setFeedback({ type: "success", message: "Paramètres sauvegardés avec succès." });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#1a2e1e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ces valeurs sont utilisées par défaut dans toutes les soumissions générées.
        </p>
      </div>

      {/* ── Section 1 : Informations société ── */}
      <SectionCard title="Informations de la société">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nom de la société">
              <Input value={form.nom_societe} onChange={(v) => set("nom_societe", v)} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Adresse">
              <Input value={form.adresse} onChange={(v) => set("adresse", v)} placeholder="Rue, numéro, BP…" />
            </Field>
          </div>
          <Field label="Ville / Wilaya">
            <Input value={form.ville} onChange={(v) => set("ville", v)} placeholder="Alger" />
          </Field>
          <Field label="Téléphone">
            <Input value={form.telephone} onChange={(v) => set("telephone", v)} placeholder="+213 …" />
          </Field>
          <Field label="Email de contact">
            <Input value={form.email_contact} onChange={(v) => set("email_contact", v)} type="email" placeholder="contact@bthexpert.dz" />
          </Field>
          <Field label="Site web" hint="Optionnel">
            <Input value={form.site_web} onChange={(v) => set("site_web", v)} placeholder="https://…" />
          </Field>
        </div>
      </SectionCard>

      {/* ── Section 2 : Signataires ── */}
      <SectionCard title="Signataires par défaut des soumissions">
        <div className="space-y-4">
          <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Responsable de l'offre</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom complet">
              <Input value={form.signataire1_nom} onChange={(v) => set("signataire1_nom", v)} />
            </Field>
            <Field label="Titre / Fonction">
              <Input value={form.signataire1_titre} onChange={(v) => set("signataire1_titre", v)} />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Autorisé par</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom complet">
              <Input value={form.signataire2_nom} onChange={(v) => set("signataire2_nom", v)} />
            </Field>
            <Field label="Titre / Fonction">
              <Input value={form.signataire2_titre} onChange={(v) => set("signataire2_titre", v)} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3 : Valeurs par défaut ── */}
      <SectionCard title="Valeurs par défaut des soumissions">
        <div className="grid grid-cols-3 gap-4">
          <Field label="TVA (%)" hint="Appliquée au total HT">
            <Input
              type="number"
              value={form.tva_pct}
              onChange={(v) => set("tva_pct", Number(v))}
            />
          </Field>
          <Field label="Délai d'exécution" hint="En jours">
            <Input
              type="number"
              value={form.delai_jours}
              onChange={(v) => set("delai_jours", Number(v))}
            />
          </Field>
          <Field label="Validité de l'offre" hint="En jours">
            <Input
              type="number"
              value={form.validite_jours}
              onChange={(v) => set("validite_jours", Number(v))}
            />
          </Field>
        </div>
        <Field label="Modalités de paiement">
          <textarea
            value={form.modalites_paiement}
            onChange={(e) => set("modalites_paiement", e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1e] focus:border-transparent transition resize-none"
          />
        </Field>
      </SectionCard>

      {/* ── Section 4 : Signatures ── */}
      <SectionCard title="Signatures numérisées">
        <p className="text-xs text-gray-400">
          Ces images seront intégrées automatiquement dans les PDF et DOCX générés. Format PNG ou JPG recommandé, fond transparent ou blanc, 1 Mo max.
        </p>
        <div className="grid grid-cols-2 gap-6 mt-2">
          {(
            [
              {
                label: "Responsable de l'offre",
                field: "signature_responsable_url" as const,
                filename: "signature-responsable.png",
                which: "responsable" as const,
              },
              {
                label: "Autorisé par",
                field: "signature_autorise_url" as const,
                filename: "signature-autorise.png",
                which: "autorise" as const,
              },
            ] as const
          ).map(({ label, field, filename, which }) => (
            <div key={field} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <div className="border border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center overflow-hidden bg-gray-50">
                {form[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form[field]} alt={label} className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-gray-400">Aucune signature</span>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingSignature !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSignatureUpload(file, field, filename);
                    e.target.value = "";
                  }}
                />
                <span className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50">
                  {uploadingSignature === which ? "Envoi…" : form[field] ? "Remplacer" : "Choisir une image"}
                </span>
              </label>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Feedback + Bouton ── */}
      {feedback && <Feedback {...feedback} />}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: "#1a2e1e" }}
      >
        {saving ? "Sauvegarde…" : "Sauvegarder les paramètres"}
      </button>
    </form>
  );
}
