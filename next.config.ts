import type { NextConfig } from "next";

// Statik export — Firebase Hosting'e doğrudan yüklenebilir çıktı üretir.
// Tüm veri işlemleri tarayıcıdan Firestore'a gider; sunucuya ihtiyaç yoktur.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
