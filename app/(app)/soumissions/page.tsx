import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SoumissionsClient from "./SoumissionsClient";
import type { Soumission, UserRole } from "@/types";

export default async function SoumissionsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();

  const [soumRes, profileRes] = await Promise.all([
    supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const initialSoumissions: Soumission[] = (soumRes.data ?? []) as Soumission[];
  const initialRole = (profileRes.data?.role ?? null) as UserRole | null;

  return (
    <SoumissionsClient
      initialSoumissions={initialSoumissions}
      initialRole={initialRole}
    />
  );
}
