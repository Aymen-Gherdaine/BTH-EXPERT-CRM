"use client";

import { useEffect } from "react";
import { preload } from "swr";
import { fetcher } from "@/lib/fetcher";

// Fired once after the initial render is stable.
// Populates the SWR cache so subsequent page navigations hit the cache
// instead of waiting for a network round-trip.
const API_ROUTES = [
  "/api/dashboard",
  "/api/soumissions",
  "/api/clients",
  "/api/prospects",
  "/api/depenses",
  "/api/me",
];

export function DataPrefetcher() {
  useEffect(() => {
    // Delay slightly so initial page render gets full priority.
    const t = setTimeout(() => {
      API_ROUTES.forEach((url) => preload(url, fetcher));
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return null;
}
