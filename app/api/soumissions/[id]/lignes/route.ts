import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { ligneBudgetSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";
import { getUserRole } from "@/lib/api-roles";
import { canManageSoumissions } from "@/lib/permissions";

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
  if (!canManageSoumissions(await getUserRole(supabase, user.id))) {
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

  // Remplacement atomique (DELETE + INSERT dans une seule transaction via RPC).
  // Auparavant, un échec entre le DELETE et l'INSERT effaçait DÉFINITIVEMENT
  // toutes les lignes budgétaires. Cf. migration 20260715130000.
  const rows = (Array.isArray(lignes) ? lignes : []).map(
    (
      l: { numero: number; designation: string; quantite: number; prix_unitaire: number; groupe?: string },
      i: number
    ) => ({
      numero: l.numero,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      ordre: i + 1,
      groupe: l.groupe ?? "Mission",
    })
  );

  const { error: rpcError } = await supabase.rpc("replace_lignes_budget_tx", {
    p_soumission_id: id,
    p_lignes: rows,
  });

  if (rpcError) {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
