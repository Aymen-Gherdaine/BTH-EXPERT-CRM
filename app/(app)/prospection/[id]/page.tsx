import { createServerSupabase } from "@/lib/supabase-server";
import ProspectClient from "./ProspectClient";
import type { Prospect } from "@/types";

// Rendu côté serveur : le prospect (et ses visites) est dans le HTML au premier
// paint — plus de spinner ni d'aller-retour au montage. Le client revalide en
// fond. Même requête que GET /api/prospects/[id].
export default async function ProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("prospects")
    .select("*, visites(id, date_visite, resultat, notes_visite, date_prochaine_action, action_requise, commercial_id, created_at)")
    .eq("id", id)
    .single();

  const initialProspect = (data as Prospect | null) ?? null;
  if (initialProspect?.visites) {
    initialProspect.visites = [...initialProspect.visites].sort(
      (a, b) => new Date(b.date_visite).getTime() - new Date(a.date_visite).getTime()
    );
  }

  return <ProspectClient id={id} initialProspect={initialProspect} />;
}
