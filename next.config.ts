import type { NextConfig } from "next";

const isExport = process.env.BUILD_EXPORT === "true";
const BASE_PATH = isExport ? "/chest-thief" : "";

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  basePath: BASE_PATH,
  // Экспонируем basePath в клиентский код — нужно для построения абсолютных
  // URL к картинкам в CSS background-image (относительные пути ломаются
  // когда Vercel/Cloudflare убирает trailing slash у URL страницы).
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  trailingSlash: isExport,
};

export default nextConfig;
