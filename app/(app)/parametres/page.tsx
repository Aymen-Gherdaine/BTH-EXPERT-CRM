import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ParametresPageClient from "./ParametresPageClient";
import { DEFAULTS } from "./defaults";
import type { Parametres } from "./defaults";

export default async function ParametresPage() {
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

  const { data } = await supabase.from("parametres").select("*").single();

  const initialData: Parametres = data ? {
    nom_societe: data.nom_societe ?? DEFAULTS.nom_societe,
    adresse: data.adresse ?? DEFAULTS.adresse,
    ville: data.ville ?? DEFAULTS.ville,
    email_contact: data.email_contact ?? DEFAULTS.email_contact,
    telephone: data.telephone ?? DEFAULTS.telephone,
    site_web: data.site_web ?? DEFAULTS.site_web,
    signataire1_nom: data.signataire1_nom ?? DEFAULTS.signataire1_nom,
    signataire1_titre: data.signataire1_titre ?? DEFAULTS.signataire1_titre,
    signataire2_nom: data.signataire2_nom ?? DEFAULTS.signataire2_nom,
    signataire2_titre: data.signataire2_titre ?? DEFAULTS.signataire2_titre,
    tva_pct: data.tva_pct ?? DEFAULTS.tva_pct,
    delai_jours: data.delai_jours ?? DEFAULTS.delai_jours,
    validite_jours: data.validite_jours ?? DEFAULTS.validite_jours,
    modalites_paiement: data.modalites_paiement ?? DEFAULTS.modalites_paiement,
    signature_responsable_url: data.signature_responsable_url ?? "",
    signature_autorise_url: data.signature_autorise_url ?? "",
  } : DEFAULTS;

  return <ParametresPageClient initialData={initialData} />;
}
