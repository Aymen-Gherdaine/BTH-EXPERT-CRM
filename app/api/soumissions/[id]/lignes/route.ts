import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { ligneBudgetSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";

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

async function canManageSoumissions(supabase: Awaited<ReturnType<typeof getSupabase>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();

  return profile?.role === "admin" || profile?.role === "charge_projet";
}

// Corps attendu : { lignes: LigneBudget[] } — validé avant toute écriture.
const lignesPutSchema = z.object({
  lignes: z.array(ligneBudgetSchema),
});

// Replace all lignes for a soumission: DELETE existing + INSERT new batch
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await canManageSoumissions(supabase, user.id))) {
    return NextResponse.json({ error: "Action réservée aux administrateurs et chargés de projet" }, { status: 403 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const validation = validateBody(lignesPutSchema, rawBody);
  if (!validation.success) return validation.response;
  const { lignes } = validation.data;

  const { error: deleteError } = await supabase
    .from("lignes_budget")
    .delete()
    .eq("soumission_id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (Array.isArray(lignes) && lignes.length > 0) {
    const rows = lignes.map(
      (
        l: { numero: number; designation: string; quantite: number; prix_unitaire: number; groupe?: string },
        i: number
      ) => ({
        soumission_id: id,
        numero: l.numero,
        designation: l.designation,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
        ordre: i + 1,
        groupe: l.groupe ?? "Mission",
      })
    );

    const { error: insertError } = await supabase
      .from("lignes_budget")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
