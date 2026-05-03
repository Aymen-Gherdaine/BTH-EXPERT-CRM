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
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");

  let query = supabase
    .from("prospects")
    .select("*, visites(id, date_visite, resultat, date_prochaine_action, action_requise, created_at)")
    .order("created_at", { ascending: false });

  if (statut) query = query.eq("statut_global", statut);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const {
    entreprise, secteur_activite, nom_contact, poste_contact,
    telephone, email, adresse, notes_generales,
  } = body;

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      entreprise,
      secteur_activite,
      nom_contact,
      poste_contact,
      telephone,
      email: email || null,
      adresse,
      notes_generales: notes_generales || null,
      statut_global: "actif",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
