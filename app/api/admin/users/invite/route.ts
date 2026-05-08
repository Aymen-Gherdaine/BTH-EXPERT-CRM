import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";

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

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const { email, full_name, role } = body as { email?: string; full_name?: string; role?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!full_name?.trim()) {
    return NextResponse.json({ error: "Le nom complet est requis" }, { status: 400 });
  }
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: full_name.trim() },
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const newUserId = inviteData.user.id;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: newUserId,
      email: email.toLowerCase().trim(),
      full_name: full_name.trim(),
      role,
      is_active: true,
    })
    .select("id, full_name, email, role, avatar_url, is_active, created_at")
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ data: profile }, { status: 201 });
}
