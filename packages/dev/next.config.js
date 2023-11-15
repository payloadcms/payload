/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@payloadcms/db-mongodb', 'mongoose'],
  },
  transpilePackages: ['@payloadcms/db-mongodb', 'mongoose'],
  webpack: (config) => {
    return {
      ...config,
      externals: [...config.externals, 'mongoose'],
    }
  },
}

module.exports = nextConfig
