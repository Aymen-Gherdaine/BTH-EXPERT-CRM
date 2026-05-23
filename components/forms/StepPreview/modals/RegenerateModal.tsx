"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BTH_GREEN, MID_BLUE } from "../constants";

interface Props {
  open: boolean;
  regenerating: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

export function RegenerateModal({ open, regenerating, onRegenerate, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => !regenerating && onClose()}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl pointer-events-auto p-6 pb-8 sm:pb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${MID_BLUE}15` }}
                >
                  <svg className="w-5 h-5" style={{ color: MID_BLUE }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Régénérer les sections IA</p>
                  <p className="text-xs text-gray-400 mt-0.5">Nouvelle génération avec Claude</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                La régénération remplacera uniquement les sections IA
                (contexte, objectifs, livrables, hypothèses, échéancier,
                inclusions/exclusions).{" "}
                <span className="font-medium text-gray-900">
                  Les informations client et offre seront conservées.
                </span>
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 min-h-[44px]"
                  style={{ backgroundColor: BTH_GREEN }}
                >
                  {regenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Génération…
                    </>
                  ) : (
                    "Régénérer"
                  )}
                </motion.button>
                <button
                  onClick={onClose}
                  disabled={regenerating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
