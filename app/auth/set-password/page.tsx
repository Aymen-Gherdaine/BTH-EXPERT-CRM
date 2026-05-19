"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e1e"
      strokeWidth={2.35} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22 16 8" />
      <path d="M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z" />
    </svg>
  );
}

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

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-bth-md flex items-center justify-center shadow-[0_8px_18px_rgba(26,46,30,.10)]"
            style={{ background: "#edf5ef", border: "1px solid #90bb9a" }}>
            <LeafIcon />
          </div>
          <span className="text-lg font-semibold text-bth-green-800">BTH Hub</span>
        </div>

        {/* Header */}
        <h1 className="text-lg font-semibold text-gray-800 mb-1 text-center">
          Définir votre mot de passe
        </h1>
        <p className="text-sm text-gray-500 mb-7 text-center">
          Bienvenue chez BTH Hub. Créez votre mot de passe pour accéder à votre espace.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="confirm">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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

          {/* Erreur */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-[#1a2e1e] hover:bg-[#243d28] text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? "Enregistrement…" : "Confirmer et accéder"}
          </button>
        </form>
      </div>
    </main>
  );
}
