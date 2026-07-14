import { z } from "zod";

// Variables requises au fonctionnement de base de l'app (toujours présentes en
// prod). Validées au démarrage du serveur → échec clair et immédiat plutôt
// qu'une erreur cryptique à la première requête.
const requiredSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL manquant ou invalide"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY manquant"),
});

// Variables serveur recommandées : on avertit sans bloquer (certaines routes
// seulement en dépendent — export, admin, IA).
const RECOMMENDED_SERVER_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

export function validateEnv(): void {
  const result = requiredSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues.map((i) => `  - ${i.message}`).join("\n");
    throw new Error(`Configuration d'environnement invalide :\n${details}`);
  }
  for (const key of RECOMMENDED_SERVER_VARS) {
    if (!process.env[key]) {
      console.warn(`[env] Variable serveur recommandée absente : ${key}`);
    }
  }
}
