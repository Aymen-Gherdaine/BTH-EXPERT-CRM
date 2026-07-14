import type { SupabaseClient } from "@supabase/supabase-js";

// Repli en mémoire (par instance serverless) — utilisé uniquement si le store
// partagé Postgres est indisponible (ex. migration pas encore appliquée).
const requests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitMemory(userId: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = requests.get(userId);

  if (!entry || now > entry.resetAt) {
    requests.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * Rate-limit partagé (Postgres, atomique) via la fonction check_ai_rate_limit.
 * Robuste en serverless multi-instances. Repli automatique sur la Map mémoire
 * si le RPC échoue, pour ne jamais bloquer à cause d'une indisponibilité.
 * Renvoie true si la requête est autorisée.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  max = 10,
  windowSeconds = 60
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_ai_rate_limit", {
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch {
    return checkRateLimitMemory(userId, max, windowSeconds * 1000);
  }
}
