// Next.js exécute register() une fois au démarrage du serveur (runtime, pas au
// build) → point idéal pour valider la configuration d'environnement et échouer
// tôt avec un message explicite si une variable requise manque.
export async function register() {
  const { validateEnv } = await import("./lib/env");
  validateEnv();
}
