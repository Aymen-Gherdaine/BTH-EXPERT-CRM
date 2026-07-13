"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { CategorieDepense } from "@/types";
import { CATEGORIES, I, type DepenseFormProps } from "./lib";
import { Icon, SelectChevron, Spinner } from "./components";

export default function DepenseForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  photo,
  onPhoto,
  soumissions,
  submitLabel,
}: DepenseFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form className="depenses-form" onSubmit={onSubmit}>
      <div className="depenses-form-grid">
        <div>
          <label className="depenses-form-label">Montant (DZD) *</label>
          <input
            className="depenses-form-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.montant}
            onChange={(event) => onChange((current) => ({ ...current, montant: event.target.value }))}
            required
          />
        </div>
        <div>
          <label className="depenses-form-label">Catégorie *</label>
          <div style={{ position: "relative" }}>
            <select
              className="depenses-form-select"
              value={form.categorie}
              onChange={(event) => onChange((current) => ({ ...current, categorie: event.target.value as CategorieDepense }))}
              required
            >
              <option value="">Choisir...</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>

      <div className="depenses-form-grid">
        <div>
          <label className="depenses-form-label">Date</label>
          <input
            className="depenses-form-input"
            type="date"
            value={form.date_depense}
            onChange={(event) => onChange((current) => ({ ...current, date_depense: event.target.value }))}
          />
        </div>
        <div>
          <label className="depenses-form-label">Projet lié</label>
          <div style={{ position: "relative" }}>
            <select
              className="depenses-form-select"
              value={form.projet_lie}
              onChange={(event) => onChange((current) => ({ ...current, projet_lie: event.target.value }))}
            >
              <option value="">Aucun</option>
              {soumissions.map((soumission) => (
                <option key={soumission.id} value={soumission.id}>
                  {soumission.numero_offre} - {soumission.titre_projet}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="depenses-form-label">Description</label>
        <input
          className="depenses-form-input"
          type="text"
          placeholder="Notes optionnelles..."
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>

      <div>
        <label className="depenses-form-label">Justificatif</label>
        <div className="depenses-file" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
          <Icon paths={I.paperclip} size={15} stroke="#a8874e" />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
            {photo ? photo.name : "Photo ou fichier (optionnel)"}
          </span>
          {photo && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPhoto(null);
              }}
              style={{ border: 0, background: "transparent", color: "#887f74", cursor: "pointer", padding: 0, display: "flex" }}
              aria-label="Retirer le fichier"
            >
              <Icon paths={I.x} size={14} />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => onPhoto(event.target.files?.[0] ?? null)} />
      </div>

      <div className="depenses-form-actions">
        <motion.button className="depenses-submit" type="submit" disabled={saving} whileTap={saving ? undefined : { scale: 0.97 }}>
          {saving && <Spinner />}
          {submitLabel}
        </motion.button>
        <button className="depenses-cancel" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
