"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useSidebar } from "./SidebarContext";
import { NavSpinner } from "@/components/ui/NavSpinner";
import type { UserRole } from "@/types";
import type { User } from "@supabase/supabase-js";

// ─── Icons ───────────────────────────────────────────────────────────────────

function Ic({ d, size = 16, sw = 1.7, stroke = "currentColor" }: {
  d: string | string[]; size?: number; sw?: number; stroke?: string;
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
  chevron:  "M18 15l-6-6-6 6",
  x:        "M18 6 6 18M6 6l12 12",
  user:     ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  settings: ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 2v2", "M12 20v2", "M4.93 4.93l1.41 1.41", "M17.66 17.66l1.41 1.41", "M2 12h2", "M20 12h2", "M4.93 19.07l1.41-1.41", "M17.66 6.34l1.41-1.41"],
  logout:   ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
};

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavGroup = "PRINCIPAL" | "FINANCE" | "ADMINISTRATION";
type NavItem = { href: string; label: string; icon: keyof typeof ICONS; roles: UserRole[]; group: NavGroup };

const NAV: NavItem[] = [
  { href: "/dashboard",          label: "Tableau de bord", icon: "home",   roles: ["admin", "charge_projet", "commercial"], group: "PRINCIPAL"      },
  { href: "/soumissions",        label: "Soumissions",     icon: "docs",   roles: ["admin", "charge_projet", "commercial"], group: "PRINCIPAL"      },
  { href: "/clients",            label: "Clients",         icon: "users",  roles: ["admin", "charge_projet", "commercial"], group: "PRINCIPAL"      },
  { href: "/prospection",        label: "Prospection",     icon: "map",    roles: ["admin", "commercial"],                  group: "PRINCIPAL"      },
  { href: "/depenses",           label: "Dépenses",        icon: "wallet", roles: ["admin", "charge_projet", "commercial"], group: "FINANCE"        },
  { href: "/couts-marges",       label: "Coûts & Marges",  icon: "chart",  roles: ["admin"],                                group: "FINANCE"        },
  { href: "/admin/utilisateurs", label: "Utilisateurs",    icon: "admin",  roles: ["admin"],                                group: "ADMINISTRATION" },
];

const NAV_GROUPS: NavGroup[] = ["PRINCIPAL", "FINANCE", "ADMINISTRATION"];

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

type CurrentProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

// ─── SidebarInner ─────────────────────────────────────────────────────────────

function SidebarInner({
  role, user, profile, onNavClick, width,
}: {
  role: UserRole;
  user: User | null;
  profile: CurrentProfile | null;
  onNavClick?: () => void;
  width?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const visible = NAV.filter(item => item.roles.includes(role));
  const name = profile?.full_name || (user ? getDisplayName(user) : "");
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const email = profile?.email || user?.email || "";
  const initials = name
    ? name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : user ? getInitials(user) : "";

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const hKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", hKey);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", hKey);
    };
  }, [dropdownOpen]);

  async function handleSignOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const handleClick = (href: string) => {
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      {/* Logo zone — 64px, bg-white */}
      <div
        className="flex items-center gap-[10px] px-4 bg-white border-b border-bth-hairline flex-shrink-0"
        style={{ height: 64 }}
      >
        <span className="w-8 h-8 rounded-bth-md flex items-center justify-center flex-shrink-0 shadow-[0_8px_18px_rgba(26,46,30,.10)]"
          style={{ background: "#edf5ef", border: "1px solid #90bb9a" }}>
          <Ic d={ICONS.leaf} size={18} sw={2.35} stroke="#1a2e1e" />
        </span>
        <div>
          <div className="text-bth-green-800 font-semibold text-[13px] leading-none">
            BTH Hub
          </div>
          <div className="text-bth-n-500 font-normal text-[10.5px] mt-0.5">
            BTH Expert
          </div>
        </div>

        {/* Close button — drawer only (width > 240 = tablet drawer) */}
        {width && width > 240 && onNavClick && (
          <button
            onClick={onNavClick}
            className="ml-auto text-bth-n-400 hover:text-bth-n-700 transition-colors duration-100 bth-focus rounded-bth-sm p-1"
          >
            <Ic d={ICONS.x} size={16} stroke="currentColor" sw={2} />
          </button>
        )}
      </div>

      {/* Nav — flex-1 scrollable */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const items = visible.filter(i => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {/* Section label */}
              <div className="text-[8.5px] font-semibold text-bth-n-400 tracking-[0.24em] uppercase px-4 pt-5 pb-1.5">
                {group}
              </div>

              {/* Items */}
              {items.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/") || pendingHref === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onMouseEnter={() => router.prefetch(href)}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      handleClick(href);
                      onNavClick?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    aria-busy={isPending && pendingHref === href ? true : undefined}
                    className="block no-underline mx-2"
                  >
                    <div className={[
                      "flex items-center gap-[10px] py-2 rounded-bth-sm text-[12.5px]",
                      active
                        ? "bg-bth-green-50 text-bth-green-800 font-semibold border-l-2 border-bth-gold-500 pl-[10px] pr-3"
                        : "text-bth-green-800 font-normal px-3 hover:bg-bth-n-100 transition-colors duration-100",
                    ].join(" ")}>
                      <span className="text-bth-green-700">
                        <Ic d={ICONS[icon]} size={16} sw={active ? 2 : 1.7} />
                      </span>
                      {label}
                      {isPending && pendingHref === href && (
                        <span className="ml-auto">
                          <NavSpinner />
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User zone */}
      <div className="border-t border-bth-hairline relative flex-shrink-0" ref={profileRef}>
        {/* Dropdown — opens upward, origin bottom-left */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: "bottom left", position: "absolute", bottom: "calc(100% + 8px)", left: 12, width: 224 }}
              className="bg-white border border-bth-n-200 rounded-bth-lg shadow-[var(--bth-shadow-lg)] overflow-hidden z-50"
            >
              {/* User info — 40px avatar, non-clickable */}
              <div className="flex items-center gap-[10px] px-4 py-3.5 border-b border-bth-hairline">
                <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name || "Utilisateur"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-bth-green-800 flex items-center justify-center text-white text-[13px] font-semibold">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-bth-n-900 truncate">{name}</div>
                  <div className="text-[11px] text-bth-n-400 truncate">{email}</div>
                </div>
              </div>

              {/* Nav links with icons */}
              <div className="p-1.5">
                {[
                  { href: "/profil", label: "Mon profil", icon: "user" as const },
                  ...(role === "commercial" ? [] : [{ href: "/parametres", label: "Paramètres", icon: "settings" as const }]),
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href}
                    onMouseEnter={() => router.prefetch(href)}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      handleClick(href);
                      setDropdownOpen(false);
                      onNavClick?.();
                    }}
                    aria-busy={isPending && pendingHref === href ? true : undefined}
                    className="flex items-center gap-[10px] px-[10px] py-[9px] rounded-bth-sm text-[13px]
                               font-medium text-bth-n-700 hover:bg-bth-n-50 transition-colors duration-100 no-underline">
                    <span className="text-bth-n-400 flex-shrink-0">
                      <Ic d={ICONS[icon]} size={15} sw={1.8} />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-bth-hairline my-1" />

              <div className="p-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-[10px] px-[10px] py-[9px] rounded-bth-sm text-[13px]
                             font-medium text-bth-error transition-colors duration-100 text-left bth-focus"
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,74,58,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <span className="text-bth-error flex-shrink-0">
                    <Ic d={ICONS.logout} size={15} sw={1.8} />
                  </span>
                  Se déconnecter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger button — 64px zone */}
        {user ? (
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-[15px]
                       hover:bg-bth-n-50 transition-colors duration-100 bth-focus"
          >
            {/* 34px avatar with online status dot */}
            <div className="relative flex-shrink-0">
              <div className="w-[34px] h-[34px] rounded-full overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || "Utilisateur"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-[34px] h-[34px] rounded-full bg-bth-green-800 flex items-center justify-center text-white text-[13px] font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-bth-success border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-medium text-bth-green-800 truncate">{name}</div>
              <div className="text-[11px] text-bth-n-500">{ROLE_LABEL[role]}</div>
            </div>
            <div className={`text-bth-n-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}>
              <Ic d={ICONS.chevron} size={14} sw={2} />
            </div>
          </button>
        ) : (
          /* Loading skeleton */
          <div className="flex items-center gap-3 px-4 py-[15px]">
            <div className="w-[34px] h-[34px] rounded-full bg-bth-n-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-[10px] bg-bth-n-100 rounded animate-pulse w-[70%]" />
              <div className="h-2 bg-bth-n-100 rounded animate-pulse w-[50%]" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar({ role }: { role: UserRole }) {
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(json => setProfile(json))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Desktop — fixed 240px, lg+ */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-bth-hairline h-full" style={{ width: 240 }}>
        <SidebarInner role={role} user={user} profile={profile} width={240} />
      </aside>

      {/* Tablet drawer — md to lg, controlled by SidebarContext */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[rgba(1,8,2,0.4)]"
            />
            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 left-0 bottom-0 flex flex-col bg-white shadow-[var(--bth-shadow-xl)]"
              style={{ width: 280 }}
            >
              <SidebarInner role={role} user={user} profile={profile} width={280} onNavClick={() => setIsOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
