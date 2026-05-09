import { NextRequest, NextResponse } from "next/server";
import { generateSoumissionContent, SoumissionAIContent } from "@/lib/anthropic";
import { FormDataStep1, FormDataStep2 } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { step1, step2 }: { step1: FormDataStep1; step2: FormDataStep2 } =
      await req.json();

    if (!step1 || !step2) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const data: SoumissionAIContent = await generateSoumissionContent(step1, step2);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur génération IA:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA" },
      { status: 500 }
    );
  }
}
