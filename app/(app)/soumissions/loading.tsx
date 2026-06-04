// Skeleton loader — mirrors SoumissionsClient layout exactly
export default function SoumissionsLoading() {
  return (
    <div className="h-full flex flex-col bg-bth-canvas">

      {/* ── Hero / header ──────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 md:px-10 pt-6 pb-5 border-b border-[#e8e2d8] bg-white">
        {/* Top row: title + button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {/* Kicker */}
            <div className="h-3 w-28 rounded bg-[#e8e2d8] animate-pulse" />
            {/* Title */}
            <div className="h-7 w-48 rounded bg-[#e8e2d8] animate-pulse" />
            {/* Subtitle */}
            <div className="h-3.5 w-56 rounded bg-[#f5f0e8] animate-pulse" />
          </div>
          {/* "Nouvelle soumission" button */}
          <div className="h-9 w-40 rounded-[8px] bg-[#e8e2d8] animate-pulse flex-shrink-0" />
        </div>

        {/* KPI row */}
        <div className="mt-5 flex gap-3 overflow-hidden">
          {[120, 100, 110, 130].map((w, i) => (
            <div
              key={i}
              className="flex-shrink-0 h-[72px] rounded-xl border border-[#e8e2d8] bg-bth-surface-1 animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* ── Toolbar: filters + search ───────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 md:px-10 py-3 border-b border-[#e8e2d8] bg-white">
        {/* Search */}
        <div className="h-9 flex-1 rounded-[9999px] bg-[#e8e2d8] animate-pulse" />
        {/* Filter pills */}
        <div className="hidden sm:flex items-center gap-2">
          {[68, 60, 72, 62, 58].map((w, i) => (
            <div key={i} className="h-8 rounded-[9999px] bg-[#e8e2d8] animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-6 md:px-10 py-5">

        {/* Mobile card skeletons (< sm) */}
        <div className="flex flex-col gap-3 sm:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e8e2d8] bg-white animate-pulse"
              style={{ height: 172 }}
            >
              <div className="flex flex-col justify-between h-full p-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-3/4 rounded bg-[#e8e2d8]" />
                  <div className="h-2.5 w-20 rounded bg-[#f5f0e8]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 rounded bg-[#e8e2d8]" />
                  <div className="h-3 w-24 rounded bg-[#e8e2d8]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table skeleton (>= sm) */}
        <div className="hidden sm:block rounded-xl border border-[#e8e2d8] overflow-hidden bg-white">

          {/* Table header */}
          <div
            className="grid h-11 items-stretch bg-[#fbfaf7] border-b border-[#e8e2d8]"
            style={{ gridTemplateColumns: "130px 1fr 110px 60px 140px" }}
          >
            {[{ w: 80 }, { w: 140 }, { w: 60 }, { w: 30 }, { w: 90 }].map(({ w }, i) => (
              <div key={i} className="flex items-center px-4 border-r border-[#e8e2d8] last:border-r-0">
                <div className="h-2.5 rounded bg-[#e8e2d8] animate-pulse" style={{ width: w }} />
              </div>
            ))}
          </div>

          {/* 8 rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid items-stretch border-b border-[#f0ebe3] last:border-b-0"
              style={{ gridTemplateColumns: "130px 1fr 110px 60px 140px", minHeight: 52 }}
            >
              {/* N° Offre */}
              <div className="flex items-center px-4 border-r border-[#f0ebe3]">
                <div className="h-3 w-20 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
              {/* Titre */}
              <div className="flex flex-col justify-center gap-1.5 px-4 border-r border-[#f0ebe3]">
                <div className="h-3 rounded bg-[#e8e2d8] animate-pulse" style={{ width: `${55 + (i % 3) * 15}%` }} />
                <div className="h-2.5 w-20 rounded bg-[#f5f0e8] animate-pulse" />
              </div>
              {/* Statut */}
              <div className="flex items-center px-4 border-r border-[#f0ebe3]">
                <div className="h-5 w-20 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
              {/* Délai */}
              <div className="flex items-center px-4 border-r border-[#f0ebe3]">
                <div className="h-3 w-7 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
              {/* Montant */}
              <div className="flex items-center justify-end px-4">
                <div className="h-3 w-24 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-8 w-8 rounded-full bg-[#e8e2d8] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[#f5f0e8] animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-[#e8e2d8] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
