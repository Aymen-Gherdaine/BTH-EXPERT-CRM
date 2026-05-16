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
  const prospect_id = searchParams.get("prospect_id");

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("visites")
    .select("*")
    .eq("prospect_id", prospect_id)
    .order("date_visite", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const {
    prospect_id, date_visite, resultat,
    notes_visite, date_prochaine_action, action_requise,
  } = body;

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
