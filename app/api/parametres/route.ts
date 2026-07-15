import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";
import { getUserRole } from "@/lib/api-roles";
import { parametresUpdateSchema } from "@/lib/schemas";
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

// Écriture des paramètres société : réservée admin + chargé de projet
// (mêmes rôles qui voient la page /parametres). Le commercial en est exclu.
// La RLS de `parametres` interdit toute écriture cliente ; cette route est
// le seul chemin d'écriture, ganté serveur puis exécuté en service-role.
export async function PUT(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const role = await getUserRole(supabase, user.id);
  if (role !== "admin" && role !== "charge_projet") {
    return NextResponse.json({ error: "Action réservée aux administrateurs et chargés de projet" }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const validation = validateBody(parametresUpdateSchema, rawBody);
  if (!validation.success) return validation.response;

  const admin = createAdminClient();
  const { error } = await admin
    .from("parametres")
    .upsert(
      { id: 1, ...validation.data, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Erreur sauvegarde parametres:", error.message);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
