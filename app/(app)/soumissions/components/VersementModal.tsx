"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatMontant } from "@/lib/utils";
import { VersementState, V0 } from "../types";

export function VersementModal({ versement, onCancel, versementInput, setVersementInput, onSave, saving }: {
  versement: VersementState;
  onCancel: () => void;
  versementInput: string;
  setVersementInput: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <AnimatePresence>
      {versement.open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
            <motion.div
              initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
              style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
            >
              <div style={{ padding: "24px 24px 0" }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Versement reçu</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>{versement.titre}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "#f6f6f4", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Montant TTC</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatMontant(versement.ttc)} DZD</span>
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Montant versé (DZD)</label>
                <input
                  type="number" value={versementInput} onChange={e => setVersementInput(e.target.value)}
                  placeholder="Ex : 500000" min={0} autoFocus
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", marginBottom: 6 }}
                />
                <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 20 }}>Acompte ou paiement partiel reçu du client.</p>
              </div>
              <div className="submission-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                  Annuler
                </button>
                <motion.button whileTap={{ scale: .97 }} onClick={onSave} disabled={saving} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#1a2e1e", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: saving ? .7 : 1 }}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
