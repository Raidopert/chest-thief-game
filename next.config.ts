import type { NextConfig } from "next";

const isExport = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // Статический экспорт для GitHub Pages
  output: isExport ? "export" : "standalone",
  // basePath для GitHub Pages: raidopert.github.io/chest-thief-game/
  basePath: isExport ? "/chest-thief-game" : "",
  assetPrefix: isExport ? "/chest-thief-game/" : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // trailingSlash нужен для GitHub Pages — чтобы /chest-thief-game/ работал
  trailingSlash: isExport,
};

export default nextConfig;
