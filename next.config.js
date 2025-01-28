/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@xenova/transformers'],
  experimental: {
    turbo: {
      // Configuration de Turbopack
      resolveExtensions: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.json',
      ],
      moduleIdStrategy: 'deterministic',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  }
};

module.exports = nextConfig;