import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateSoumissionContent, SoumissionAIContent } from "@/lib/anthropic";
import { FormDataStep1, FormDataStep2 } from "@/types";
import { generateSchema } from "@/lib/schemas";
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
    const validation = validateBody(generateSchema, body);
    if (!validation.success) return validation.response;
    const { step1, step2 } = validation.data;

    const data: SoumissionAIContent = await generateSoumissionContent(
      step1 as unknown as FormDataStep1,
      step2 as unknown as FormDataStep2
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur génération IA:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA" },
      { status: 500 }
    );
  }
}
