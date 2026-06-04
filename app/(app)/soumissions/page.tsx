import { createServerSupabase, getServerProfile } from "@/lib/supabase-server";
import SoumissionsClient from "./SoumissionsClient";
import type { Soumission, UserRole } from "@/types";

export default async function SoumissionsPage() {
  const supabase = await createServerSupabase();

  const [soumRes, profile] = await Promise.all([
    supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }),
    getServerProfile(),
  ]);

  const initialSoumissions: Soumission[] = (soumRes.data ?? []) as Soumission[];
  const initialRole = (profile?.role ?? null) as UserRole | null;

  return (
    <SoumissionsClient
      initialSoumissions={initialSoumissions}
      initialRole={initialRole}
    />
  );
}
