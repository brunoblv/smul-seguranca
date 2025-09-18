import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para Docker
  output: "standalone",

  // Configurações de otimização
  experimental: {
    // Otimizações para produção
    optimizeCss: true,
  },

  // Configurações de imagem
  images: {
    unoptimized: true, // Para Docker
  },

  // Configurações de build
  typescript: {
    // Ignorar erros de tipo durante build (se necessário)
    ignoreBuildErrors: false,
  },

  // Configurações de ESLint
  eslint: {
    // Ignorar erros de ESLint durante build (se necessário)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
