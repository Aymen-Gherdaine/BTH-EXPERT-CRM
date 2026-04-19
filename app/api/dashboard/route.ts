import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [moisRes, totalRes, statsRes] = await Promise.all([
    supabase
      .from("soumissions")
      .select("id, total_ttc, statut")
      .gte("date_offre", startOfMonth),
    supabase
      .from("soumissions")
      .select("total_ttc")
      .eq("statut", "Acceptée"),
    supabase
      .from("soumissions")
      .select("statut"),
  ]);

  const soumissions_mois = moisRes.data?.length ?? 0;
  const montant_total_mois = moisRes.data?.reduce((s, r) => s + (r.total_ttc || 0), 0) ?? 0;
  const total_mandats_acceptes = totalRes.data?.reduce((s, r) => s + (r.total_ttc || 0), 0) ?? 0;

  const all = statsRes.data ?? [];
  const total = all.length;
  const acceptees = all.filter((r) => r.statut === "Acceptée").length;
  const taux_acceptation = total > 0 ? Math.round((acceptees / total) * 100) : 0;

  return NextResponse.json({
    soumissions_mois,
    montant_total_mois,
    total_mandats_acceptes,
    taux_acceptation,
  });
}
