"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { UserProfile, UserRole } from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  admin:          "Administrateur",
  charge_projet:  "Expert",
  commercial:     "Commercial",
};

const ROLE_BADGE: Record<UserRole, string> = {
  admin:          "bg-bth-green-800 text-white",
  charge_projet:  "bg-[#eef5f8] text-[#2f6689] border border-[#cbdde8]",
  commercial:     "bg-bth-gold-50 text-bth-gold-700 border border-bth-gold-200",
};

const ROLE_CARD: Record<UserRole, { border: string; bg: string; icon: React.ReactNode; desc: string }> = {
  admin: {
    border: "border-[#1a2e1e]",
    bg:     "bg-[#1a2e1e]",
    desc:   "Accès complet à toutes les fonctionnalités",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  charge_projet: {
    border: "border-blue-600",
    bg:     "bg-blue-600",
    desc:   "Accès complet sauf création de soumissions et gestion des utilisateurs",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  commercial: {
    border: "border-orange-500",
    bg:     "bg-orange-500",
    desc:   "Module Prospection uniquement",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function nameFromEmail(email: string | null): string {
  if (!email) return "Utilisateur";
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return email;
  return local.replace(/\b\w/g, (m) => m.toUpperCase());
}

function userDisplayName(user: UserProfile): string {
  return user.full_name?.trim() || nameFromEmail(user.email);
}

function UserAvatar({ user }: { user: UserProfile }) {
  const [failed, setFailed] = useState(false);
  const name = userDisplayName(user);
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (user.avatar_url && !failed) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        onError={() => setFailed(true)}
        className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-bth-hairline shadow-[0_8px_18px_rgba(26,46,30,.10)] bg-bth-green-800"
      />
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 border border-bth-green-700 shadow-[0_8px_18px_rgba(26,46,30,.12)]"
      style={{ backgroundColor: "#1a2e1e" }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <motion.span
      layout
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ROLE_BADGE[role]}`}
    >
      {ROLE_LABELS[role]}
    </motion.span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean | null }) {
  const active = isActive !== false;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      active ? "bg-[#ecfdf3] text-bth-green-700 border border-bth-green-200" : "bg-bth-n-100 text-bth-n-500 border border-bth-hairline"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-bth-success" : "bg-bth-n-400"}`} />
      {active ? "Actif" : "Inactif"}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UtilisateursPage() {
  const [users,          setUsers]          = useState<UserProfile[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [currentUserId,  setCurrentUserId]  = useState<string | null>(null);

  // Inline role editing
  const [editingRoleId,    setEditingRoleId]    = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<UserRole>("commercial");
  const [savingId,         setSavingId]         = useState<string | null>(null);
  const [savedId,          setSavedId]          = useState<string | null>(null);

  // Actions menu
  const [menuId,  setMenuId]  = useState<string | null>(null);
  const menuRef               = useRef<HTMLDivElement>(null);

  // Invite modal
  const [inviteModal,   setInviteModal]   = useState(false);
  const [inviteForm,    setInviteForm]    = useState<{ full_name: string; email: string; role: UserRole | "" }>({
    full_name: "", email: "", role: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError,   setInviteError]   = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
    fetchUsers();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    }
    if (menuId) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.data ?? []);
    }
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function startEditRole(user: UserProfile) {
    setEditingRoleId(user.id);
    setEditingRoleValue(user.role);
    setMenuId(null);
  }

  async function handleSaveRole(userId: string) {
    setSavingId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editingRoleValue }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: editingRoleValue } : u));
      setSavedId(userId);
      setTimeout(() => setSavedId(null), 1500);
      showToast("Rôle mis à jour", "success");
    } else {
      const json = await res.json();
      showToast(json.error || "Erreur lors de la mise à jour", "error");
    }
    setSavingId(null);
    setEditingRoleId(null);
  }

  async function handleToggleActive(userId: string, currentActive: boolean | null) {
    const willDeactivate = currentActive !== false;
    setMenuId(null);

    if (willDeactivate) {
      if (!confirm("Désactiver cet utilisateur ? Il ne pourra plus se connecter.")) return;
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: false } : u));
        showToast("Utilisateur désactivé", "success");
      } else {
        const json = await res.json();
        showToast(json.error || "Erreur", "error");
      }
    } else {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: true } : u));
        showToast("Utilisateur réactivé", "success");
      } else {
        const json = await res.json();
        showToast(json.error || "Erreur", "error");
      }
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteForm.role) { setInviteError("Veuillez sélectionner un rôle"); return; }
    setInviteLoading(true);
    setInviteError(null);

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    const json = await res.json();

    if (res.ok) {
      setInviteModal(false);
      setInviteForm({ full_name: "", email: "", role: "" });
      if (json.data) {
        setUsers((prev) => [json.data, ...prev]);
      } else {
        await fetchUsers();
      }
      showToast("Invitation envoyée avec succès", "success");
    } else {
      setInviteError(json.error || "Erreur lors de l'invitation");
    }
    setInviteLoading(false);
  }

  const activeCount = users.filter((u) => u.is_active !== false).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const commercialCount = users.filter((u) => u.role === "commercial").length;
  const projectCount = users.filter((u) => u.role === "charge_projet").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-bth-canvas px-4 py-5 sm:px-6 md:px-8 md:py-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] uppercase text-bth-gold-600 mb-2">
            <span className="h-px w-7 bg-bth-gold-500" />
            Administration
          </div>
          <h1 className="font-display text-[32px] leading-[1.05] font-semibold text-bth-n-900 md:text-[40px]">Gestion des utilisateurs</h1>
          <p className="text-sm text-bth-n-500 mt-2">
            {loading ? "…" : `${activeCount} utilisateur${activeCount !== 1 ? "s" : ""} actif${activeCount !== 1 ? "s" : ""} · ${users.length} au total`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setInviteForm({ full_name: "", email: "", role: "" }); setInviteModal(true); }}
          className="flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white cursor-pointer flex-shrink-0 shadow-[0_14px_32px_rgba(26,46,30,.18)] bth-focus"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="hidden sm:inline">Inviter un utilisateur</span>
          <span className="sm:hidden">Inviter</span>
        </motion.button>
      </div>

      {/* ── Users Table ── */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-3">
          {[
            { label: "Administrateurs", value: adminCount, tone: "text-bth-green-800", bg: "bg-white" },
            { label: "Commerciaux", value: commercialCount, tone: "text-bth-gold-700", bg: "bg-bth-gold-50" },
            { label: "Chargés projet", value: projectCount, tone: "text-[#2f6689]", bg: "bg-[#eef5f8]" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-2xl border border-bth-hairline px-4 py-3 shadow-[var(--bth-shadow-sm)]`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-bth-n-400">{item.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-bth-hairline shadow-[var(--bth-shadow-sm)] overflow-hidden">
          <div className="px-6 py-3 bg-bth-n-100 border-b border-bth-hairline h-12 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-56 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-bth-hairline shadow-[var(--bth-shadow-sm)] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bth-n-100 text-bth-n-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-bth-n-500 text-sm">Aucun utilisateur trouvé</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-bth-hairline shadow-[0_18px_46px_rgba(26,46,30,.07)] overflow-visible"
        >
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[2.5fr_2fr_1.5fr_120px_52px] gap-0 px-6 py-3 bg-bth-n-100 border-b border-bth-hairline rounded-t-2xl">
            <span className="text-[11px] font-semibold text-bth-n-500 uppercase tracking-[0.12em]">Utilisateur</span>
            <span className="text-[11px] font-semibold text-bth-n-500 uppercase tracking-[0.12em]">Email</span>
            <span className="text-[11px] font-semibold text-bth-n-500 uppercase tracking-[0.12em]">Rôle</span>
            <span className="text-[11px] font-semibold text-bth-n-500 uppercase tracking-[0.12em]">Statut</span>
            <span />
          </div>

          {/* Rows */}
          <AnimatePresence initial>
            {users.map((u, i) => {
              const isCurrentUser = u.id === currentUserId;
              const isEditing     = editingRoleId === u.id;
              const isSaving      = savingId === u.id;
              const justSaved     = savedId === u.id;

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="group border-b border-bth-hairline last:border-0"
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-[2.5fr_2fr_1.5fr_120px_52px] gap-0 items-center px-6 py-4 hover:bg-bth-n-50 transition-colors">

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <UserAvatar user={u} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-bth-n-900 truncate">
                          {userDisplayName(u)}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-bth-n-500 bg-bth-n-100 rounded-full px-1.5 py-0.5 font-medium">
                            Votre compte
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="min-w-0 pr-4">
                      <p className="text-sm text-bth-n-500 truncate">{u.email || "—"}</p>
                    </div>

                    {/* Role — inline edit or badge */}
                    <div className="pr-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              value={editingRoleValue}
                              onChange={(e) => setEditingRoleValue(e.target.value as UserRole)}
                              className="appearance-none pl-2.5 pr-7 py-1.5 border border-bth-hairline-strong rounded-full text-xs text-bth-n-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer"
                            >
                              <option value="admin">Administrateur</option>
                              <option value="charge_projet">Expert</option>
                              <option value="commercial">Commercial</option>
                            </select>
                            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSaveRole(u.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
                            style={{ backgroundColor: "#1a2e1e" }}
                          >
                            {isSaving ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </motion.button>
                          <button
                            onClick={() => setEditingRoleId(null)}
                            className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <RoleBadge role={u.role} />
                          <AnimatePresence>
                            {justSaved && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                className="text-emerald-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <StatusBadge isActive={u.is_active} />

                    {/* Actions */}
                    <div className="relative flex justify-center" ref={menuId === u.id ? menuRef : undefined}>
                      {isCurrentUser ? (
                        <span className="w-8 h-8" />
                      ) : (
                        <button
                          onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-bth-n-500 hover:text-bth-n-900 hover:bg-bth-n-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                          </svg>
                        </button>
                      )}

                      <AnimatePresence>
                        {menuId === u.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-9 z-50 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => startEditRole(u)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Changer le rôle
                            </button>
                            <div className="border-t border-gray-100 my-0.5" />
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                u.is_active !== false
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {u.is_active !== false ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Réactiver
                                </>
                              )}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3.5">
                    <UserAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-bth-n-900 truncate">
                          {userDisplayName(u)}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-bth-n-500 bg-bth-n-100 rounded-full px-1.5 py-0.5">
                            Vous
                          </span>
                        )}
                      </div>
                      {u.email && (
                        <p className="mt-0.5 truncate text-xs text-bth-n-500">{u.email}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <RoleBadge role={u.role} />
                        <StatusBadge isActive={u.is_active} />
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <div className="relative flex-shrink-0" ref={menuId === u.id ? menuRef : undefined}>
                        <button
                          onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-bth-n-500 hover:text-bth-n-900 hover:bg-bth-n-100 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                          </svg>
                        </button>
                        <AnimatePresence>
                          {menuId === u.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-10 z-50 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => startEditRole(u)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Changer le rôle
                              </button>
                              <div className="border-t border-gray-100" />
                              <button
                                onClick={() => handleToggleActive(u.id, u.is_active)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${
                                  u.is_active !== false ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {u.is_active !== false ? "Désactiver" : "Réactiver"}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Mobile inline role edit */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden px-4 pb-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                          <div className="relative flex-1">
                            <select
                              value={editingRoleValue}
                              onChange={(e) => setEditingRoleValue(e.target.value as UserRole)}
                              className="appearance-none w-full pl-3 pr-8 py-2 border border-bth-hairline-strong rounded-full text-sm text-bth-n-700 bg-white outline-none focus:border-[#1a2e1e] cursor-pointer"
                            >
                              <option value="admin">Administrateur</option>
                              <option value="charge_projet">Expert</option>
                              <option value="commercial">Commercial</option>
                            </select>
                            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <button
                            onClick={() => handleSaveRole(u.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
                            style={{ backgroundColor: "#1a2e1e" }}
                          >
                            {isSaving ? "…" : "Enregistrer"}
                          </button>
                          <button onClick={() => setEditingRoleId(null)}
                            className="px-3 py-2 rounded-full text-sm text-bth-n-500 hover:bg-bth-n-200 cursor-pointer">
                            Annuler
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Click-outside to close menu */}
      {menuId && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
      )}

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {inviteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setInviteModal(false); setInviteError(null); }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal — desktop center, mobile slide-up */}
            <motion.div
              initial={{ opacity: 0, y: "100%", scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 1 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50
                         bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg md:w-full overflow-hidden"
            >
              {/* Handle bar mobile */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inviter un utilisateur</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Un email d'invitation sera envoyé</p>
                </div>
                <button
                  onClick={() => { setInviteModal(false); setInviteError(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-bth-n-500 hover:text-bth-n-900 hover:bg-bth-n-100 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInvite} className="px-6 py-5 space-y-5">

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="invite-name">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invite-name"
                    type="text"
                    required
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Ex : Karim Benali"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1a2e1e] transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="invite-email">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@entreprise.dz"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1a2e1e] transition-colors"
                  />
                </div>

                {/* Role cards */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">
                    Rôle <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(["admin", "charge_projet", "commercial"] as UserRole[]).map((r) => {
                      const cfg     = ROLE_CARD[r];
                      const selected = inviteForm.role === r;
                      return (
                        <motion.button
                          key={r}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setInviteForm((f) => ({ ...f, role: r }))}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                            selected
                              ? `${cfg.border} ${cfg.bg} text-white shadow-md`
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className={selected ? "text-white" : "text-gray-400"}>
                            {cfg.icon}
                          </div>
                          <p className="text-xs font-semibold leading-tight">{ROLE_LABELS[r]}</p>
                          <p className={`text-xs leading-tight hidden sm:block ${selected ? "text-white/80" : "text-gray-400"}`}>
                            {cfg.desc}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {inviteError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
                    >
                      {inviteError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={inviteLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: "#1a2e1e" }}
                >
                  {inviteLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Envoyer l'invitation
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
