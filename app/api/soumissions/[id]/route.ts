import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { StatutSoumission } from "@/types";
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

const VALID_STATUTS: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const { data: soumission, error } = await supabase
    .from("soumissions")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: lignes } = await supabase
    .from("lignes_budget")
    .select("*")
    .eq("soumission_id", id)
    .order("ordre");

  return NextResponse.json({ data: { ...soumission, lignes_budget: lignes } });
}

export async function PATCH(
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
  const body = await req.json() as { statut?: string; versement_recu?: number };

  const update: Record<string, unknown> = {};

  if (body.statut !== undefined) {
    if (!VALID_STATUTS.includes(body.statut as StatutSoumission)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    update.statut = body.statut;
  }

  if (body.versement_recu !== undefined) {
    const v = Number(body.versement_recu);
    if (isNaN(v) || v < 0) {
      return NextResponse.json({ error: "Versement invalide" }, { status: 400 });
    }
    update.versement_recu = v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("soumissions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canManageSoumissions(await getUserRole(supabase, user.id))) {
    return NextResponse.json({ error: "Action réservée aux administrateurs et chargés de projet" }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await supabase.from("soumissions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  return NextResponse.json({ success: true });
}
