import type { NextConfig } from "next";

// Statik export — GitHub Pages ve Firebase Hosting'e doğrudan yüklenebilir çıktı üretir.
// Tüm veri işlemleri tarayıcıdan Firestore'a gider; sunucuya ihtiyaç yoktur.
// GitHub Pages'te site /depo-adi/ altında yayınlanır; workflow bu değeri otomatik verir.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
