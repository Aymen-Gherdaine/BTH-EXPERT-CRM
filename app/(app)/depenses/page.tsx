import { createServerSupabase, getServerUser } from "@/lib/supabase-server";
import DepensesPageClient from "./DepensesPageClient";
import type { Depense } from "@/types";

type SoumissionOption = {
  id: string;
  titre_projet: string;
  numero_offre: string;
};

export default async function DepensesPage() {
  const supabase = await createServerSupabase();

  const user = await getServerUser();

  const [depensesResult, soumissionsResult] = await Promise.all([
    supabase.from("depenses").select("*").order("date_depense", { ascending: false }),
    supabase.from("soumissions").select("id, titre_projet, numero_offre"),
  ]);

  const initialDepenses = (depensesResult.data ?? []) as Depense[];
  const initialSoumissions = (soumissionsResult.data ?? []) as SoumissionOption[];

  return (
    <DepensesPageClient
      initialDepenses={initialDepenses}
      initialSoumissions={initialSoumissions}
      initialUserId={user?.id ?? null}
    />
  );
}
