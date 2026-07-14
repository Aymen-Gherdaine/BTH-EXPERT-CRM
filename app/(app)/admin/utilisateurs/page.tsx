import { createServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getAdminUsersList } from "@/lib/admin-users";
import UtilisateursClient from "./UtilisateursClient";
import type { UserProfile } from "@/types";

// Rendu côté serveur : la liste des utilisateurs est dans le HTML au premier
// paint (plus de spinner ni d'aller-retour au montage). L'accès admin est déjà
// garanti par le middleware (proxy.ts). SWR/revalidation en fond côté client.
export default async function UtilisateursPage() {
  const supabase = await createServerSupabase();
  const [user, users] = await Promise.all([
    getServerUser(),
    getAdminUsersList(supabase).catch(() => [] as UserProfile[]),
  ]);

  return (
    <UtilisateursClient
      initialUsers={users}
      initialCurrentUserId={user?.id ?? null}
    />
  );
}
