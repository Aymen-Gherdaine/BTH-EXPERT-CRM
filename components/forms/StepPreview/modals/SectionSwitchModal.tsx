"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BTH_GREEN } from "../constants";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SectionSwitchModal({ open, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onCancel}
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
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Modifications non sauvegardées</p>
                  <p className="text-xs text-gray-400 mt-0.5">Annuler les modifications en cours ?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                  style={{ backgroundColor: BTH_GREEN }}
                >
                  Oui, continuer
                </motion.button>
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer min-h-[44px]"
                >
                  Rester ici
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
