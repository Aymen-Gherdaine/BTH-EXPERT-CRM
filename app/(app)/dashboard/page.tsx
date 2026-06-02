import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";
import type { DashboardStats, Soumission, Prospect } from "@/types";

export default async function DashboardPage() {
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
  if (!user) return <DashboardClient />;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [profileRes, statsRes, soumRes, prospectsRes] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", user.id).single(),
    supabase.from("soumissions").select("statut, total_ttc, versement_recu, date_offre"),
    supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }).limit(10),
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
  ]);

  const allStats = statsRes.data ?? [];
  const acceptees = allStats.filter(s => s.statut === "Acceptée");
  const total = allStats.length;
  const initialStats: DashboardStats = {
    soumissions_mois: allStats.filter(s => s.date_offre >= startOfMonth).length,
    nombre_mandats_acceptes: acceptees.length,
    total_mandats_acceptes: acceptees.reduce((sum, s) => sum + (s.total_ttc ?? 0), 0),
    taux_acceptation: total > 0 ? Math.round((acceptees.length / total) * 100) : 0,
    total_versements_recus: allStats.reduce((sum, s) => sum + (s.versement_recu ?? 0), 0),
  };

  return (
    <DashboardClient
      initialProfile={profileRes.data ?? undefined}
      initialStats={initialStats}
      initialSoumissions={(soumRes.data ?? []) as Soumission[]}
      initialProspects={(prospectsRes.data ?? []) as Prospect[]}
    />
  );
}
