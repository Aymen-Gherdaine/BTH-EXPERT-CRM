import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { visiteCreateSchema } from "@/lib/schemas";
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
  if (!canAccessProspection(await getUserRole(supabase, user.id))) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs et commerciaux" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const prospect_id = searchParams.get("prospect_id");

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("visites")
    .select("*")
    .eq("prospect_id", prospect_id)
    .order("date_visite", { ascending: false });

  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canAccessProspection(await getUserRole(supabase, user.id))) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs et commerciaux" }, { status: 403 });
  }

  const body = await req.json();
  const validation = validateBody(visiteCreateSchema, body);
  if (!validation.success) return validation.response;
  const { prospect_id, date_visite, resultat, notes_visite, date_prochaine_action, action_requise } = validation.data;

  const { data, error } = await supabase
    .from("visites")
    .insert({
      prospect_id,
      date_visite,
      resultat,
      notes_visite: notes_visite || null,
      date_prochaine_action: date_prochaine_action || null,
      action_requise: action_requise || null,
      commercial_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
