import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ClientsPageClient from "./ClientsPageClient";
import type { UserRole } from "@/types";

export default async function ClientsPage() {
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

  const [clientsResult, profileResult] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const initialClients = clientsResult.data ?? [];
  const initialRole = (profileResult.data?.role ?? null) as UserRole | null;

  return <ClientsPageClient initialClients={initialClients} initialRole={initialRole} />;
}
