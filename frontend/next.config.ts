import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dezactivează procesarea internă de imagini în Node.js (elimină complet consumul mare de RAM și Major GC CPU)
  images: {
    unoptimized: true,
  },
  // Optimizează performanța dev server-ului
  reactStrictMode: false,
};

export default nextConfig;
