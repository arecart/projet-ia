/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@xenova/transformers'], // Correction ici
  webpack: (config) => {
    config.externals.push({
      canvas: 'canvas',
      encoding: 'encoding'
    });
    return config;
  }
};

module.exports = nextConfig;