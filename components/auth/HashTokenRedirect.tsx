"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function BthLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
        <span className="text-white text-xs font-bold tracking-tight">BTH</span>
      </div>
      <span className="text-xl font-semibold text-gray-800">BTH Hub</span>
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
