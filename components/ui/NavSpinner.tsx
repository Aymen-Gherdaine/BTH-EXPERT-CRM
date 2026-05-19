"use client";

import { motion } from "framer-motion";

export function NavSpinner({ size = 12 }: { size?: number }) {
  return (
    <motion.svg
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "block" }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}
