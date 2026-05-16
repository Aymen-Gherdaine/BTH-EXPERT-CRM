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
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

const VALID_RESULTATS = ["soumission_demandee", "rappel_planifie", "pas_interesse", "absent", "autre"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    date_visite?: string;
    resultat?: string;
    notes_visite?: string | null;
    date_prochaine_action?: string | null;
    action_requise?: string | null;
  };

  const update: Record<string, unknown> = {};
  if (body.date_visite !== undefined) update.date_visite = body.date_visite;
  if (body.resultat !== undefined) {
    if (!VALID_RESULTATS.includes(body.resultat as typeof VALID_RESULTATS[number])) {
      return NextResponse.json({ error: "Résultat invalide" }, { status: 400 });
    }
    update.resultat = body.resultat;
  }
  if (body.notes_visite !== undefined) update.notes_visite = body.notes_visite;
  if (body.date_prochaine_action !== undefined) update.date_prochaine_action = body.date_prochaine_action;
  if (body.action_requise !== undefined) update.action_requise = body.action_requise;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("visites")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase.from("visites").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
