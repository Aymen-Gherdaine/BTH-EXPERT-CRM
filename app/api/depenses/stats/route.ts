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

function periodeFrom(periode: string | null): string | null {
  const now = new Date();
  if (periode === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];
  }
  if (periode === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), q * 3, 1)
      .toISOString().split("T")[0];
  }
  if (periode === "year") {
    return new Date(now.getFullYear(), 0, 1)
      .toISOString().split("T")[0];
  }
  return null;
}

type DepenseRow = {
  id: string;
  employe_id: string;
  categorie: string;
  montant: number;
  description: string | null;
  date_depense: string;
  projet_lie: string | null;
  profiles: { full_name: string } | null;
  soumissions: {
    id: string;
    titre_projet: string;
    total_ttc: number;
    clients: { entreprise: string } | null;
  } | null;
};

type SoumissionRow = {
  id: string;
  total_ttc: number;
};

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const from = periodeFrom(searchParams.get("periode"));

  // ── Dépenses (all, with joins) ────────────────────────────────────────────
  let depQuery = supabase
    .from("depenses")
    .select(
      "id, employe_id, categorie, montant, description, date_depense, projet_lie, " +
      "profiles(full_name), soumissions(id, titre_projet, total_ttc, clients(entreprise))"
    )
    .order("date_depense", { ascending: false });

  if (from) depQuery = depQuery.gte("date_depense", from);

  const { data: depData, error: depErr } = await depQuery;
  if (depErr) return NextResponse.json({ error: depErr.message }, { status: 500 });

  const depenses = (depData ?? []) as unknown as DepenseRow[];

  // ── Soumissions acceptées (revenus) ───────────────────────────────────────
  let souQuery = supabase
    .from("soumissions")
    .select("id, total_ttc")
    .eq("statut", "Acceptée");

  if (from) souQuery = souQuery.gte("date_offre", from);

  const { data: souData, error: souErr } = await souQuery;
  if (souErr) return NextResponse.json({ error: souErr.message }, { status: 500 });

  const soumissions = (souData ?? []) as unknown as SoumissionRow[];

  // ── Totaux globaux ────────────────────────────────────────────────────────
  const total_revenus = soumissions.reduce((s, r) => s + Number(r.total_ttc ?? 0), 0);
  const total_depenses = depenses.reduce((s, d) => s + Number(d.montant ?? 0), 0);
  const marge_nette = total_revenus - total_depenses;

  // ── Par projet ────────────────────────────────────────────────────────────
  const projetMap = new Map<string, {
    soumission_id: string;
    titre_projet: string;
    client_nom: string;
    revenu: number;
    depenses: number;
    marge: number;
    marge_pct: number;
  }>();

  for (const d of depenses) {
    if (!d.projet_lie || !d.soumissions) continue;
    if (!projetMap.has(d.projet_lie)) {
      projetMap.set(d.projet_lie, {
        soumission_id: d.projet_lie,
        titre_projet: d.soumissions.titre_projet,
        client_nom: d.soumissions.clients?.entreprise ?? "—",
        revenu: Number(d.soumissions.total_ttc ?? 0),
        depenses: 0,
        marge: 0,
        marge_pct: 0,
      });
    }
    projetMap.get(d.projet_lie)!.depenses += Number(d.montant);
  }

  const par_projet = Array.from(projetMap.values())
    .map(p => {
      p.marge = p.revenu - p.depenses;
      p.marge_pct = p.revenu > 0 ? Math.round((p.marge / p.revenu) * 100) : 0;
      return p;
    })
    .sort((a, b) => b.marge - a.marge);

  // ── Par employé ───────────────────────────────────────────────────────────
  const empMap = new Map<string, {
    employe_id: string;
    nom: string;
    total: number;
    par_categorie: Record<string, number>;
  }>();

  for (const d of depenses) {
    if (!empMap.has(d.employe_id)) {
      empMap.set(d.employe_id, {
        employe_id: d.employe_id,
        nom: d.profiles?.full_name ?? "Inconnu",
        total: 0,
        par_categorie: {},
      });
    }
    const emp = empMap.get(d.employe_id)!;
    emp.total += Number(d.montant);
    emp.par_categorie[d.categorie] =
      (emp.par_categorie[d.categorie] ?? 0) + Number(d.montant);
  }

  const par_employe = Array.from(empMap.values())
    .sort((a, b) => b.total - a.total);

  // ── Dépenses non liées (frais généraux) ──────────────────────────────────
  const catMap = new Map<string, {
    categorie: string;
    total: number;
    items: {
      id: string;
      montant: number;
      description: string | null;
      date_depense: string;
      employe: string;
    }[];
  }>();

  for (const d of depenses.filter(d => !d.projet_lie)) {
    if (!catMap.has(d.categorie)) {
      catMap.set(d.categorie, { categorie: d.categorie, total: 0, items: [] });
    }
    const cat = catMap.get(d.categorie)!;
    cat.total += Number(d.montant);
    cat.items.push({
      id: d.id,
      montant: Number(d.montant),
      description: d.description,
      date_depense: d.date_depense,
      employe: d.profiles?.full_name ?? "Inconnu",
    });
  }

  const depenses_non_liees = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    total_revenus,
    total_depenses,
    marge_nette,
    par_projet,
    par_employe,
    depenses_non_liees,
  });
}
