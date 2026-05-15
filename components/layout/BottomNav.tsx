"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { UserRole } from "@/types";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 20, stroke = "currentColor", sw = 1.7 }: {
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
  home:    ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  docs:    ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8"],
  users:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  map:     ["M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z", "M8 2v18", "M16 6v18"],
  wallet:  ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"],
};

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: keyof typeof ICONS; roles: UserRole[] };

const NAV: NavItem[] = [
  { href: "/dashboard",   label: "Accueil",  icon: "home",   roles: ["admin", "charge_projet"] },
  { href: "/soumissions", label: "Offres",   icon: "docs",   roles: ["admin", "charge_projet"] },
  { href: "/clients",     label: "Clients",  icon: "users",  roles: ["admin", "charge_projet", "commercial"] },
  { href: "/prospection", label: "Prosp.",   icon: "map",    roles: ["admin", "commercial"] },
  { href: "/depenses",    label: "Dép.",     icon: "wallet", roles: ["admin", "charge_projet", "commercial"] },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visible = NAV.filter(item => item.roles.includes(role));

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff",
      borderTop: "1px solid #e5e7eb",
      alignItems: "center",
      padding: "8px 4px 16px",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }} className="md:hidden flex">
      {visible.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} style={{ flex: 1, textDecoration: "none" }}>
            <motion.div whileTap={{ scale: 0.88 }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "4px 0", minHeight: 44,
              color: active ? "#1a2e1e" : "#9ca3af",
            }}>
              <div style={{
                width: 34, height: 26,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8,
                background: active ? "#edf5ee" : "transparent",
                transition: "background .12s",
              }}>
                <Ic d={ICONS[icon]} size={19} sw={active ? 2 : 1.6} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
