/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@xenova/transformers'], // Correction ici
  experimental: {
    appDir: true, // Activer le répertoire de l'application
    turbo: true, // Activer Turbopack
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  }
};

module.exports = nextConfig;