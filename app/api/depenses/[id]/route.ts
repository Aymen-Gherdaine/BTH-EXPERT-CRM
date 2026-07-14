import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { depensePatchSchema } from "@/lib/schemas/index";
import { validateBody } from "@/lib/schemas/helpers";
import { getUserRole } from "@/lib/api-roles";
import { canModifyDepense } from "@/lib/permissions";

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

async function resolveAccess(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  depenseId: string,
  userId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  const { data: existing } = await supabase
    .from("depenses")
    .select("employe_id")
    .eq("id", depenseId)
    .single();

  if (!existing) return { allowed: false, notFound: true };

  const role = await getUserRole(supabase, userId);
  const isOwner = existing.employe_id === userId;

  return { allowed: canModifyDepense(role, isOwner) };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const access = await resolveAccess(supabase, id, user.id);
  if (access.notFound) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (!access.allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  // Whitelist stricte : seuls les champs éditables passent (employe_id jamais modifiable).
  const validation = validateBody(depensePatchSchema, rawBody);
  if (!validation.success) return validation.response;

  const { data, error } = await supabase
    .from("depenses")
    .update(validation.data)
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

  const access = await resolveAccess(supabase, id, user.id);
  if (access.notFound) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (!access.allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { error } = await supabase.from("depenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
