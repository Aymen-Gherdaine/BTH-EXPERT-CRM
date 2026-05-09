import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/generate-document";
import { convertToPdf } from "@/lib/convert-to-pdf";
import { buildDocumentData } from "@/lib/export-helpers";
import { supabase } from "@/lib/supabase";
import { Client, EditablePreview, LigneBudget, Soumission } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      soumission,
      client,
      lignes,
      contexteData,
      editablePreview,
    }: {
      soumission: Soumission;
      client?: Client;
      lignes: LigneBudget[];
      contexteData?: { section_1: string; section_1_1: string };
      editablePreview?: EditablePreview;
    } = body;

    const { data: parametres } = await supabase
      .from("parametres")
      .select("signataire1_nom, signataire1_titre, signataire2_nom, signataire2_titre, tva_pct, validite_jours")
      .eq("id", 1)
      .single();

    const data = buildDocumentData(
      soumission,
      client ?? ({} as Client),
      lignes,
      contexteData,
      parametres ?? {},
      editablePreview
    );
    const docxBuffer = generateDocument(data, true);
    const pdfBuffer = await convertToPdf(docxBuffer);

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
