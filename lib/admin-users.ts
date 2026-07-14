import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserProfile } from "@/types";

function nameFromEmail(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return email;
  return local.replace(/\b\w/g, (m) => m.toUpperCase());
}

function metadataString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Liste des utilisateurs : profils (RLS via `supabase`) enrichis des emails /
 * métadonnées de `auth.users` (service role). Utilisé par GET /api/admin/users
 * ET par le rendu SSR de la page admin (source unique → pas de dérive).
 * L'appelant est responsable de vérifier que l'utilisateur est admin.
 */
export async function getAdminUsersList(
  supabase: SupabaseClient
): Promise<UserProfile[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Emails + métadonnées depuis auth.users via service role.
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    // Pas de clé service role → profils sans email.
    return (profiles ?? []).map((p) => ({ ...p, email: null, is_active: true })) as UserProfile[];
  }

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(
    (authData?.users ?? []).map((u) => {
      const meta = u.user_metadata ?? {};
      const email = u.email ?? null;
      return [u.id, {
        email,
        full_name:
          metadataString(meta.full_name) ??
          metadataString(meta.name) ??
          nameFromEmail(email),
        avatar_url:
          metadataString(meta.avatar_url) ??
          metadataString(meta.picture),
      }];
    })
  );

  const { data: profilesWithActive } = await supabase
    .from("profiles")
    .select("id, is_active");

  const activeMap = new Map(
    (profilesWithActive ?? []).map((p: { id: string; is_active: boolean | null }) => [p.id, p.is_active])
  );

  return (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id);
    return {
      ...p,
      full_name: p.full_name ?? auth?.full_name ?? nameFromEmail(auth?.email ?? null),
      avatar_url: p.avatar_url ?? auth?.avatar_url ?? null,
      email: auth?.email ?? null,
      is_active: activeMap.has(p.id) ? activeMap.get(p.id) ?? true : true,
    };
  }) as UserProfile[];
}
