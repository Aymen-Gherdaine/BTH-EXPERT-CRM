import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
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
