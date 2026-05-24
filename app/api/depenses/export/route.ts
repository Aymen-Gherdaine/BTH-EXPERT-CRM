import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as XLSX from "xlsx-js-style";
import { styleHeaders } from "@/lib/excel-utils";

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

type DepenseRow = {
  date_depense: string;
  categorie: string;
  montant: number;
  description: string | null;
  justificatif_url: string | null;
  profiles: { full_name: string; email: string } | null;
  soumissions: { titre_projet: string; numero_offre: string } | null;
};

export async function GET(_req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("depenses")
    .select("date_depense, categorie, montant, description, justificatif_url, profiles(full_name, email), soumissions(titre_projet, numero_offre)")
    .order("date_depense", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as unknown as DepenseRow[]).map((d) => ({
    "Date": d.date_depense,
    "Employé": d.profiles?.full_name ?? "",
    "Email": d.profiles?.email ?? "",
    "Catégorie": d.categorie,
    "Montant (DZD)": d.montant,
    "Description": d.description ?? "",
    "Projet lié": d.soumissions?.titre_projet ?? "",
    "N° offre": d.soumissions?.numero_offre ?? "",
    "Justificatif": d.justificatif_url ? "Oui" : "Non",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  styleHeaders(ws, Object.keys(rows[0] ?? {}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dépenses");
  // Double-cast: XLSX returns Uint8Array<ArrayBufferLike> but Blob expects Uint8Array<ArrayBuffer>
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as unknown as Uint8Array<ArrayBuffer>;
  const blob = new Blob([raw], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="depenses_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
