import { createServerSupabase, getServerProfile } from "@/lib/supabase-server";
import { SOUMISSION_LIST_SELECT } from "@/lib/queries";
import SoumissionsClient from "./SoumissionsClient";
import type { Soumission, UserRole } from "@/types";

export default async function SoumissionsPage() {
  const supabase = await createServerSupabase();

  const [soumRes, profile] = await Promise.all([
    supabase.from("soumissions").select(SOUMISSION_LIST_SELECT).order("created_at", { ascending: false }).returns<Soumission[]>(),
    getServerProfile(),
  ]);

  const initialSoumissions: Soumission[] = soumRes.data ?? [];
  const initialRole = (profile?.role ?? null) as UserRole | null;

  return (
    <SoumissionsClient
      initialSoumissions={initialSoumissions}
      initialRole={initialRole}
    />
  );
}
