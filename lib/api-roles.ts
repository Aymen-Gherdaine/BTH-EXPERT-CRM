import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rôle applicatif de l'utilisateur (profiles.role), ou undefined si absent.
 * Utilisé par les routes API pour les contrôles d'autorisation côté serveur.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<string | undefined> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();
  return data?.role;
}
