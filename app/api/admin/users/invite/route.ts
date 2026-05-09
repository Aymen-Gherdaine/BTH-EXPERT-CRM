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
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: full_name.trim() },
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const newUserId = inviteData.user.id;

  // Upsert profile — only columns that exist in the table
  // Note: is_active requires migration: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  const upsertData: Record<string, unknown> = {
    id: newUserId,
    full_name: full_name.trim(),
    role,
  };

  // Include is_active only if column exists (attempt, ignore error if not)
  const { error: upsertError } = await adminClient
    .from("profiles")
    .upsert({ ...upsertData, is_active: true });

  if (upsertError && !upsertError.message.includes("is_active")) {
    // Only fail on non-is_active errors; if is_active column missing, retry without it
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (upsertError?.message.includes("is_active")) {
    // Retry without is_active
    const { error: retryError } = await adminClient
      .from("profiles")
      .upsert(upsertData);
    if (retryError) {
      return NextResponse.json({ error: retryError.message }, { status: 500 });
    }
  }

  // Return the new user profile with email injected from request body
  return NextResponse.json({
    data: {
      id: newUserId,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      role,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  }, { status: 201 });
}
