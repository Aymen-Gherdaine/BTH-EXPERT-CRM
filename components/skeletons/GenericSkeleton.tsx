// Skeleton générique (header + liste) pour les routes sans skeleton dédié.
export default function GenericSkeleton() {
  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f5 38%, #f7f2ea 100%)" }}
    >
      <div className="flex-shrink-0 px-[clamp(16px,3vw,40px)] pt-6 pb-[18px] border-b border-[#e8e2d8] bg-white/90">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 rounded bg-[#e8e2d8] animate-pulse" />
          <div className="h-7 w-48 rounded bg-[#e8e2d8] animate-pulse" />
          <div className="h-3.5 w-64 rounded bg-[#f5f0e8] animate-pulse" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-[clamp(16px,3vw,40px)] py-[18px]">
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[14px] border border-[#e8e2d8] bg-white px-[14px] animate-pulse"
              style={{ minHeight: 64 }}
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#e8e2d8] flex-shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-3 rounded bg-[#e8e2d8]" style={{ width: `${40 + (i % 4) * 12}%` }} />
                <div className="h-2.5 w-24 rounded bg-[#f5f0e8]" />
              </div>
              <div className="h-4 w-20 rounded bg-[#e8e2d8] flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
