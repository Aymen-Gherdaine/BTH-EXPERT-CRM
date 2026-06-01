import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { generateDocument } from "@/lib/generate-document";
import { convertDocxToPdf } from "@/lib/convert-to-pdf";
import { buildDocumentData } from "@/lib/export-helpers";
import { Client } from "@/types";
import { exportDocumentSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

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

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const body = await req.json();
    const validation = validateBody(exportDocumentSchema, body);
    if (!validation.success) return validation.response;
    const { soumission, client, lignes, contexteData, editablePreview, parametres: payloadParametres } = validation.data;

    const admin = getAdminSupabase();
    const { data: dbParametres, error: parametresError } = await admin
      .from("parametres")
      .select("signataire1_nom, signataire1_titre, signataire2_nom, signataire2_titre, tva_pct, validite_jours, modalites_paiement")
      .eq("id", 1)
      .single();

    if (parametresError || !dbParametres) {
      console.error("Parametres DB fetch failed:", parametresError?.message ?? "no row");
    }

    const parametres = {
      ...dbParametres,
      signataire1_nom: dbParametres?.signataire1_nom ?? payloadParametres?.signataire1_nom,
      signataire1_titre: dbParametres?.signataire1_titre ?? payloadParametres?.signataire1_titre,
      signataire2_nom: dbParametres?.signataire2_nom ?? payloadParametres?.signataire2_nom,
      signataire2_titre: dbParametres?.signataire2_titre ?? payloadParametres?.signataire2_titre,
    };

    const data = buildDocumentData(
      soumission as unknown as Parameters<typeof buildDocumentData>[0],
      (client ?? {}) as unknown as Client,
      lignes as unknown as Parameters<typeof buildDocumentData>[2],
      contexteData,
      parametres,
      editablePreview as unknown as Parameters<typeof buildDocumentData>[5]
    );
    const docxBuffer = generateDocument(data, true);
    const pdfBuffer = await convertDocxToPdf(docxBuffer);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Offre_${soumission.numero_offre}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur export PDF:", error);
    return NextResponse.json({ error: "Erreur lors de la génération PDF" }, { status: 500 });
  }
}
