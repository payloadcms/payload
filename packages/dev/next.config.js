/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   serverComponentsExternalPackages: ['@payloadcms/db-mongodb'],
  // },
  // transpilePackages: ['@payloadcms/db-mongodb'],
  webpack: (config) => {
    return {
      ...config,
      externals: [...config.externals, 'mongoose'],
    }
  },
}

module.exports = nextConfig
