"use client";

// Capture les erreurs survenant dans le layout racine lui-même (que app/error.tsx
// ne couvre pas). Doit rendre ses propres <html>/<body>. Message générique — on
// n'expose jamais le détail de l'erreur à l'utilisateur.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#faf9f7",
          color: "#1a1714",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <div style={{ width: 32, height: 1, background: "#c9a96e", margin: "0 auto 20px" }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Une erreur est survenue
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px" }}>
            Une erreur inattendue s&rsquo;est produite. Réessayez ou rechargez la page.
          </p>
          {error?.digest && (
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 20px", fontFamily: "monospace" }}>
              Réf : {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              background: "#1a2e1e",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
