import { createServerSupabase, getServerUser, getServerProfile } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";
import type { DashboardStats, Soumission, Prospect, UserRole } from "@/types";

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) return <DashboardClient />;

  const supabase = await createServerSupabase();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];

  const [profile, aggRes, recentRes, prospectsRes] = await Promise.all([
    getServerProfile(),
    // Agrégats : TOUTES les lignes mais seulement 4 colonnes, sans jointure
    // → totaux EXACTS avec un payload minimal (avant : toutes les colonnes +
    //   client:clients(*) sur chaque ligne).
    supabase
      .from("soumissions")
      .select("statut, date_offre, total_ttc, versement_recu"),
    // Affichage : seules les plus récentes (avec la jointure client) sont
    // nécessaires pour les listes "récentes" (5) et "envoyées" (5).
    supabase
      .from("soumissions")
      .select("*, client:clients(*)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
  ]);

  type AggRow = {
    statut: string | null;
    date_offre: string | null;
    total_ttc: number | null;
    versement_recu: number | null;
  };
  const agg = (aggRes.data ?? []) as AggRow[];
  const acceptees = agg.filter(s => s.statut === "Acceptée");
  const initialStats: DashboardStats = {
    soumissions_mois: agg.filter(s => (s.date_offre ?? "") >= startOfMonth).length,
    nombre_mandats_acceptes: acceptees.length,
    total_mandats_acceptes: acceptees.reduce((sum, s) => sum + (s.total_ttc ?? 0), 0),
    taux_acceptation: agg.length > 0
      ? Math.round((acceptees.length / agg.length) * 100)
      : 0,
    total_versements_recus: agg.reduce((sum, s) => sum + (s.versement_recu ?? 0), 0),
  };

  return (
    <DashboardClient
      initialProfile={profile
        ? { role: profile.role as UserRole, full_name: profile.full_name ?? null }
        : undefined}
      initialStats={initialStats}
      initialSoumissions={(recentRes.data ?? []) as Soumission[]}
      initialProspects={(prospectsRes.data ?? []) as Prospect[]}
    />
  );
}
