"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useSidebar } from "./SidebarContext";
import type { User } from "@supabase/supabase-js";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 20, sw = 1.8 }: { d: string | string[]; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const LEAF = ["M2 22 16 8", "M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"];
const BELL = ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"];
const MENU = ["M3 12h18", "M3 6h18", "M3 18h18"];

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
  const { setIsOpen: setSidebarOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const h = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", h, { passive: true });
    return () => main.removeEventListener("scroll", h);
  }, []);

  async function handleSignOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user ? getInitials(user) : "";
  const name = user ? getDisplayName(user) : "";

  return (
    // Visible on mobile + tablet, hidden on desktop
    <header
      className={[
        "flex lg:hidden items-center justify-between px-4 flex-shrink-0",
        "border-b border-bth-hairline sticky top-0 z-30",
        "transition-[background-color,backdrop-filter] duration-200",
        scrolled ? "bg-white/90 backdrop-blur-[8px]" : "bg-white",
      ].join(" ")}
      style={{ height: 56 }}
    >

      {/* Left: hamburger (tablet only) + logo */}
      <div className="flex items-center gap-2">
        {/* Hamburger — tablet only (md to lg) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex lg:hidden items-center justify-center w-9 h-9 rounded-bth-sm
                     text-bth-n-500 hover:bg-bth-n-100 hover:text-bth-n-900
                     transition-colors duration-100 bth-focus"
          aria-label="Ouvrir le menu"
        >
          <Ic d={MENU} size={18} sw={1.8} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 text-bth-green-800">
          <Ic d={LEAF} size={18} sw={1.9} />
          <span className="font-semibold text-[15px] tracking-[0.1em]">BTH Hub</span>
        </div>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-1">
        {/* Bell */}
        <Link href="/prospection"
          className="relative w-9 h-9 rounded-bth-sm flex items-center justify-center
                     text-bth-n-500 hover:bg-bth-n-100 hover:text-bth-n-900
                     transition-colors duration-100 bth-focus">
          <Ic d={BELL} size={20} />
          {alertCount > 0 && (
            <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-bth-error rounded-full border-[1.5px] border-white" />
          )}
        </Link>

        {/* Avatar + dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-bth-green-800 border-none flex items-center justify-center
                       text-white font-semibold text-[12px] cursor-pointer bth-focus"
          >
            {initials || <div className="w-3.5 h-3.5 rounded-full bg-white/30" />}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white
                           border border-bth-n-200 rounded-bth-lg shadow-[var(--bth-shadow-md)]
                           overflow-hidden z-50"
              >
                {/* User info */}
                <div className="flex items-center gap-[10px] px-4 py-3.5 border-b border-bth-hairline">
                  <div className="w-8 h-8 rounded-full bg-bth-green-800 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-bth-n-900 truncate">{name}</div>
                    <div className="text-[11px] text-bth-n-400 truncate">{user?.email}</div>
                  </div>
                </div>

                {/* Nav links */}
                <div className="p-1.5">
                  {[
                    { href: "/profil",     label: "Mon profil"  },
                    { href: "/parametres", label: "Paramètres"  },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setOpen(false)}
                      className="flex items-center px-[10px] py-[9px] rounded-bth-sm text-[13px]
                                 font-medium text-bth-n-700 hover:bg-bth-n-50 transition-colors duration-100 no-underline">
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-bth-hairline p-1.5">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-[10px] py-[9px] rounded-bth-sm text-[13px]
                               font-medium text-bth-error hover:bg-bth-n-50 transition-colors duration-100 text-left bth-focus"
                  >
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
