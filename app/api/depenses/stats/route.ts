import { NextRequest, NextResponse } from "next/server";
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

type DepenseFull = {
  employe_id: string;
  categorie: string;
  montant: number;
  date_depense: string;
  projet_lie: string | null;
  profiles: { full_name: string } | null;
  soumissions: { titre_projet: string; numero_offre: string; total_ht: number } | null;
};

export async function GET(_req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("depenses")
    .select("employe_id, categorie, montant, date_depense, projet_lie, profiles(full_name), soumissions(titre_projet, numero_offre, total_ht)")
    .order("date_depense", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as DepenseFull[];

  // Totals by employee
  const byEmployeeMap: Record<string, { employe_id: string; name: string; total: number }> = {};
  for (const d of rows) {
    if (!byEmployeeMap[d.employe_id]) {
      byEmployeeMap[d.employe_id] = {
        employe_id: d.employe_id,
        name: d.profiles?.full_name ?? d.employe_id,
        total: 0,
      };
    }
    byEmployeeMap[d.employe_id].total += Number(d.montant);
  }

  // Totals by category
  const byCategory: Record<string, number> = {};
  for (const d of rows) {
    byCategory[d.categorie] = (byCategory[d.categorie] ?? 0) + Number(d.montant);
  }

  // Totals by month (YYYY-MM)
  const byMonth: Record<string, number> = {};
  for (const d of rows) {
    const month = d.date_depense.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + Number(d.montant);
  }

  // Per-project margin: soumission total_ht − linked depenses = real margin
  const byProjectMap: Record<string, {
    projet_lie: string;
    titre: string;
    numero_offre: string;
    revenue: number;
    depenses: number;
    marge: number;
  }> = {};

  for (const d of rows) {
    if (!d.projet_lie || !d.soumissions) continue;
    if (!byProjectMap[d.projet_lie]) {
      byProjectMap[d.projet_lie] = {
        projet_lie: d.projet_lie,
        titre: d.soumissions.titre_projet,
        numero_offre: d.soumissions.numero_offre,
        revenue: Number(d.soumissions.total_ht),
        depenses: 0,
        marge: 0,
      };
    }
    byProjectMap[d.projet_lie].depenses += Number(d.montant);
  }

  for (const p of Object.values(byProjectMap)) {
    p.marge = p.revenue - p.depenses;
  }

  return NextResponse.json({
    data: {
      by_employee: Object.values(byEmployeeMap),
      by_category: byCategory,
      by_month: byMonth,
      by_project: Object.values(byProjectMap),
    },
  });
}
