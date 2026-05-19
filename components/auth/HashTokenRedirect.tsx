"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function LeafIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a2e1e"
      strokeWidth={2.35} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22 16 8" />
      <path d="M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z" />
    </svg>
  );
}

function BthLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-bth-md flex items-center justify-center shadow-[0_8px_18px_rgba(26,46,30,.10)]"
        style={{ background: "#edf5ef", border: "1px solid #90bb9a" }}>
        <LeafIcon />
      </div>
      <span className="text-xl font-semibold text-bth-green-800">BTH Hub</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
  );
}

export default function HashTokenRedirect() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) return;

    setHasToken(true);

    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setHasToken(false);
          return;
        }
        if (type === "invite" || type === "recovery") {
          router.push("/auth/set-password");
        } else {
          router.push("/dashboard");
        }
      });
  }, [router]);

  if (!hasToken) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-50">
      <BthLogo />
      <Spinner />
      <p className="text-sm text-gray-400">Chargement de votre espace…</p>
    </div>
  );
}
