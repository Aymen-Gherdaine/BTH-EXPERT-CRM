import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SoumissionsClient from "./SoumissionsClient";
import type { UserRole } from "@/types";

export default async function SoumissionsPage() {
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
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const role: UserRole = (profile?.role as UserRole) ?? "admin";

  return <SoumissionsClient role={role} />;
}
