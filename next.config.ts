import type { NextConfig } from "next";

// Hostname du projet Supabase dérivé de l'environnement plutôt que codé en dur :
// garantit que les avatars et signatures (Supabase Storage) chargent quel que
// soit le projet configuré via NEXT_PUBLIC_SUPABASE_URL. Fallback sur le host
// historique si la variable est absente au build (ex. lint/CI sans env).
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname
      || "fxdcajofagujhdhkjxse.supabase.co";
  } catch {
    return "fxdcajofagujhdhkjxse.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  // Ne pas divulguer la stack via l'en-tête X-Powered-By.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Cache du routeur client : en revisitant un onglet déjà ouvert dans la
    // fenêtre ci-dessous, Next réutilise le rendu en cache → navigation
    // INSTANTANÉE, sans re-fetch serveur ni skeleton. (SWR revalide en fond au
    // remontage, donc les données restent fraîches.) Corrige le « skeleton 10 fois ».
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
    // Tree-shaking ciblé : ne charge que les sous-modules réellement utilisés
    // (gros gain sur framer-motion / date-fns / dnd-kit présents sur toutes les pages).
    optimizePackageImports: [
      "framer-motion",
      "date-fns",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
  turbopack: {
    root: __dirname,
  },
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: SUPABASE_HOST,
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    // Avatars issus d'une connexion Google (user_metadata.picture / avatar_url)
    {
      protocol: 'https',
      hostname: '**.googleusercontent.com',
      port: '',
      pathname: '/**',
    },
  ],
},
};

export default nextConfig;
