"use client";

import { motion } from "framer-motion";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = "Ajouter" }: FABProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[76px] right-4 w-12 h-12 rounded-full bg-bth-green-800
                 flex items-center justify-center text-white
                 shadow-[var(--bth-shadow-lg)] z-20 md:hidden bth-focus"
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </motion.button>
  );
}
