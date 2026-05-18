import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";

function nameFromEmail(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return email;
  return local.replace(/\b\w/g, (m) => m.toUpperCase());
}

function metadataString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

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

async function requireAdmin(supabase: Awaited<ReturnType<typeof getSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  const supabase = await getSupabase();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Fetch profiles — only columns that definitely exist
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch emails + metadata from auth.users via service role
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    // If no service role key, return profiles without email
    return NextResponse.json({
      data: (profiles ?? []).map((p) => ({ ...p, email: null, is_active: true })),
    });
  }

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(
    (authData?.users ?? []).map((u) => {
      const meta = u.user_metadata ?? {};
      const email = u.email ?? null;
      return [u.id, {
        email,
        full_name:
          metadataString(meta.full_name) ??
          metadataString(meta.name) ??
          nameFromEmail(email),
        avatar_url:
          metadataString(meta.avatar_url) ??
          metadataString(meta.picture),
      }];
    })
  );

  // Try to also get is_active from profiles (works once migration has been run)
  const { data: profilesWithActive } = await supabase
    .from("profiles")
    .select("id, is_active");

  const activeMap = new Map(
    (profilesWithActive ?? []).map((p: { id: string; is_active: boolean | null }) => [p.id, p.is_active])
  );

  const merged = (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id);
    return {
      ...p,
      full_name: p.full_name ?? auth?.full_name ?? nameFromEmail(auth?.email ?? null),
      avatar_url: p.avatar_url ?? auth?.avatar_url ?? null,
      email: auth?.email ?? null,
      is_active: activeMap.has(p.id) ? activeMap.get(p.id) : true,
    };
  });

  return NextResponse.json({ data: merged });
}
