import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VALID_ROLES = ["admin", "charge_projet", "commercial"];

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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: targetId } = await params;
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json() as {
    role?: string;
    is_active?: boolean;
    full_name?: string;
  };

  if (body.role !== undefined && targetId === user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre rôle" },
      { status: 403 }
    );
  }

  if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.full_name !== undefined) updateData.full_name = body.full_name;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.role !== undefined) updateData.role = body.role;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: targetId } = await params;
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas désactiver votre propre compte" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
