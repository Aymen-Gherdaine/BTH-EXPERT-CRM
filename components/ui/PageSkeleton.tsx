import { PulseBox } from "./PulseBox";

// ─── Dashboard skeleton ───────────────────────────────────────────────────────

const CHART_BAR_HEIGHTS = [70, 45, 85, 60, 95, 50, 75, 40, 90, 65, 80, 55];

function DashboardSkeleton() {
  return (
    <>
      <div className="h-[120px] bg-bth-green-800 flex-shrink-0">
        <div className="p-6 space-y-2">
          <PulseBox className="h-5 w-36 opacity-30" />
          <PulseBox className="h-8 w-56 opacity-20" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
              <PulseBox className="h-3 w-16" />
              <PulseBox className="h-7 w-20" />
              <PulseBox className="h-3 w-12" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <PulseBox className="h-4 w-32 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <PulseBox className="h-3 w-10 flex-shrink-0" />
                <PulseBox className="h-3 flex-1" />
                <PulseBox className="h-5 w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <PulseBox className="h-4 w-32 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <PulseBox className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <PulseBox className="h-3 w-3/4" />
                  <PulseBox className="h-2.5 w-1/2" />
                </div>
                <PulseBox className="h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <PulseBox className="h-6 w-44" />
          <PulseBox className="h-3.5 w-32" />
        </div>
        <PulseBox className="h-9 w-28 rounded-bth-md" />
      </div>

      <div className="flex gap-2">
        <PulseBox className="h-9 flex-1 max-w-xs rounded-bth-md" />
        {[...Array(3)].map((_, i) => (
          <PulseBox key={i} className="h-9 w-24 rounded-bth-md" />
        ))}
      </div>

      <div className="bg-white border border-bth-n-100 rounded-bth-lg overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-bth-n-100 bg-bth-n-50">
          {[...Array(cols)].map((_, i) => (
            <PulseBox key={i} className="h-3 flex-1" />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-bth-n-100 last:border-0">
            {[...Array(cols)].map((_, j) => (
              <PulseBox key={j} className={`h-4 flex-1 ${j === 0 ? "max-w-[140px]" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card grid skeleton ───────────────────────────────────────────────────────

function CardGridSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <PulseBox className="h-6 w-40" />
        <PulseBox className="h-9 w-32 rounded-bth-md" />
      </div>

      <div className="flex gap-2 border-b border-bth-n-100 pb-0">
        {[...Array(4)].map((_, i) => (
          <PulseBox key={i} className={`h-8 w-24 rounded-t-md ${i === 0 ? "opacity-100" : "opacity-50"}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <PulseBox className="h-5 w-32" />
              <PulseBox className="h-5 w-16 rounded-full" />
            </div>
            <PulseBox className="h-3.5 w-24" />
            <PulseBox className="h-3 w-full" />
            <PulseBox className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <PulseBox className="h-7 flex-1 rounded-bth-md" />
              <PulseBox className="h-7 w-16 rounded-bth-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <PulseBox className="h-6 w-40" />
        <PulseBox className="h-9 w-36 rounded-bth-md" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-bth-n-100 rounded-bth-lg p-4 space-y-2">
            <PulseBox className="h-3 w-20" />
            <PulseBox className="h-8 w-28" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-bth-n-100 rounded-bth-lg p-4">
        <PulseBox className="h-4 w-32 mb-4" />
        <div className="flex items-end gap-3 h-40">
          {CHART_BAR_HEIGHTS.map((h, i) => (
            <PulseBox key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

type Variant = "dashboard" | "table" | "cards" | "chart";

export function PageSkeleton({ variant = "table" }: { variant?: Variant }) {
  return (
    <>
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "table"     && <TableSkeleton />}
      {variant === "cards"     && <CardGridSkeleton />}
      {variant === "chart"     && <ChartSkeleton />}
    </>
  );
}
