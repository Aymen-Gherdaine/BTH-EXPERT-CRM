"use client";

import { useState, useEffect } from "react";

export type Bp = "mobile" | "tablet" | "desktop";

export function useBp(): Bp {
  const [bp, set] = useState<Bp>("mobile");
  useEffect(() => {
    const h = () => set(
      window.innerWidth >= 1024 ? "desktop"
      : window.innerWidth >= 640 ? "tablet"
      : "mobile"
    );
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}
