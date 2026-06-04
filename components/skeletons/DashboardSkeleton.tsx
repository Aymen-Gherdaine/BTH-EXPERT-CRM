export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100%", background: "linear-gradient(180deg,#ffffff 0%,#faf8f5 34%,#f7f2ea 100%)" }}>
      <style>{`
        @keyframes sk { 0%,100%{opacity:1}50%{opacity:.45} }
        .sk { animation: sk 1.5s ease-in-out infinite; }
        @media (max-width: 639px) {
          .dash-exec { grid-template-columns: minmax(0,1fr) !important; }
          .dash-cards { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ padding: "22px clamp(16px,3vw,40px) 20px", background: "linear-gradient(135deg,#1a2e1e 0%,#1f4429 58%,#101c12 100%)", borderBottom: "1px solid rgba(201,169,110,.28)" }}>
        <div style={{ width: "min(100%,1540px)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="sk" style={{ width: 42, height: 42, borderRadius: 9999, background: "rgba(255,255,255,.15)", flexShrink: 0 }} />
            <div style={{ display: "grid", gap: 7 }}>
              <div className="sk" style={{ height: 10, width: 72, borderRadius: 5, background: "rgba(255,255,255,.15)" }} />
              <div className="sk" style={{ height: 13, width: 140, borderRadius: 5, background: "rgba(255,255,255,.18)" }} />
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <div className="sk" style={{ height: 10, width: 100, borderRadius: 5, background: "rgba(201,169,110,.35)", marginBottom: 9 }} />
            <div className="sk" style={{ height: 30, width: 260, borderRadius: 8, background: "rgba(255,255,255,.18)" }} />
            <div className="sk" style={{ height: 12, width: 340, borderRadius: 5, background: "rgba(255,255,255,.12)", marginTop: 9 }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px clamp(16px,3vw,40px) 96px", width: "min(100%,1540px)", margin: "0 auto" }}>
        {/* Executive row */}
        <div className="dash-exec" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.06fr) minmax(290px,.94fr)", gap: 14, marginBottom: 14 }}>
          {/* Panel */}
          <div className="sk" style={{ border: "1px solid #e8e2d8", background: "rgba(255,255,255,.88)", borderRadius: 16, padding: 18, minHeight: 220 }}>
            <div style={{ height: 10, width: 88, borderRadius: 5, background: "#e8e2d8", marginBottom: 9 }} />
            <div style={{ height: 22, width: 200, borderRadius: 8, background: "#e8e2d8", marginBottom: 16 }} />
            <div style={{ height: 28, width: 160, borderRadius: 8, background: "#e8e2d8", marginBottom: 10 }} />
            <div style={{ height: 12, width: "90%", borderRadius: 5, background: "#ede8e0" }} />
          </div>
          {/* KPI grid */}
          <div className="dash-cards" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sk" style={{ border: "1px solid #e8e2d8", background: "rgba(255,255,255,.88)", borderRadius: 16, padding: 15, minHeight: 96 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e8e2d8", marginBottom: 14 }} />
                <div style={{ height: 18, width: "65%", borderRadius: 7, background: "#e8e2d8" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ border: "1px solid #e8e2d8", background: "rgba(255,255,255,.88)", borderRadius: 16, overflow: "hidden" }}>
              <div className="sk" style={{ height: 50, background: "#f5f0e8", borderBottom: "1px solid #e8e2d8" }} />
              <div style={{ padding: "12px 16px", display: "grid", gap: 8 }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="sk" style={{ height: 52, borderRadius: 10, background: "#f0ebe3" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
