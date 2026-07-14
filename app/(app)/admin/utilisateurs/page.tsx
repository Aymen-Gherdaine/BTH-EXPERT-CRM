import { redirect } from "next/navigation";
import { createServerSupabase, getServerUser, getServerProfile } from "@/lib/supabase-server";
import { getAdminUsersList } from "@/lib/admin-users";
import UtilisateursClient from "./UtilisateursClient";
import type { UserProfile } from "@/types";

// Rendu côté serveur : la liste des utilisateurs est dans le HTML au premier
// paint. Le rôle admin est re-vérifié ICI (defense-in-depth) — on ne se repose
// pas uniquement sur le middleware. Le client service-role (getAdminUsersList,
// qui contourne la RLS) n'est appelé qu'APRÈS confirmation du rôle admin.
export default async function UtilisateursPage() {
  const supabase = await createServerSupabase();
  const [user, profile] = await Promise.all([getServerUser(), getServerProfile()]);
  if (profile?.role !== "admin") redirect("/dashboard");

  const users = await getAdminUsersList(supabase).catch(() => [] as UserProfile[]);

  return (
    <UtilisateursClient
      initialUsers={users}
      initialCurrentUserId={user?.id ?? null}
    />
  );
}
