"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Charge le moteur d'animation framer-motion une seule fois, en version
 * réduite (domAnimation) au lieu du moteur complet inclus par chaque
 * `import { motion }`. Combiné à `import { m as motion }` dans les composants,
 * ça retire ~47 KB de framer-motion du First Load de CHAQUE route.
 *
 * domAnimation couvre animations, gestures (whileHover/whileTap) et exit
 * (AnimatePresence) — soit toutes les features effectivement utilisées dans
 * l'app (aucun layoutId/drag après nettoyage).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
