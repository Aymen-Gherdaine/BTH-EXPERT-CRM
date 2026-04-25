import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
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
