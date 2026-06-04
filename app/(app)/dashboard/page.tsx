import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import DashboardClient from "./DashboardClient";
import type { DashboardStats, Soumission, Prospect } from "@/types";
import type { UserRole } from "@/types";

function buildSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = buildSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <DashboardClient />;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];

  const [profileRes, soumRes, prospectsRes] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", user.id).single(),
    supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }),
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
  ]);

  const allSoumissions: Soumission[] = (soumRes.data ?? []) as Soumission[];
  const acceptees = allSoumissions.filter(s => s.statut === "Acceptée");
  const initialStats: DashboardStats = {
    soumissions_mois: allSoumissions.filter(s => s.date_offre >= startOfMonth).length,
    nombre_mandats_acceptes: acceptees.length,
    total_mandats_acceptes: acceptees.reduce((sum, s) => sum + (s.total_ttc ?? 0), 0),
    taux_acceptation: allSoumissions.length > 0
      ? Math.round((acceptees.length / allSoumissions.length) * 100)
      : 0,
    total_versements_recus: allSoumissions.reduce((sum, s) => sum + (s.versement_recu ?? 0), 0),
  };

  return (
    <DashboardClient
      initialProfile={{
        role: (profileRes.data?.role ?? "admin") as UserRole,
        full_name: profileRes.data?.full_name ?? null,
      }}
      initialStats={initialStats}
      initialSoumissions={allSoumissions}
      initialProspects={(prospectsRes.data ?? []) as Prospect[]}
    />
  );
}
