import { createServerSupabase, getServerUser, getServerProfile } from "@/lib/supabase-server";
import { SOUMISSION_LIST_SELECT } from "@/lib/queries";
import DashboardClient from "./DashboardClient";
import type { DashboardStats, Soumission, Prospect, UserRole } from "@/types";

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) return <DashboardClient />;

  const supabase = await createServerSupabase();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];

  const [profile, statsRes, recentRes, prospectsRes] = await Promise.all([
    getServerProfile(),
    // Agrégats calculés en base (RPC) : Postgres renvoie directement les 5
    // indicateurs en une passe, au lieu de rapatrier toutes les lignes pour
    // les compter/sommer côté serveur. RLS respectée (SECURITY INVOKER).
    supabase.rpc("dashboard_stats", { p_start_of_month: startOfMonth }),
    // Affichage : seules les plus récentes (avec la jointure client) sont
    // nécessaires pour les listes "récentes" (5) et "envoyées" (5).
    // Colonnes de liste (sans `contexte_genere`, inutile ici) — voir lib/queries.ts.
    supabase
      .from("soumissions")
      .select(SOUMISSION_LIST_SELECT)
      .order("created_at", { ascending: false })
      .limit(60)
      .returns<Soumission[]>(),
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
  ]);

  const initialStats: DashboardStats = (statsRes.data?.[0] as DashboardStats | undefined) ?? {
    soumissions_mois: 0,
    nombre_mandats_acceptes: 0,
    total_mandats_acceptes: 0,
    taux_acceptation: 0,
    total_versements_recus: 0,
  };

  return (
    <DashboardClient
      initialProfile={profile
        ? { role: profile.role as UserRole, full_name: profile.full_name ?? null }
        : undefined}
      initialStats={initialStats}
      initialSoumissions={recentRes.data ?? []}
      initialProspects={(prospectsRes.data ?? []) as Prospect[]}
    />
  );
}
