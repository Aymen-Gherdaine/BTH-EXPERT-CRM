// Next.js exécute register() une fois au démarrage du serveur (runtime, pas au
// build) → point idéal pour valider la configuration d'environnement et échouer
// tôt avec un message explicite si une variable requise manque.
export async function register() {
  const { validateEnv } = await import("./lib/env");
  validateEnv();
}

// Hook officiel Next.js appelé pour toute erreur non capturée survenue pendant
// le rendu serveur ou l'exécution d'une route API. Avant, une erreur en prod
// était invisible (aucun monitoring) : on émet désormais un log structuré
// (JSON une ligne) récupérable dans les logs de fonctions Netlify.
//
// Point d'extension Sentry : si SENTRY_DSN est défini et le SDK installé, on
// relaie ici via Sentry.captureException(err). Sans SDK, on reste en logs
// structurés (aucune dépendance, aucun risque de build).
export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string }
) {
  try {
    const e = err as { message?: string; stack?: string; digest?: string };
    console.error(
      JSON.stringify({
        level: "error",
        source: "onRequestError",
        message: e?.message ?? String(err),
        digest: e?.digest,
        method: request?.method,
        path: request?.path,
        routePath: context?.routePath,
        renderSource: context?.renderSource,
        stack: e?.stack,
      })
    );
  } catch {
    // Ne jamais laisser le hook de monitoring jeter (masquerait l'erreur réelle).
    console.error("onRequestError: échec de sérialisation de l'erreur");
  }
}
