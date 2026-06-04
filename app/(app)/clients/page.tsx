import { createServerSupabase, getServerProfile } from "@/lib/supabase-server";
import ClientsPageClient from "./ClientsPageClient";
import type { UserRole } from "@/types";

export default async function ClientsPage() {
  const supabase = await createServerSupabase();

  // Buffer page 1 (généreux) : le client le découpe à la taille mesurée sans
  // re-fetch → aucun "saut". SSR_PERPAGE = nombre rendu côté serveur (avant mesure).
  const SSR_BUFFER = 40;
  const SSR_PERPAGE = 12;
  const [clientsResult, villesResult, profile] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, SSR_BUFFER - 1),
    supabase.from("clients").select("ville").limit(5000),
    getServerProfile(),
  ]);

  const initialClients = clientsResult.data ?? [];
  const initialTotal = clientsResult.count ?? initialClients.length;
  const initialCityCount = new Set(
    (villesResult.data ?? []).map(r => r.ville).filter(Boolean)
  ).size;
  const initialRole = (profile?.role ?? null) as UserRole | null;

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
