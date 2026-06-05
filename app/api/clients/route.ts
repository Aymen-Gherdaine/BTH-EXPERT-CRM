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

export async function GET(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const orFilter = q ? `entreprise.ilike.%${q}%,nom_contact.ilike.%${q}%` : null;
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  // ── Mode paginé (serveur) : ?page & ?pageSize ───────────────────────────
  if (pageParam) {
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam ?? "20", 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Page courante + total exact (même filtre de recherche)
    let pageQuery = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (orFilter) pageQuery = pageQuery.or(orFilter);

    const { data, error, count } = await pageQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // cityCount = villes distinctes sur l'ensemble filtré (colonne unique, léger)
    let cityQuery = supabase.from("clients").select("ville").limit(5000);
    if (orFilter) cityQuery = cityQuery.or(orFilter);
    const { data: villes } = await cityQuery;
    const cityCount = new Set((villes ?? []).map(r => r.ville).filter(Boolean)).size;

    return NextResponse.json({ data: data ?? [], total: count ?? 0, cityCount });
  }

  // ── Mode legacy (non paginé, borné) — rétro-compatible ──────────────────
  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })
    // Garde-fou volume — voir note dans /api/soumissions.
    .limit(1000);
  if (orFilter) query = query.or(orFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
