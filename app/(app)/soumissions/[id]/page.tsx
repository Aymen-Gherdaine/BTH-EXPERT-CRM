import { redirect } from "next/navigation";
import { createServerSupabase, getServerProfile } from "@/lib/supabase-server";
import SoumissionDetailClient from "./SoumissionDetailClient";
import type { Soumission, UserRole } from "@/types";

// Rendu côté serveur : la soumission (client + lignes budgétaires) est dans le
// HTML au premier paint — plus de spinner ni d'aller-retour au montage. Le
// « not found » redirige côté serveur. Même données que GET /api/soumissions/[id].
export default async function SoumissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const [soumRes, profile] = await Promise.all([
    supabase.from("soumissions").select("*, client:clients(*)").eq("id", id).single(),
    getServerProfile(),
  ]);

  if (!soumRes.data) redirect("/soumissions");

  const { data: lignes } = await supabase
    .from("lignes_budget")
    .select("*")
    .eq("soumission_id", id)
    .order("ordre");

  const role = (profile?.role as UserRole) ?? null;
  const initialSoumission = { ...soumRes.data, lignes_budget: lignes ?? [] } as unknown as Soumission;

  return (
    <SoumissionDetailClient
      id={id}
      initialSoumission={initialSoumission}
      initialRole={role}
    />
  );
}
