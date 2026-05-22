"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DeleteState, D0 } from "../types";
import { I } from "../constants";
import { Ic } from "./Ic";

export function DeleteModal({ deleteConfirm, onCancel, onConfirm, deletingId }: {
  deleteConfirm: DeleteState;
  onCancel: () => void;
  onConfirm: () => void;
  deletingId: string | null;
}) {
  return (
    <AnimatePresence>
      {deleteConfirm.open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
            <motion.div
              initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
              style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
            >
              <div style={{ padding: "24px 24px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ic d={I.trash} z={20} s="#dc2626" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer cette soumission ?</p>
                    <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Cette action est <strong>irréversible</strong>. La soumission et ses lignes budgétaires seront définitivement supprimées.
                </p>
              </div>
              <div className="submission-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                  Annuler
                </button>
                <motion.button whileTap={{ scale: .97 }} onClick={onConfirm} disabled={!!deletingId} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}>
                  {deletingId ? "Suppression…" : "Supprimer"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
