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

// Replace all lignes for a soumission: DELETE existing + INSERT new batch
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const { lignes } = await req.json();

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
