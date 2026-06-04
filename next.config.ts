import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      hostname: 'fxdcajofagujhdhkjxse.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
};

export default nextConfig;
