"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";
import type { User } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────

type ToastData = { type: "success" | "error"; message: string };

// ── Toast ─────────────────────────────────────────────────────

function Toast({ data }: { data: ToastData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 80 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 bg-bth-n-800 text-white px-5 py-3 rounded-bth-md
                 font-medium text-[13px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                 flex items-center gap-2 whitespace-nowrap"
    >
      {data.type === "success" ? (
        <svg className="w-4 h-4 text-bth-green-300 shrink-0" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" style={{ color: "var(--color-bth-error)" }} fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )}
      {data.message}
    </motion.div>
  );
}

// ── Icônes ────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getDisplayName(user: User): string {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Utilisateur";
}

// ── Avatar display ────────────────────────────────────────────

function AvatarDisplay({ url, name, size = 20 }: { url: string | null; name: string; size?: number }) {
  const px = `${size * 4}px`;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: px, height: px }} className="rounded-full object-cover" />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold text-2xl bg-bth-green-800"
      style={{ width: px, height: px }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Styles partagés ───────────────────────────────────────────

const inputCls =
  "w-full bg-white border border-bth-n-300 rounded-bth-md px-3 py-2.5 text-sm text-bth-n-900 " +
  "placeholder:text-bth-n-400 font-normal outline-none " +
  "focus:border-bth-green-800 focus:shadow-[0_0_0_3px_rgba(26,46,30,0.10)] " +
  "transition-[border-color,box-shadow] duration-150";

const inputDisabledCls =
  "w-full bg-bth-n-100 border border-bth-n-200 rounded-bth-md px-3 py-2.5 text-sm text-bth-n-400 cursor-not-allowed";

const labelCls = "block text-[13px] font-medium text-bth-n-700 mb-1.5";

const sectionTitleCls =
  "text-[10px] font-semibold text-bth-n-400 uppercase tracking-[0.20em]";

// ── Page ──────────────────────────────────────────────────────

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      setFullName(getDisplayName(user));
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
    });
  }, []);

  // ── Upload avatar ──────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError || !data) {
      setToast({ type: "error", message: "Échec de l'upload. Vérifiez le bucket Supabase Storage." });
      setAvatarPreview(null);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateError) {
      setToast({ type: "error", message: "Photo uploadée mais metadata non mise à jour." });
    } else {
      setAvatarUrl(publicUrl);
      setToast({ type: "success", message: "Photo de profil mise à jour." });
      router.refresh();
    }

    setUploadingAvatar(false);
  }

  // ── Sauvegarder informations ───────────────────────────────

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSavingInfo(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    setToast(error
      ? { type: "error", message: "Erreur lors de la sauvegarde." }
      : { type: "success", message: "Informations mises à jour." }
    );

    if (!error) router.refresh();
    setSavingInfo(false);
  }

  // ── Changer mot de passe ───────────────────────────────────

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setToast({ type: "error", message: "Erreur lors de la mise à jour du mot de passe." });
    } else {
      setToast({ type: "success", message: "Mot de passe mis à jour avec succès." });
      setPassword("");
      setConfirmPassword("");
    }

    setSavingPassword(false);
  }

  // ── Loading ────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-bth-green-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayAvatar = avatarPreview ?? avatarUrl;
  const displayName = fullName || getDisplayName(user);

  return (
    <div className="bg-bth-canvas min-h-full px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* En-tête de page */}
        <div>
          <h1 className="text-[22px] font-semibold text-bth-n-900 tracking-[-0.3px]">Mon profil</h1>
          <p className="text-[13px] text-bth-n-500 mt-0.5">
            Gérez vos informations personnelles et votre mot de passe.
          </p>
        </div>

        {/* ── Card 1 : Photo + Informations ── */}
        <div className="bg-white border border-bth-hairline rounded-bth-lg p-6 space-y-6 shadow-[var(--bth-shadow-sm)]">
          <p className={sectionTitleCls}>Informations personnelles</p>

          {/* Zone avatar cliquable */}
          <div className="flex items-center gap-5">
            <div
              className="relative cursor-pointer group flex-shrink-0"
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              role="button"
              aria-label="Changer la photo de profil"
            >
              <AvatarDisplay url={displayAvatar} name={displayName} size={20} />

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-bth-n-900/60
                              flex items-center justify-center text-white
                              opacity-0 group-hover:opacity-100
                              transition-opacity duration-150 pointer-events-none">
                <CameraIcon />
              </div>

              {/* Upload overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-bth-n-900/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-[12px] text-bth-green-800 font-medium hover:underline disabled:opacity-50 bth-focus"
              >
                {uploadingAvatar ? "Upload en cours…" : "Changer la photo"}
              </button>
              <p className="text-[11px] text-bth-n-400">JPG, PNG, WEBP — max 5 Mo</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="fullName">Nom complet</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Adresse email</label>
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                disabled
                className={inputDisabledCls}
              />
              <p className="text-[11px] text-bth-n-400 mt-1">L'email ne peut pas être modifié.</p>
            </div>

            <Button type="submit" loading={savingInfo} disabled={savingInfo}>
              Sauvegarder
            </Button>
          </form>
        </div>

        {/* ── Card 2 : Sécurité ── */}
        <div className="bg-white border border-bth-hairline rounded-bth-lg p-6 space-y-5 shadow-[var(--bth-shadow-sm)]">
          <p className={sectionTitleCls}>Sécurité</p>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="newPassword">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bth-n-400 hover:text-bth-n-700 transition-colors duration-100"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <p className="text-[11px] text-bth-n-400 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className={labelCls} htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bth-n-400 hover:text-bth-n-700 transition-colors duration-100"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-[12px] font-medium" style={{ color: "var(--color-bth-error)" }}>
                {passwordError}
              </p>
            )}

            <Button type="submit" loading={savingPassword} disabled={savingPassword}>
              Mettre à jour le mot de passe
            </Button>
          </form>
        </div>
      </div>

      {/* Toast global */}
      <AnimatePresence>
        {toast && <Toast data={toast} />}
      </AnimatePresence>
    </div>
  );
}
