import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ProspectionPageClient from "./ProspectionPageClient";
import type { Prospect } from "@/types";

export default async function ProspectionPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const [activeRes, allRes] = await Promise.all([
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
    supabase.from("prospects").select("*, visites(*)"),
  ]);

  return (
    <ProspectionPageClient
      initialProspects={(activeRes.data ?? []) as Prospect[]}
      initialKanbanProspects={(allRes.data ?? []) as Prospect[]}
    />
  );
}
