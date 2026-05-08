import { NextResponse } from "next/server";
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

export async function GET() {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "commercial"].includes(profile.role)) {
    return NextResponse.json({ count: 0 });
  }

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, visites(date_prochaine_action, created_at)")
    .eq("statut_global", "actif");

  if (!prospects) return NextResponse.json({ count: 0 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;
  for (const p of prospects) {
    const visites = (p.visites ?? []) as { date_prochaine_action: string | null; created_at: string }[];
    if (visites.length === 0) continue;
    const lastV = [...visites].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    if (!lastV.date_prochaine_action) continue;
    const d = new Date(lastV.date_prochaine_action);
    d.setHours(0, 0, 0, 0);
    if (d <= today) count++;
  }

  return NextResponse.json({ count });
}
