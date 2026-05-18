"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { UserRole } from "@/types";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 20, sw = 1.7 }: { d: string | string[]; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const ICONS = {
  home:   ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  docs:   ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8"],
  users:  ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  map:    ["M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z", "M8 2v18", "M16 6v18"],
  wallet: ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"],
  chart:  ["M18 20v-10", "M12 20V4", "M6 20v-6"],
  admin:  ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
  more:   ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
  x:      "M18 6 6 18M6 6l12 12",
  profil: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  cog:    ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 2v2", "M12 20v2", "M4.93 4.93l1.41 1.41", "M17.66 17.66l1.41 1.41", "M2 12h2", "M20 12h2", "M4.93 19.07l1.41-1.41", "M17.66 6.34l1.41-1.41"],
};

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: keyof typeof ICONS; roles: UserRole[] };

// Primary items shown directly in the bar (max 4)
const PRIMARY: NavItem[] = [
  { href: "/dashboard",   label: "Accueil",  icon: "home",  roles: ["admin", "charge_projet"] },
  { href: "/soumissions", label: "Offres",   icon: "docs",  roles: ["admin", "charge_projet"] },
  { href: "/clients",     label: "Clients",  icon: "users", roles: ["admin", "charge_projet", "commercial"] },
  { href: "/prospection", label: "Prosp.",   icon: "map",   roles: ["admin", "commercial"] },
];

// Overflow items shown in the "Plus" drawer
const OVERFLOW: NavItem[] = [
  { href: "/depenses",           label: "Dépenses",       icon: "wallet", roles: ["admin", "charge_projet", "commercial"] },
  { href: "/couts-marges",       label: "Coûts & Marges", icon: "chart",  roles: ["admin"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs",   icon: "admin",  roles: ["admin"] },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [plusOpen, setPlusOpen] = useState(false);

  const primaryItems = PRIMARY.filter(i => i.roles.includes(role));
  const overflowItems = OVERFLOW.filter(i => i.roles.includes(role));

  // Close drawer on route change
  useEffect(() => { setPlusOpen(false); }, [pathname]);

  async function handleSignOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Bottom nav bar — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-bth-hairline
                      flex md:hidden">
        {primaryItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className="flex-1 no-underline">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={[
                  "flex flex-col items-center justify-end gap-1 pb-2 pt-1",
                  "min-h-[48px] border-t-2 transition-colors duration-100",
                  active
                    ? "text-bth-green-800 border-bth-green-800"
                    : "text-bth-n-400 border-transparent hover:text-bth-n-700",
                ].join(" ")}
              >
                <Ic d={ICONS[icon]} size={20} sw={active ? 2 : 1.6} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* Plus button — always shown */}
        <button
          onClick={() => setPlusOpen(true)}
          className="flex-1 border-none bg-transparent cursor-pointer p-0"
        >
          <div className={[
            "flex flex-col items-center justify-end gap-1 pb-2 pt-1",
            "min-h-[48px] border-t-2 transition-colors duration-100",
            plusOpen
              ? "text-bth-green-800 border-bth-green-800"
              : "text-bth-n-400 border-transparent",
          ].join(" ")}>
            <Ic d={ICONS.more} size={20} sw={2.5} />
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </div>
        </button>
      </nav>

      {/* Plus drawer sheet */}
      <AnimatePresence>
        {plusOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setPlusOpen(false)}
              className="absolute inset-0 bg-[rgba(1,8,2,0.4)]"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[16px] overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-bth-n-300" />
              </div>

              {/* Close row */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[11px] font-semibold text-bth-n-400 uppercase tracking-[0.20em]">Menu</span>
                <button
                  onClick={() => setPlusOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-bth-sm
                             text-bth-n-500 hover:bg-bth-n-100 transition-colors duration-100 bth-focus"
                >
                  <Ic d={ICONS.x} size={16} sw={2} />
                </button>
              </div>

              {/* Overflow nav items */}
              {overflowItems.length > 0 && (
                <div className="px-3 pb-2">
                  {overflowItems.map(({ href, label, icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <Link key={href} href={href} onClick={() => setPlusOpen(false)}
                        className="no-underline block">
                        <div className={[
                          "flex items-center gap-3 px-3 py-[11px] rounded-bth-sm text-[14px] font-medium min-h-[48px]",
                          active
                            ? "bg-bth-green-50 text-bth-green-800"
                            : "text-bth-n-700 hover:bg-bth-n-50 transition-colors duration-100",
                        ].join(" ")}>
                          <span className={active ? "text-bth-green-700" : "text-bth-n-400"}>
                            <Ic d={ICONS[icon]} size={20} sw={1.8} />
                          </span>
                          {label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-bth-hairline mx-4" />

              {/* Profile / Settings / Logout */}
              <div className="px-3 py-2">
                {[
                  { href: "/profil",     label: "Mon profil",  icon: "profil" as const },
                  { href: "/parametres", label: "Paramètres",  icon: "cog"    as const },
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href} onClick={() => setPlusOpen(false)}
                    className="no-underline block">
                    <div className="flex items-center gap-3 px-3 py-[11px] rounded-bth-sm text-[14px]
                                    font-medium text-bth-n-700 hover:bg-bth-n-50 transition-colors duration-100 min-h-[48px]">
                      <span className="text-bth-n-400">
                        <Ic d={ICONS[icon]} size={20} sw={1.8} />
                      </span>
                      {label}
                    </div>
                  </Link>
                ))}

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-[11px] rounded-bth-sm text-[14px]
                             font-medium min-h-[48px] text-left bth-focus
                             transition-colors duration-100"
                  style={{ color: "var(--color-bth-error)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bth-n-50)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Se déconnecter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
