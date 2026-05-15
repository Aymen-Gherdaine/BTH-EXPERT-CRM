import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import DashboardClient from "./DashboardClient";
import type { UserRole } from "@/types";

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user?.id ?? "")
    .single();

  const role: UserRole = (profile?.role as UserRole) ?? "admin";
  const fullName: string = profile?.full_name ?? "";
  const userName = fullName || "Utilisateur";
  const userInitials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return <DashboardClient role={role} userName={userName} userInitials={userInitials} />;
}
