import { NextRequest, NextResponse } from "next/server";
import { generateDocx } from "@/lib/generate-docx";
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

    const buffer = await generateDocx(soumission, client, lignes, contexteData);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Offre_${soumission.numero_offre}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur export DOCX:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération DOCX" },
      { status: 500 }
    );
  }
}
