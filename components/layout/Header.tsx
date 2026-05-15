"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 20, stroke = "currentColor", sw = 1.8 }: {
  d: string | string[]; size?: number; stroke?: string; sw?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const LEAF = ["M2 22 16 8", "M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"];
const BELL = ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(user: User): string {
  const name: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "";
  return name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function getDisplayName(user: User): string {
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Utilisateur";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch("/api/prospects/alerts")
      .then(r => r.json())
      .then(json => setAlertCount(json.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user ? getInitials(user) : "";
  const name = user ? getDisplayName(user) : "";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      height: 56,
      alignItems: "center", justifyContent: "space-between",
      padding: "0 18px",
      flexShrink: 0,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }} className="md:hidden flex">

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 34, height: 34, background: "#1a2e1e", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ic d={LEAF} size={16} stroke="white" sw={1.9} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#111827", letterSpacing: "-0.4px" }}>BTH Hub</span>
      </div>

      {/* Right zone */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

        {/* Bell */}
        <Link href="/prospection" style={{ position: "relative", width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
          <Ic d={BELL} size={19} />
          {alertCount > 0 && (
            <span style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, background: "#dc2626", borderRadius: "50%", border: "1.5px solid #fff" }} />
          )}
        </Link>

        {/* Avatar */}
        <div style={{ position: "relative" }} ref={ref}>
          <button onClick={() => setOpen(v => !v)} style={{
            width: 34, height: 34, borderRadius: "50%", background: "#1a2e1e", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer",
            fontFamily: "inherit",
          }}>
            {initials || <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,.3)" }} />}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: 220, background: "#fff", borderRadius: 14,
                  border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                  overflow: "hidden", zIndex: 200,
                }}
              >
                {/* User info */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a2e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                  </div>
                </div>

                {/* Links */}
                <div style={{ padding: "6px" }}>
                  {[
                    { href: "/profil", label: "Mon profil" },
                    { href: "/parametres", label: "Paramètres" },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                      display: "flex", alignItems: "center", padding: "9px 10px",
                      borderRadius: 8, textDecoration: "none", color: "#374151",
                      fontSize: 13, fontWeight: 500,
                    }}>
                      {label}
                    </Link>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", padding: "6px" }}>
                  <button onClick={handleSignOut} style={{
                    width: "100%", padding: "9px 10px", borderRadius: 8, border: "none",
                    background: "transparent", color: "#dc2626",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit",
                  }}>
                    Se déconnecter
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
