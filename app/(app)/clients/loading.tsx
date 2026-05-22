// Skeleton loader — mirrors ClientsPage layout exactly
export default function ClientsLoading() {
  return (
    <div className="h-full flex flex-col" style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f5 38%, #f7f2ea 100%)" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-[clamp(16px,3vw,40px)] pt-6 pb-[18px] border-b border-[#e8e2d8] bg-white/90">
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
          {/* Left: kicker + title + subtitle */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-28 rounded bg-[#e8e2d8] animate-pulse" />
            <div className="h-7 w-44 rounded bg-[#e8e2d8] animate-pulse" />
            <div className="h-3.5 w-64 rounded bg-[#f5f0e8] animate-pulse" />
          </div>
          {/* Right: export button */}
          <div className="h-10 w-24 rounded-[9999px] bg-[#e8e2d8] animate-pulse self-start" />
        </div>

        {/* 3 stat cards */}
        <div className="mt-[18px] grid gap-2.5" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[14px] border border-[#e8e2d8] bg-white/78 p-[13px_14px] animate-pulse"
              style={{ minHeight: 76 }}
            >
              <div className="h-2.5 w-20 rounded bg-[#e8e2d8]" />
              <div className="mt-2 h-[17px] w-16 rounded bg-[#e8e2d8]" />
              <div className="mt-[5px] h-3 w-24 rounded bg-[#f5f0e8]" />
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mt-4 h-11 w-full rounded-[9999px] bg-[#e8e2d8] animate-pulse" />
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-[clamp(16px,3vw,40px)] py-[18px]">
        <div className="rounded-[16px] border border-[#e8e2d8] overflow-hidden bg-white">

          {/* Table header */}
          <div
            className="grid h-11 items-stretch border-b border-[#e8e2d8]"
            style={{ gridTemplateColumns: "220px 1fr 120px 130px 88px", background: "#fbfaf7" }}
          >
            {[{ w: 80 }, { w: 60 }, { w: 40 }, { w: 80 }, { w: 0 }].map(({ w }, i) => (
              <div key={i} className="flex items-center px-4 border-r border-[#e8e2d8] last:border-r-0">
                {w > 0 && <div className="h-2.5 rounded bg-[#e8e2d8] animate-pulse" style={{ width: w }} />}
              </div>
            ))}
          </div>

          {/* 8 rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid items-stretch border-b border-[#f0ebe3] last:border-b-0"
              style={{ gridTemplateColumns: "220px 1fr 120px 130px 88px", minHeight: 52 }}
            >
              {/* Entreprise (avatar + name) */}
              <div className="flex items-center gap-3 px-4 border-r border-[#f0ebe3]">
                <div className="w-9 h-9 rounded-full bg-[#e8e2d8] animate-pulse flex-shrink-0" />
                <div className="h-3 rounded bg-[#e8e2d8] animate-pulse" style={{ width: `${50 + (i % 4) * 10}%` }} />
              </div>
              {/* Contact */}
              <div className="flex flex-col justify-center gap-1.5 px-4 border-r border-[#f0ebe3]">
                <div className="h-3 rounded bg-[#e8e2d8] animate-pulse" style={{ width: `${40 + (i % 3) * 12}%` }} />
                <div className="h-2.5 w-20 rounded bg-[#f5f0e8] animate-pulse" />
              </div>
              {/* Ville */}
              <div className="flex items-center px-4 border-r border-[#f0ebe3]">
                <div className="h-3 w-16 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
              {/* Créé le */}
              <div className="flex items-center px-4 border-r border-[#f0ebe3]">
                <div className="h-3 w-20 rounded bg-[#e8e2d8] animate-pulse" />
              </div>
              {/* Actions */}
              <div className="flex items-center justify-center gap-1.5 px-3">
                <div className="w-8 h-8 rounded-full bg-[#f5f0e8] animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-[#f5f0e8] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-8 w-8 rounded-full bg-[#e8e2d8] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[#f5f0e8] animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-[#e8e2d8] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
