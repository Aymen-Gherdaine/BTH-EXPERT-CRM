import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/generate-document";
import { buildDocumentData } from "@/lib/export-helpers";
import { supabase } from "@/lib/supabase";
import { Client, LigneBudget, Soumission } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { soumission, client, lignes, contexteData }: {
      soumission: Soumission;
      client: Client;
      lignes: LigneBudget[];
      contexteData: { section_1: string; section_1_1: string };
    } = await req.json();

    const { data: parametres } = await supabase
      .from("parametres")
      .select("signataire1_nom, signataire1_titre, signataire2_nom, signataire2_titre, tva_pct, validite_jours")
      .eq("id", 1)
      .single();

    const data = buildDocumentData(soumission, client, lignes, contexteData, parametres ?? {});
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
