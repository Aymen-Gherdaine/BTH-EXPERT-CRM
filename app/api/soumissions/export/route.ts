import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

type SoumissionRow = {
  numero_offre: string;
  date_offre: string;
  titre_projet: string;
  type_etude: string;
  delai_jours: number;
  total_ht: number;
  tva: number;
  total_ttc: number;
  versement_recu: number | null;
  statut: string;
  client: { titre: string; nom_contact: string; entreprise: string } | null;
};

export async function GET() {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("soumissions")
    .select("numero_offre, date_offre, titre_projet, type_etude, delai_jours, total_ht, tva, total_ttc, versement_recu, statut, client:clients(titre, nom_contact, entreprise)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as unknown as SoumissionRow[]).map((s) => ({
    "N° Offre": s.numero_offre,
    "Date": s.date_offre,
    "Entreprise": s.client?.entreprise ?? "",
    "Contact": s.client ? `${s.client.titre} ${s.client.nom_contact}` : "",
    "Titre projet": s.titre_projet,
    "Type étude": s.type_etude,
    "Délai (j)": s.delai_jours,
    "HT (DZD)": s.total_ht,
    "TVA (DZD)": s.tva,
    "TTC (DZD)": s.total_ttc,
    "Versement reçu (DZD)": s.versement_recu ?? 0,
    "Statut": s.statut,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Soumissions");
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as unknown as Uint8Array<ArrayBuffer>;
  const blob = new Blob([raw], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="soumissions_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
