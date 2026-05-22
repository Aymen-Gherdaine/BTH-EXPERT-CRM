import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bth-canvas flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bth-green-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wide text-bth-n-600 uppercase">BTH Hub</span>
        </div>

        {/* 404 */}
        <p
          className="text-bth-green-800 font-bold leading-none mb-4 select-none"
          style={{ fontSize: 96, letterSpacing: "-4px" }}
        >
          404
        </p>

        {/* Hairline */}
        <div className="w-12 h-px bg-bth-gold-500 mb-6" />

        {/* Text */}
        <h1 className="text-lg font-semibold text-bth-n-900 mb-2">Page introuvable</h1>
        <p className="text-sm text-bth-n-500 leading-relaxed mb-8">
          Cette page n&rsquo;existe pas ou a été déplacée.
        </p>

        {/* CTA */}
        <Link
          href="/soumissions"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-bth-green-800 text-white text-sm font-semibold"
          style={{ transition: "opacity 150ms ease" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
