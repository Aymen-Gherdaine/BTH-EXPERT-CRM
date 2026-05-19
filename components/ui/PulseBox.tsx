"use client";

import { motion } from "framer-motion";

export function PulseBox({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [1, 0.45, 1] }}
      transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
      className={`rounded-bth-md bg-bth-n-100 ${className ?? ""}`}
    />
  );
}
