export default function ProspectionLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,rgba(255,255,255,.72) 0%,rgba(250,248,245,.96) 42%),#faf8f5" }}>
      <style>{`
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        .sk{animation:sk 1.5s ease-in-out infinite;}
        @media(max-width:860px){
          .prosp-controls{grid-template-columns:1fr!important;gap:8px!important;padding:12px 14px!important;}
          .prosp-header{padding:14px 14px 12px!important;}
          .prosp-actions{flex-direction:column!important;gap:8px!important;}
        }
      `}</style>

      {/* Header */}
      <div className="prosp-header" style={{ flexShrink: 0, padding: "clamp(18px,3vw,28px) clamp(16px,3vw,32px) clamp(16px,2vw,22px)", background: "linear-gradient(180deg,#ffffff 0%,#fbfaf7 100%)", borderBottom: "1px solid #e8e2d8" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sk" style={{ height: 10, width: 100, borderRadius: 5, background: "#e8d8b4" }} />
            <div className="sk" style={{ height: 28, width: 220, borderRadius: 8, background: "#e8e2d8" }} />
            <div className="sk" style={{ height: 12, width: 260, borderRadius: 5, background: "#f0ebe3" }} />
          </div>
          <div className="prosp-actions" style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <div className="sk" style={{ height: 40, width: 84, borderRadius: 9999, background: "#e8e2d8" }} />
            <div className="sk" style={{ height: 40, width: 140, borderRadius: 9999, background: "#e8e2d8" }} />
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="prosp-controls" style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "minmax(260px,1fr) minmax(210px,250px) auto", gap: 12, alignItems: "center", padding: "14px clamp(16px,3vw,32px)", borderBottom: "1px solid #e8e2d8", background: "rgba(255,255,255,.82)" }}>
        <div className="sk" style={{ height: 40, borderRadius: 9999, background: "#e8e2d8" }} />
        <div className="sk" style={{ height: 40, borderRadius: 9999, background: "#e8e2d8" }} />
        <div className="sk" style={{ height: 40, width: 200, borderRadius: 9999, background: "#f5f0e8" }} />
      </div>

      {/* Planning sections */}
      <div style={{ flex: 1, overflowY: "auto", padding: "clamp(16px,3vw,28px) clamp(16px,3vw,32px) 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }}>
          {[3, 2, 2, 1].map((count, si) => (
            <div key={si} style={{ padding: 16, border: "1px solid #e8e2d8", borderRadius: 12, background: "rgba(255,255,255,.78)", boxShadow: "0 10px 28px rgba(26,46,30,.045)" }}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div className="sk" style={{ width: 8, height: 8, borderRadius: "50%", background: "#d0c9be", flexShrink: 0 }} />
                <div className="sk" style={{ height: 10, width: 110, borderRadius: 5, background: "#e8e2d8", flex: 1 }} />
                <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
                <div className="sk" style={{ height: 20, width: 26, borderRadius: 6, background: "#f5f0e8" }} />
              </div>
              {/* Card skeletons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: count }).map((_, ci) => (
                  <div key={ci} className="sk" style={{ height: 88, borderRadius: 12, border: "1px solid #e8e2d8", background: "linear-gradient(180deg,#fff 0%,#fffdfa 100%)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
