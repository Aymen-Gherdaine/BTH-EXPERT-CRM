"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 bg-bth-canvas">
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Alert icon */}
        <div className="w-14 h-14 rounded-xl bg-bth-surface-1 border border-[#e8e2d8] flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a8874e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div className="w-8 h-px bg-bth-gold-500 mb-5" />

        <h1 className="text-lg font-semibold text-bth-n-900 mb-2">Une erreur est survenue</h1>
        <p className="text-sm text-bth-n-500 leading-relaxed mb-8">
          {error.message || "Une erreur inattendue s'est produite. Réessayez ou revenez aux soumissions."}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="h-10 px-5 rounded-[8px] bg-bth-green-800 text-white text-sm font-semibold"
            style={{ transition: "opacity 150ms ease" }}
          >
            Réessayer
          </button>
          <Link
            href="/soumissions"
            className="h-10 px-5 rounded-[8px] border border-[#d0c9be] bg-bth-surface-1 text-bth-n-700 text-sm font-semibold inline-flex items-center"
            style={{ transition: "border-color 150ms ease" }}
          >
            Retour aux soumissions
          </Link>
        </div>
      </div>
    </div>
  );
}
