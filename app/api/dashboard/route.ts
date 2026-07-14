import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  // Agrégats calculés en base (RPC) : une seule passe côté Postgres au lieu de
  // 4 scans complets de `soumissions` rapatriés puis comptés/sommés en JS.
  // RLS respectée (SECURITY INVOKER) → chiffres scoping identique à avant.
  const { data, error } = await supabase.rpc("dashboard_stats", {
    p_start_of_month: startOfMonth,
  });
  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  const stats = data?.[0] ?? {
    soumissions_mois: 0,
    nombre_mandats_acceptes: 0,
    total_mandats_acceptes: 0,
    taux_acceptation: 0,
    total_versements_recus: 0,
  };

  return NextResponse.json(stats);
}
