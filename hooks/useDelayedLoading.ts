"use client";

import { useState, useEffect } from "react";

export function useDelayedLoading(loading: boolean, delay = 300): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!loading) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [loading, delay]);
  return show;
}
