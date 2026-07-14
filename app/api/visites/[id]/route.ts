import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { visitePatchSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";
import { getUserRole } from "@/lib/api-roles";
import { canAccessProspection } from "@/lib/permissions";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canAccessProspection(await getUserRole(supabase, user.id))) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs et commerciaux" }, { status: 403 });
  }

  const body = await req.json();
  const validation = validateBody(visitePatchSchema, body);
  if (!validation.success) return validation.response;

  const update: Record<string, unknown> = {};
  if (validation.data.date_visite !== undefined) update.date_visite = validation.data.date_visite;
  if (validation.data.resultat !== undefined) update.resultat = validation.data.resultat;
  if (validation.data.notes_visite !== undefined) update.notes_visite = validation.data.notes_visite;
  if (validation.data.date_prochaine_action !== undefined) update.date_prochaine_action = validation.data.date_prochaine_action;
  if (validation.data.action_requise !== undefined) update.action_requise = validation.data.action_requise;

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
  if (!canAccessProspection(await getUserRole(supabase, user.id))) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs et commerciaux" }, { status: 403 });
  }

  const { error } = await supabase.from("visites").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
