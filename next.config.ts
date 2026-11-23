import type { NextConfig } from "next";

const isExport = process.env.BUILD_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  basePath: isExport ? "/chest-thief" : "",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  trailingSlash: isExport,
};

export default nextConfig;
