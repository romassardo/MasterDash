import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone para Docker
  output: 'standalone',
  
  // Configuración de imágenes
  images: {
    remotePatterns: [],
  },
  
  // Optimizaciones experimentales
  experimental: {
    // Optimizar paquetes del servidor
    optimizePackageImports: ['lucide-react', '@tremor/react', 'echarts'],
  },
};

export default nextConfig;
