import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateSoumissionContent, SoumissionAIContent } from "@/lib/anthropic";
import { FormDataStep1, FormDataStep2 } from "@/types";

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
