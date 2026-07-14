"use client";

import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { StatutSoumission } from "@/types";
import { ST, I } from "../constants";
import { Ic } from "./Ic";

export function FilterDropdown({ active, set, counts }: {
  active: StatutSoumission | null;
  set: (v: StatutSoumission | null) => void;
  counts: Partial<Record<StatutSoumission, number>>;
}) {
  const [open, setOpen] = useState(false);
  const opts: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];
  return (
    <div className="submission-filter-wrap" style={{ position: "relative" }}>
      <motion.button whileTap={{ scale: .96 }} onClick={() => setOpen(o => !o)} style={{
        height: 36, padding: "0 13px", borderRadius: 9999,
        border: `1.5px solid ${active ? "#1a2e1e" : "#e5e7eb"}`,
        background: active ? "#edf5ee" : "white",
        color: active ? "#1a2e1e" : "#6b7280",
        fontWeight: 500, fontSize: 13,
        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
      }}>
        <Ic d={I.filter} z={13} />
        Statut
        {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a2e1e" }} />}
        <Ic d={I.chevD} z={12} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .15 }}
              style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                boxShadow: "0 8px 32px rgba(0,0,0,.10)", minWidth: 190, padding: 6,
              }}>
              <button onClick={() => { set(null); setOpen(false); }} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
                background: !active ? "#edf5ee" : "transparent",
                color: !active ? "#1a2e1e" : "#6b7280",
                fontSize: 13, fontWeight: !active ? 600 : 400,
                textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
              }}>
                Tous les statuts {!active && <Ic d={I.check} z={12} />}
              </button>
              {opts.map(o => {
                const c = ST[o]; const sel = active === o;
                return (
                  <button key={o} onClick={() => { set(sel ? null : o); setOpen(false); }} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
                    background: sel ? "#edf5ee" : "transparent",
                    color: sel ? "#1a2e1e" : "#6b7280",
                    fontSize: 13, fontWeight: sel ? 600 : 400,
                    textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
                      {o}
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>({counts[o] ?? 0})</span>
                    </span>
                    {sel && <Ic d={I.check} z={12} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
