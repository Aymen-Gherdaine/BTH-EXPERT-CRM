import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DepensesPageClient from "./DepensesPageClient";
import type { Depense } from "@/types";

type SoumissionOption = {
  id: string;
  titre_projet: string;
  numero_offre: string;
};

export default async function DepensesPage() {
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

  const { data: { user } } = await supabase.auth.getUser();

  const [depensesResult, soumissionsResult] = await Promise.all([
    supabase.from("depenses").select("*").order("date_depense", { ascending: false }),
    supabase.from("soumissions").select("id, titre_projet, numero_offre"),
  ]);

  const initialDepenses = (depensesResult.data ?? []) as Depense[];
  const initialSoumissions = (soumissionsResult.data ?? []) as SoumissionOption[];

  return (
    <DepensesPageClient
      initialDepenses={initialDepenses}
      initialSoumissions={initialSoumissions}
      initialUserId={user?.id ?? null}
    />
  );
}
