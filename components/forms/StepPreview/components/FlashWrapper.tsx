"use client";

import { motion } from "framer-motion";
import type { SectionId } from "../constants";

interface Props {
  sectionId: SectionId;
  color: string;
  flashingSections: Set<string>;
  children: React.ReactNode;
}

export function FlashWrapper({ sectionId, color, flashingSections, children }: Props) {
  const isFlashing = flashingSections.has(sectionId);
  return (
    <motion.div
      className="rounded-xl"
      animate={
        isFlashing
          ? {
              boxShadow: [
                `0 0 0 0px transparent`,
                `0 0 0 3px ${color}`,
                `0 0 0 0px transparent`,
              ],
            }
          : { boxShadow: `0 0 0 0px transparent` }
      }
      transition={{ duration: 1.4, ease: "easeOut", times: [0, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
