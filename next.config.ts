import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles deployment natively — no static export needed */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
