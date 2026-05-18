"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { UserRole } from "@/types";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 22, sw = 1.7 }: { d: string | string[]; size?: number; sw?: number }) {
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
  wallet: ["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"],
  map:    ["M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z", "M8 2v18", "M16 6v18"],
  chart:  ["M18 20v-10", "M12 20V4", "M6 20v-6"],
  admin:  ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
  more:   ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
  x:      "M18 6 6 18M6 6l12 12",
};

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: keyof typeof ICONS; roles: UserRole[] };

const PRIMARY: NavItem[] = [
  { href: "/dashboard",   label: "Accueil",  icon: "home",   roles: ["admin", "charge_projet"] },
  { href: "/soumissions", label: "Offres",   icon: "docs",   roles: ["admin", "charge_projet"] },
  { href: "/clients",     label: "Clients",  icon: "users",  roles: ["admin", "charge_projet", "commercial"] },
  { href: "/depenses",    label: "Finance",  icon: "wallet", roles: ["admin", "charge_projet"] },
];

const SHEET_ITEMS: NavItem[] = [
  { href: "/prospection",        label: "Prospection",    icon: "map",    roles: ["admin", "commercial"] },
  { href: "/depenses",           label: "Dépenses",       icon: "wallet", roles: ["admin", "charge_projet", "commercial"] },
  { href: "/couts-marges",       label: "Coûts & Marges", icon: "chart",  roles: ["admin"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs",   icon: "admin",  roles: ["admin"] },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const primaryItems = PRIMARY.filter(i => i.roles.includes(role));
  const sheetItems = SHEET_ITEMS.filter(i => i.roles.includes(role));

  useEffect(() => { setSheetOpen(false); }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [sheetOpen]);

  return (
    <>
      {/* Bottom navigation bar — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-bth-hairline flex md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="flex-1 no-underline">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={[
                  "relative flex flex-col items-center justify-center gap-[3px] min-h-[56px]",
                  active ? "text-bth-green-800" : "text-bth-n-400",
                ].join(" ")}
              >
                {/* Active pill — top center, 2px × 20px */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-bth-green-800" />
                )}
                <Ic d={ICONS[icon]} size={22} sw={active ? 2 : 1.6} />
                <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* Plus button — always shown */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex-1 border-none bg-transparent cursor-pointer p-0"
        >
          <div className={[
            "relative flex flex-col items-center justify-center gap-[3px] min-h-[56px]",
            sheetOpen ? "text-bth-green-800" : "text-bth-n-400",
          ].join(" ")}>
            {sheetOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-bth-green-800" />
            )}
            <Ic d={ICONS.more} size={22} sw={2.2} />
            <span className={`text-[10px] leading-none ${sheetOpen ? "font-semibold" : "font-medium"}`}>
              Plus
            </span>
          </div>
        </button>
      </nav>

      {/* Plus bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSheetOpen(false)}
              className="absolute inset-0 bg-[rgba(1,8,2,0.4)] backdrop-blur-[2px]"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[16px]"
              style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-bth-n-200" />
              </div>

              {/* Title row */}
              <div className="flex items-center justify-between px-4 pt-3 pb-4">
                <span className="text-[16px] font-semibold text-bth-green-800">Menu</span>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-bth-sm
                             text-bth-n-500 hover:bg-bth-n-100 transition-colors duration-100 bth-focus"
                >
                  <Ic d={ICONS.x} size={16} sw={2} />
                </button>
              </div>

              {/* Nav items */}
              {sheetItems.length > 0 && (
                <div className="px-4">
                  {sheetItems.map(({ href, label, icon }, idx) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    const isLast = idx === sheetItems.length - 1;
                    return (
                      <Link key={href} href={href} onClick={() => setSheetOpen(false)}
                        className="no-underline block">
                        <motion.div
                          whileTap={{ backgroundColor: "#f5f0e8" }}
                          className={[
                            "flex items-center gap-3 px-2 py-[14px] text-bth-green-800",
                            "transition-colors duration-100 hover:bg-bth-n-50",
                            !isLast ? "border-b border-bth-hairline" : "",
                          ].join(" ")}
                        >
                          <Ic d={ICONS[icon]} size={20} sw={active ? 2 : 1.7} />
                          <span className={`text-[15px] ${active ? "font-semibold" : "font-medium"}`}>
                            {label}
                          </span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
