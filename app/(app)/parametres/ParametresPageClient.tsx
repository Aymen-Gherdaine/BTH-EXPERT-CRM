"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { signatureObjectPath } from "@/lib/signature-url";
import type { Parametres } from "./defaults";

const SIGNATURE_FIELDS = ["signature_responsable_url", "signature_autorise_url"] as const;

const CSS = `
  .settings-shell {
    min-height: 100%;
    background: linear-gradient(180deg, #ffffff 0%, #fbfaf7 42%, #f7f2ea 100%);
    color: #1a1714;
  }
  .settings-inner {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 28px clamp(16px, 3vw, 40px) 40px;
  }
  .settings-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: end;
    margin-bottom: 18px;
  }
  .settings-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #7c6238;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-bottom: 8px;
  }
  .settings-kicker::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .settings-title {
    margin: 0;
    font-family: var(--font-display);
    color: #101c12;
    font-size: 32px;
    line-height: 1.05;
    font-weight: 650;
    letter-spacing: 0;
  }
  .settings-subtitle {
    margin-top: 8px;
    color: #756d63;
    font-size: 14px;
    line-height: 1.55;
    max-width: 620px;
  }
  .settings-badge {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 13px;
    border-radius: 9999px;
    border: 1px solid #e8e2d8;
    background: #fffdfa;
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
  .settings-form {
    display: grid;
    gap: 14px;
  }
  .settings-card {
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.92);
    border-radius: 16px;
    box-shadow: 0 18px 44px rgba(26,46,30,.055);
    overflow: hidden;
  }
  .settings-card-head {
    padding: 16px 18px 12px;
    border-bottom: 1px solid #f0ebe3;
    background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
  }
  .settings-card-title {
    margin: 0;
    color: #1a2e1e;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0;
  }
  .settings-card-body {
    padding: 18px;
    display: grid;
    gap: 16px;
  }
  .settings-grid-2,
  .settings-grid-3 {
    display: grid;
    gap: 14px;
  }
  .settings-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settings-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .settings-span-2 { grid-column: 1 / -1; }
  .settings-field {
    display: grid;
    gap: 7px;
    min-width: 0;
  }
  .settings-label {
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
  }
  .settings-hint {
    color: #958b7e;
    font-size: 11.5px;
    line-height: 1.35;
  }
  .settings-input,
  .settings-textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0c9be;
    border-radius: 12px;
    background: #ffffff;
    color: #1a1714;
    font-size: 14px;
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s;
  }
  .settings-input {
    min-height: 44px;
    padding: 0 13px;
  }
  .settings-textarea {
    min-height: 92px;
    padding: 12px 13px;
    resize: vertical;
  }
  .settings-input:focus,
  .settings-textarea:focus {
    border-color: #1a2e1e;
    box-shadow: 0 0 0 4px rgba(26,46,30,.10);
  }
  .settings-input[readonly] {
    background: #f6f4f0;
    color: #958b7e;
    cursor: not-allowed;
  }
  .settings-mini-title {
    color: #7c6238;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .settings-divider {
    border-top: 1px solid #f0ebe3;
    padding-top: 16px;
  }
  .settings-signature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .settings-signature-box {
    display: grid;
    gap: 9px;
    min-width: 0;
  }
  .settings-signature-preview {
    position: relative;
    height: 118px;
    border: 1px dashed #d0c9be;
    border-radius: 14px;
    background: #fbfaf7;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .settings-upload-label {
    width: fit-content;
    cursor: pointer;
  }
  .settings-upload-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
  }
  .settings-feedback {
    border-radius: 12px;
    padding: 11px 13px;
    font-size: 13px;
    font-weight: 700;
  }
  .settings-feedback.success {
    background: #edf7ef;
    color: #2d5a3d;
    border: 1px solid #cfe7d4;
  }
  .settings-feedback.error {
    background: #fff1f2;
    color: #be123c;
    border: 1px solid #fecdd3;
  }
  .settings-actions {
    position: sticky;
    bottom: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 14px 0 0;
    background: linear-gradient(180deg, rgba(247,242,234,0) 0%, #f7f2ea 36%);
  }
  .settings-save {
    min-height: 44px;
    border: 0;
    border-radius: 9999px;
    padding: 0 18px;
    background: #1a2e1e;
    color: #ffffff;
    font-size: 14px;
    font-weight: 850;
    box-shadow: 0 16px 34px rgba(26,46,30,.20);
    cursor: pointer;
  }
  .settings-save:disabled {
    opacity: .58;
    cursor: default;
  }
  @media (max-width: 767px) {
    .settings-inner {
      padding: 18px 14px calc(92px + env(safe-area-inset-bottom));
    }
    .settings-hero {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 10px;
      margin-bottom: 14px;
    }
    .settings-title {
      font-size: 27px;
    }
    .settings-subtitle {
      font-size: 13px;
      line-height: 1.45;
    }
    .settings-badge {
      width: fit-content;
      min-height: 32px;
      font-size: 11.5px;
    }
    .settings-card {
      border-radius: 14px;
      box-shadow: 0 12px 30px rgba(26,46,30,.05);
    }
    .settings-card-head {
      padding: 14px 14px 11px;
    }
    .settings-card-body {
      padding: 14px;
      gap: 14px;
    }
    .settings-grid-2,
    .settings-grid-3,
    .settings-signature-grid {
      grid-template-columns: 1fr;
    }
    .settings-input {
      min-height: 46px;
      font-size: 16px;
    }
    .settings-textarea {
      font-size: 15px;
    }
    .settings-signature-preview {
      height: 104px;
    }
    .settings-actions {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
      border-top: 1px solid #e8e2d8;
      background: rgba(255,255,255,.94);
      backdrop-filter: blur(8px);
    }
    .settings-save {
      width: 100%;
    }
  }
`;

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
    <div className="settings-field">
      <label className="settings-label">{label}</label>
      {children}
      {hint && <p className="settings-hint">{hint}</p>}
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
      className="settings-input"
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
    <section className="settings-card">
      <div className="settings-card-head">
        <h2 className="settings-card-title">{title}</h2>
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}

function Feedback({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <p className={`settings-feedback ${type}`}>
      {message}
    </p>
  );
}

// ── Page Client ───────────────────────────────────────────────

export default function ParametresPageClient({ initialData }: { initialData: Parametres }) {
  const [form, setForm] = useState<Parametres>(initialData);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [uploadingSignature, setUploadingSignature] = useState<"responsable" | "autorise" | null>(null);
  // SEC-05 : aperçu via URL signée (le bucket signatures est privé). On amorce
  // avec l'éventuelle URL héritée (bucket encore public) puis on la remplace par
  // une URL signée résolue en effet — fonctionne bucket public OU privé.
  const [sigPreview, setSigPreview] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of SIGNATURE_FIELDS) {
      const v = initialData[f];
      if (typeof v === "string" && v.startsWith("http")) init[f] = v;
    }
    return init;
  });

  function set<K extends keyof Parametres>(key: K, value: Parametres[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Résout (ou rafraîchit) les URLs signées d'aperçu à partir des valeurs stockées.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    (async () => {
      for (const field of SIGNATURE_FIELDS) {
        const path = signatureObjectPath(form[field] as string | null | undefined);
        if (!path) {
          if (!cancelled) setSigPreview((p) => { const n = { ...p }; delete n[field]; return n; });
          continue;
        }
        const { data } = await supabase.storage.from("signatures").createSignedUrl(path, 3600);
        if (!cancelled && data?.signedUrl) {
          setSigPreview((p) => ({ ...p, [field]: data.signedUrl }));
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.signature_responsable_url, form.signature_autorise_url]);

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
      // On stocke le CHEMIN d'objet (pas d'URL publique) — le bucket est privé.
      set(field, data.path);
      const { data: signed } = await supabase.storage
        .from("signatures")
        .createSignedUrl(data.path, 3600);
      if (signed?.signedUrl) {
        setSigPreview((p) => ({ ...p, [field]: signed.signedUrl }));
      }
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

  return (
    <div className="settings-shell">
      <style>{CSS}</style>
      <form onSubmit={handleSave} className="settings-inner">
      {/* Titre */}
      <div className="settings-hero">
        <div>
          <div className="settings-kicker">Configuration</div>
          <h1 className="settings-title">Paramètres</h1>
          <p className="settings-subtitle">
            Valeurs par défaut utilisées dans les documents, les offres et les exports générés par BTH Hub.
          </p>
        </div>
        <span className="settings-badge">BTH Expert</span>
      </div>

      <div className="settings-form">
      {/* ── Section 1 : Informations société ── */}
      <SectionCard title="Informations de la société">
        <div className="settings-grid-2">
          <div className="settings-span-2">
            <Field label="Nom de la société">
              <Input value={form.nom_societe} onChange={(v) => set("nom_societe", v)} />
            </Field>
          </div>
          <div className="settings-span-2">
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
        <div className="settings-field">
          <p className="settings-mini-title">Responsable de l'offre</p>
          <div className="settings-grid-2">
            <Field label="Nom complet">
              <Input value={form.signataire1_nom} onChange={(v) => set("signataire1_nom", v)} />
            </Field>
            <Field label="Titre / Fonction">
              <Input value={form.signataire1_titre} onChange={(v) => set("signataire1_titre", v)} />
            </Field>
          </div>
        </div>

        <div className="settings-field settings-divider">
          <p className="settings-mini-title">Autorisé par</p>
          <div className="settings-grid-2">
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
        <div className="settings-grid-3">
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
            rows={3}
            className="settings-textarea"
          />
        </Field>
      </SectionCard>

      {/* ── Section 4 : Signatures ── */}
      <SectionCard title="Signatures numérisées">
        <p className="settings-hint">
          Ces images seront intégrées automatiquement dans les PDF et DOCX générés. Format PNG ou JPG recommandé, fond transparent ou blanc, 1 Mo max.
        </p>
        <div className="settings-signature-grid">
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
            <div key={field} className="settings-signature-box">
              <p className="settings-label">{label}</p>
              <div className="settings-signature-preview">
                {form[field] ? (
                  sigPreview[field] ? (
                    <Image src={sigPreview[field]} alt={label} fill sizes="(max-width: 768px) 100vw, 320px" className="object-contain p-2" />
                  ) : (
                    <span className="settings-hint">Aperçu…</span>
                  )
                ) : (
                  <span className="settings-hint">Aucune signature</span>
                )}
              </div>
              <label className="settings-upload-label">
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
                <span className="settings-upload-btn">
                  {uploadingSignature === which ? "Envoi…" : form[field] ? "Remplacer" : "Choisir une image"}
                </span>
              </label>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Feedback + Bouton ── */}
      {feedback && <Feedback {...feedback} />}

      <div className="settings-actions">
        <button type="submit" disabled={saving} className="settings-save">
          {saving ? "Sauvegarde…" : "Sauvegarder les paramètres"}
        </button>
      </div>
      </div>
      </form>
    </div>
  );
}
