import { NextRequest, NextResponse } from "next/server";
import { generatePdf } from "@/lib/generate-pdf";
import { Client, LigneBudget, Soumission } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const {
      soumission,
      client,
      lignes,
      contexteData,
    }: {
      soumission: Soumission;
      client: Client;
      lignes: LigneBudget[];
      contexteData: { section_1: string; section_1_1: string };
    } = await req.json();

    const buffer = generatePdf(soumission, client, lignes, contexteData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Offre_${soumission.numero_offre}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur export PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération PDF" },
      { status: 500 }
    );
  }
}
