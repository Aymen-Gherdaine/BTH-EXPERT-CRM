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

  // Buffer page 1 (généreux) : le client le découpe à la taille mesurée sans
  // re-fetch → aucun "saut". SSR_PERPAGE = nombre rendu côté serveur (avant mesure).
  const SSR_BUFFER = 40;
  const SSR_PERPAGE = 12;
  const [clientsResult, villesResult, profileResult] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, SSR_BUFFER - 1),
    supabase.from("clients").select("ville").limit(5000),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const initialClients = clientsResult.data ?? [];
  const initialTotal = clientsResult.count ?? initialClients.length;
  const initialCityCount = new Set(
    (villesResult.data ?? []).map(r => r.ville).filter(Boolean)
  ).size;
  const initialRole = (profileResult.data?.role ?? null) as UserRole | null;

  return (
    <ClientsPageClient
      initialClients={initialClients}
      initialTotal={initialTotal}
      initialCityCount={initialCityCount}
      initialPerPage={SSR_PERPAGE}
      initialRole={initialRole}
    />
  );
}
