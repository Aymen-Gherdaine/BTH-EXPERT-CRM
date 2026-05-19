"use client";

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-bth-md bg-bth-n-100 ${className ?? ""}`}
      style={{ animation: "bth-pulse 1.6s ease-in-out infinite" }}
    />
  );
}

const pulseKeyframes = `
  @keyframes bth-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .45; }
  }
`;

// ─── Dashboard skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <>
      {/* Hero */}
      <div className="h-[120px] flex-shrink-0" style={{ background: "#1a2e1e" }}>
        <div className="p-6 space-y-2">
          <Pulse className="h-5 w-36 opacity-30" />
          <Pulse className="h-8 w-56 opacity-20" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
              <Pulse className="h-3 w-16" />
              <Pulse className="h-7 w-20" />
              <Pulse className="h-3 w-12" />
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <Pulse className="h-4 w-32 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Pulse className="h-3 w-10 flex-shrink-0" />
                <Pulse className="h-3 flex-1" />
                <Pulse className="h-5 w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <Pulse className="h-4 w-32 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Pulse className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3 w-3/4" />
                  <Pulse className="h-2.5 w-1/2" />
                </div>
                <Pulse className="h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Table skeleton (soumissions, clients, dépenses) ─────────────────────────

function TableSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-6 w-44" />
          <Pulse className="h-3.5 w-32" />
        </div>
        <Pulse className="h-9 w-28 rounded-bth-md" />
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        <Pulse className="h-9 flex-1 max-w-xs rounded-bth-md" />
        {[...Array(3)].map((_, i) => (
          <Pulse key={i} className="h-9 w-24 rounded-bth-md" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-bth-n-100 rounded-bth-lg overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-4 py-3 border-b border-bth-n-100 bg-bth-n-50">
          {[...Array(cols)].map((_, i) => (
            <Pulse key={i} className="h-3 flex-1" />
          ))}
        </div>
        {/* Data rows */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-bth-n-100 last:border-0">
            {[...Array(cols)].map((_, j) => (
              <Pulse key={j} className={`h-4 flex-1 ${j === 0 ? "max-w-[140px]" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card grid skeleton (prospection) ────────────────────────────────────────

function CardGridSkeleton() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Pulse className="h-6 w-40" />
        <Pulse className="h-9 w-32 rounded-bth-md" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 border-b border-bth-n-100 pb-0">
        {[...Array(4)].map((_, i) => (
          <Pulse key={i} className={`h-8 w-24 rounded-t-md ${i === 0 ? "opacity-100" : "opacity-50"}`} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Pulse className="h-5 w-32" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
            <Pulse className="h-3.5 w-24" />
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Pulse className="h-7 flex-1 rounded-bth-md" />
              <Pulse className="h-7 w-16 rounded-bth-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart skeleton (coûts-marges) ───────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <Pulse className="h-6 w-40" />
        <Pulse className="h-9 w-36 rounded-bth-md" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-2">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-8 w-28" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4">
        <Pulse className="h-4 w-32 mb-4" />
        <div className="flex items-end gap-3 h-40">
          {[70, 45, 85, 60, 95, 50, 75, 40, 90, 65, 80, 55].map((h, i) => (
            <Pulse key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Exports ─────────────────────────────────────────────────────────────────

type Variant = "dashboard" | "table" | "cards" | "chart";

export function PageSkeleton({ variant = "table" }: { variant?: Variant }) {
  return (
    <>
      <style>{pulseKeyframes}</style>
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "table"     && <TableSkeleton />}
      {variant === "cards"     && <CardGridSkeleton />}
      {variant === "chart"     && <ChartSkeleton />}
    </>
  );
}
