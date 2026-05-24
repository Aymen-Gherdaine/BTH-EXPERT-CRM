import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateDocument } from "@/lib/generate-document";
import { buildDocumentData } from "@/lib/export-helpers";
import { Client } from "@/types";
import { exportDocumentSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/schemas/helpers";

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
    const { soumission, client, lignes, contexteData, editablePreview } = validation.data;

    const { data: parametres } = await supabase
      .from("parametres")
      .select("signataire1_nom, signataire1_titre, signataire2_nom, signataire2_titre, tva_pct, validite_jours, modalites_paiement")
      .eq("id", 1)
      .single();

    const data = buildDocumentData(
      soumission as unknown as Parameters<typeof buildDocumentData>[0],
      (client ?? {}) as unknown as Client,
      lignes as unknown as Parameters<typeof buildDocumentData>[2],
      contexteData,
      parametres ?? {},
      editablePreview as unknown as Parameters<typeof buildDocumentData>[5]
    );
    const buffer = generateDocument(data);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Offre_${soumission.numero_offre}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur export DOCX:", error);
    return NextResponse.json({ error: "Erreur lors de la génération DOCX" }, { status: 500 });
  }
}
