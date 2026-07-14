import { createServerSupabase, getServerProfile } from "@/lib/supabase-server";
import { SOUMISSION_LIST_SELECT } from "@/lib/queries";
import SoumissionsClient from "./SoumissionsClient";
import type { Soumission, UserRole } from "@/types";
import type { SoumissionKpis } from "./types";

export default async function SoumissionsPage() {
  const supabase = await createServerSupabase();

  // Buffer page 1 (généreux) trié comme le tri par défaut (date_offre desc) : le
  // client le découpe à la taille mesurée sans re-fetch → aucun "saut".
  const SSR_BUFFER = 40;
  const SSR_PERPAGE = 12;

  // Pas de { count: "exact" } ici (comptage complet coûteux → SSR plus lent) :
  // le total est dérivé des agrégats du RPC (somme des compteurs par statut),
  // déjà calculés. Buffer sans count → requête plus rapide.
  const [soumRes, statsRes, profile] = await Promise.all([
    supabase
      .from("soumissions")
      .select(SOUMISSION_LIST_SELECT)
      .order("date_offre", { ascending: false })
      .range(0, SSR_BUFFER - 1)
      .returns<Soumission[]>(),
    supabase.rpc("soumissions_list_stats"),
    getServerProfile(),
  ]);

  const initialSoumissions: Soumission[] = soumRes.data ?? [];
  const initialRole = (profile?.role ?? null) as UserRole | null;
  const canSeeAmounts = initialRole === "admin" || initialRole === "charge_projet";

  const st = statsRes.data?.[0];
  const counts = {
    Brouillon: st?.count_brouillon ?? 0,
    "Envoyée": st?.count_envoyee ?? 0,
    "Acceptée": st?.count_acceptee ?? 0,
    "Refusée": st?.count_refusee ?? 0,
  };
  // Total = somme des compteurs par statut (toutes les soumissions).
  const initialTotal = counts.Brouillon + counts["Envoyée"] + counts["Acceptée"] + counts["Refusée"];
  const initialKpis: SoumissionKpis = {
    counts,
    totalTTC: canSeeAmounts ? Number(st?.total_ttc ?? 0) : null,
    totalVerse: canSeeAmounts ? Number(st?.total_verse ?? 0) : null,
  };

  return (
    <SoumissionsClient
      initialSoumissions={initialSoumissions}
      initialTotal={initialTotal}
      initialKpis={initialKpis}
      initialPerPage={SSR_PERPAGE}
      initialRole={initialRole}
    />
  );
}
