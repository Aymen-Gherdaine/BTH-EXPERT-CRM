import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import NouvellePageClient from "./NouvellePageClient";

export default async function NouvelleSoumissionPage() {
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

  const { data: parametres } = await supabase
    .from("parametres")
    .select("signataire1_nom, signataire1_titre, signataire2_nom, signataire2_titre")
    .single();

  return <NouvellePageClient parametres={parametres} />;
}
