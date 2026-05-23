import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { depenseCreateSchema } from "@/lib/schemas/index";
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

export async function GET(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  const role = profile?.role;

  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie");
  const projet_lie = searchParams.get("projet_lie");

  let query = supabase
    .from("depenses")
    .select("*, profiles(full_name), soumissions(id, titre_projet, numero_offre, total_ht)")
    .order("date_depense", { ascending: false });

  if (role === "commercial") query = query.eq("employe_id", user.id);
  if (categorie) query = query.eq("categorie", categorie);
  if (projet_lie) query = query.eq("projet_lie", projet_lie);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();

  const validation = validateBody(depenseCreateSchema, body);
  if (!validation.success) return validation.response;
  const { categorie, montant, description, date_depense, justificatif_url, projet_lie } = validation.data;

  // employe_id is always set server-side — never from request body
  const { data, error } = await supabase
    .from("depenses")
    .insert({
      employe_id: user.id,
      categorie,
      montant,
      description: description ?? null,
      date_depense: date_depense ?? undefined,
      justificatif_url: justificatif_url ?? null,
      projet_lie: projet_lie ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
