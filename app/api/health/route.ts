import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint de santé — non authentifié, sans donnée sensible.
// Vérifie la joignabilité de la base (requête bornée) pour permettre à un
// superviseur externe (uptime monitor, health check Netlify) de détecter une
// panne applicative ou DB. Ne renvoie jamais de détail interne d'erreur.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      { status: "error", database: "unconfigured" },
      { status: 503 }
    );
  }

  try {
    // Requête légère (HEAD + count) : ne lit aucune ligne, valide juste que
    // PostgREST répond. Client anon dédié (pas de cookie/session à charger).
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from("parametres")
      .select("id", { count: "exact", head: true });

    const latencyMs = Date.now() - startedAt;

    if (error) {
      return NextResponse.json(
        { status: "error", database: "unreachable", latencyMs },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "ok", database: "up", latencyMs });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unreachable" },
      { status: 503 }
    );
  }
}
