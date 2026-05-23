"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BTH_GREEN } from "../constants";

interface Props {
  open: boolean;
  savingDraft: boolean;
  onStay: () => void;
  onSaveDraft: () => void;
  onConfirmLeave: () => void;
}

export function LeaveGuardModal({ open, savingDraft, onStay, onSaveDraft, onConfirmLeave }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onStay}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Quitter sans sauvegarder ?</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vos modifications seront perdues si vous quittez cette page sans sauvegarder.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={onStay}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                  style={{ backgroundColor: BTH_GREEN }}
                >
                  Rester sur la page
                </button>
                <button
                  onClick={onSaveDraft}
                  disabled={savingDraft}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {savingDraft ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sauvegarde…
                    </>
                  ) : (
                    "Enregistrer comme brouillon"
                  )}
                </button>
                <button
                  onClick={onConfirmLeave}
                  disabled={savingDraft}
                  className="w-full py-1.5 rounded-xl text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                >
                  Quitter sans sauvegarder
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
