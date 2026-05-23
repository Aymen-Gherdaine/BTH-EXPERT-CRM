import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SoumissionsClient from "./SoumissionsClient";
import type { Soumission } from "@/types";

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

  const { data } = await supabase
    .from("soumissions")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  const initialSoumissions: Soumission[] = data ?? [];

  return <SoumissionsClient initialSoumissions={initialSoumissions} />;
}
