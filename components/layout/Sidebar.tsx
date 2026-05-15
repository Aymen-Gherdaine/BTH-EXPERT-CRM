"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { UserRole } from "@/types";
import type { User } from "@supabase/supabase-js";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 18, stroke = "currentColor", sw = 1.7 }: {
  d: string | string[]; size?: number; stroke?: string; sw?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const ICONS = {
  leaf:    ["M2 22 16 8", "M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"],
  home:    ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  docs:    ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8"],
  users:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  map:     ["M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z", "M8 2v18", "M16 6v18"],
  wallet:  ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"],
  chart:   ["M18 20v-10", "M12 20V4", "M6 20v-6"],
  admin:   ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
  chevron: "M18 15l-6-6-6 6",
};

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: string; roles: UserRole[] };

const NAV: NavItem[] = [
  { href: "/dashboard",          label: "Tableau de bord",  icon: "home",   roles: ["admin", "charge_projet"] },
  { href: "/soumissions",        label: "Soumissions",      icon: "docs",   roles: ["admin", "charge_projet"] },
  { href: "/clients",            label: "Clients",          icon: "users",  roles: ["admin", "charge_projet", "commercial"] },
  { href: "/prospection",        label: "Prospection",      icon: "map",    roles: ["admin", "commercial"] },
  { href: "/depenses",           label: "Dépenses",         icon: "wallet", roles: ["admin", "charge_projet", "commercial"] },
  { href: "/couts-marges",       label: "Coûts & Marges",   icon: "chart",  roles: ["admin"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs",     icon: "admin",  roles: ["admin"] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrateur",
  charge_projet: "Chargé de projet",
  commercial: "Commercial",
};

function getInitials(user: User): string {
  const name: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "";
  return name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function getDisplayName(user: User): string {
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Utilisateur";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setOpen(false);
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

  const visible = NAV.filter(item => item.roles.includes(role));
  const initials = user ? getInitials(user) : "";
  const name = user ? getDisplayName(user) : "";
  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url;

  return (
    <aside style={{
      width: 228, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #e5e7eb",
      height: "100%",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }} className="hidden md:flex flex-col">

      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#1a2e1e", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic d={ICONS.leaf} size={17} stroke="white" sw={1.9} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-0.4px", lineHeight: 1 }}>BTH Hub</div>
            <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>BTH Expert</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 1 }}>
        {visible.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <motion.div whileTap={{ scale: 0.97 }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 8,
                background: active ? "#edf5ee" : "transparent",
                color: active ? "#1a2e1e" : "#6b7280",
                fontWeight: active ? 600 : 500, fontSize: 13.5,
                transition: "all .12s", cursor: "pointer",
              }}>
                <Ic d={ICONS[icon as keyof typeof ICONS]} size={17} sw={active ? 2 : 1.7} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User profile with dropdown */}
      <div style={{ padding: "14px", borderTop: "1px solid #e5e7eb", position: "relative" }} ref={profileRef}>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute", left: 10, right: 10, bottom: "calc(100% + 4px)",
                background: "#fff", borderRadius: 14,
                border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                overflow: "hidden", zIndex: 200,
              }}
            >
              {/* User info */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={name} width={34} height={34} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a2e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>
                      {initials}
                    </div>
                  )}
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

        {user ? (
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              width: "100%", background: "transparent", border: "none", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} width={34} height={34} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a2e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 11 }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{ROLE_LABEL[role]}</div>
            </div>
            <div style={{ color: "#9ca3af", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .15s" }}>
              <Ic d={ICONS.chevron} size={14} sw={2} />
            </div>
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f3f4f6" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, borderRadius: 5, background: "#f3f4f6", marginBottom: 5, width: "70%" }} />
              <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", width: "50%" }} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
