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

  const [moisRes, accepteesRes, statsRes, versementsRes] = await Promise.all([
    supabase
      .from("soumissions")
      .select("id")
      .gte("date_offre", startOfMonth),
    supabase
      .from("soumissions")
      .select("total_ttc")
      .eq("statut", "Acceptée"),
    supabase
      .from("soumissions")
      .select("statut"),
    supabase
      .from("soumissions")
      .select("versement_recu"),
  ]);

  const soumissions_mois = moisRes.data?.length ?? 0;

  const nombre_mandats_acceptes = accepteesRes.data?.length ?? 0;
  const total_mandats_acceptes = accepteesRes.data?.reduce((s, r) => s + (r.total_ttc || 0), 0) ?? 0;

  const all = statsRes.data ?? [];
  const total = all.length;
  const acceptees = all.filter((r) => r.statut === "Acceptée").length;
  const taux_acceptation = total > 0 ? Math.round((acceptees / total) * 100) : 0;

  const total_versements_recus = versementsRes.data?.reduce((s, r) => s + (r.versement_recu || 0), 0) ?? 0;

  return NextResponse.json({
    soumissions_mois,
    nombre_mandats_acceptes,
    total_mandats_acceptes,
    taux_acceptation,
    total_versements_recus,
  });
}
