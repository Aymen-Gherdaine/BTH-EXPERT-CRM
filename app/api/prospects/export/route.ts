import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as XLSX from "xlsx-js-style";
import { autoFitColumns, styleHeaders } from "@/lib/excel-utils";
import { getUserRole } from "@/lib/api-roles";

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

const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee:     "Soumission demandée",
  rappel_planifie:         "Rappel planifié",
  pas_interesse:           "Pas intéressé",
  absent:                  "Absent",
  autre:                   "Autre",
  visite_expert_demandee:  "Visite d'expert demandée",
};

const STATUT_LABELS: Record<string, string> = {
  actif:       "Actif",
  sans_suite:  "Sans suite",
  converti:    "Converti",
};

function getLastVisite(visites: { date_visite: string; resultat: string | null; date_prochaine_action: string | null; created_at: string }[]) {
  if (!visites || visites.length === 0) return null;
  return [...visites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

export async function GET() {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const role = await getUserRole(supabase, user.id);
  if (role !== "admin" && role !== "commercial") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs et commerciaux" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("prospects")
    .select("*, visites(id, date_visite, resultat, date_prochaine_action, created_at)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((p) => {
    const lastV = getLastVisite(p.visites ?? []);
    return {
      "Entreprise":               p.entreprise,
      "Secteur":                  p.secteur_activite,
      "Contact":                  p.nom_contact,
      "Poste":                    p.poste_contact ?? "",
      "Téléphone":                p.telephone ?? "",
      "Adresse":                  p.adresse ?? "",
      "Statut":                   STATUT_LABELS[p.statut_global] ?? p.statut_global,
      "Dernière visite":          lastV ? lastV.date_visite : "",
      "Résultat dernière visite": lastV?.resultat ? (RESULTAT_LABELS[lastV.resultat] ?? lastV.resultat) : "",
      "Prochain contact":         lastV?.date_prochaine_action ?? "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  styleHeaders(ws, Object.keys(rows[0] ?? {}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Prospects");
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as unknown as Uint8Array<ArrayBuffer>;
  const blob = new Blob([raw], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="prospects_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
