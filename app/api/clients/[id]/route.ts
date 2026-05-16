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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    titre?: string;
    nom_contact?: string;
    poste?: string;
    entreprise?: string;
    adresse?: string;
    ville?: string;
    telephone?: string;
    email?: string;
  };

  const update: Record<string, unknown> = {};
  if (body.titre       !== undefined) update.titre       = body.titre;
  if (body.nom_contact !== undefined) update.nom_contact = body.nom_contact;
  if (body.poste       !== undefined) update.poste       = body.poste;
  if (body.entreprise  !== undefined) update.entreprise  = body.entreprise;
  if (body.adresse     !== undefined) update.adresse     = body.adresse;
  if (body.ville       !== undefined) update.ville       = body.ville;
  if (body.telephone   !== undefined) update.telephone   = body.telephone;
  if (body.email       !== undefined) update.email       = body.email;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("clients")
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
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  // La suppression cascade les soumissions liées (ON DELETE CASCADE)
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
