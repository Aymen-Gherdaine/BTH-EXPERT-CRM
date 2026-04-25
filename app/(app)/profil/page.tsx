"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

// ── Icônes ──────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getDisplayName(user: User): string {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Utilisateur";
}

// ── Composant avatar ─────────────────────────────────────────

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
      className="rounded-full flex items-center justify-center text-white font-semibold text-2xl"
      style={{ width: px, height: px, backgroundColor: "#1a2e1e" }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Feedback inline ──────────────────────────────────────────

function Feedback({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <p className={`text-sm px-3 py-2 rounded-lg ${type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      {message}
    </p>
  );
}

// ── Page principale ──────────────────────────────────────────

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [savingInfo, setSavingInfo] = useState(false);
  const [infoFeedback, setInfoFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    setAvatarFeedback(null);

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError || !data) {
      setAvatarFeedback({ type: "error", message: "Échec de l'upload. Vérifiez le bucket Supabase Storage." });
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
      setAvatarFeedback({ type: "error", message: "Photo uploadée mais metadata non mise à jour." });
    } else {
      setAvatarUrl(publicUrl);
      setAvatarFeedback({ type: "success", message: "Photo de profil mise à jour." });
      router.refresh();
    }

    setUploadingAvatar(false);
  }

  // ── Sauvegarder informations ───────────────────────────────

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSavingInfo(true);
    setInfoFeedback(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (error) {
      setInfoFeedback({ type: "error", message: "Erreur lors de la sauvegarde." });
    } else {
      setInfoFeedback({ type: "success", message: "Informations mises à jour." });
      router.refresh();
    }

    setSavingInfo(false);
  }

  // ── Changer mot de passe ───────────────────────────────────

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (password.length < 8) {
      setPasswordFeedback({ type: "error", message: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Les mots de passe ne correspondent pas." });
      return;
    }

    setSavingPassword(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordFeedback({ type: "error", message: "Erreur lors de la mise à jour du mot de passe." });
    } else {
      setPasswordFeedback({ type: "success", message: "Mot de passe mis à jour avec succès." });
      setPassword("");
      setConfirmPassword("");
    }

    setSavingPassword(false);
  }

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#1a2e1e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayAvatar = avatarPreview ?? avatarUrl;
  const displayName = fullName || getDisplayName(user);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles et votre mot de passe.</p>
      </div>

      {/* ── Section 1 : Informations personnelles ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h2 className="text-base font-semibold text-gray-800">Informations personnelles</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <AvatarDisplay url={displayAvatar} name={displayName} size={20} />
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? "Upload en cours…" : "Changer la photo"}
            </button>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo</p>
            {avatarFeedback && <Feedback {...avatarFeedback} />}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Formulaire nom + email */}
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="fullName">
              Nom complet
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1e] focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Adresse email</label>
            <input
              type="email"
              value={user.email ?? ""}
              readOnly
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">L'email ne peut pas être modifié.</p>
          </div>

          {infoFeedback && <Feedback {...infoFeedback} />}

          <button
            type="submit"
            disabled={savingInfo}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1a2e1e" }}
          >
            {savingInfo ? "Enregistrement…" : "Sauvegarder"}
          </button>
        </form>
      </div>

      {/* ── Section 2 : Changer le mot de passe ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800">Changer le mot de passe</h2>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="newPassword">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-gray-200 rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1e] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <p className="text-xs text-gray-400">Minimum 8 caractères</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-gray-200 rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1e] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {passwordFeedback && <Feedback {...passwordFeedback} />}

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1a2e1e" }}
          >
            {savingPassword ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
