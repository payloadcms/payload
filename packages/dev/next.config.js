/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '**/*': ['drizzle-kit', 'drizzle-kit/utils'],
    },
    serverComponentsExternalPackages: [
      'drizzle-kit',
      'drizzle-kit/utils',
      'pino',
      'pino-pretty',
      'mongodb-memory-server',
    ],
  },
  // transpilePackages: ['@payloadcms/db-mongodb', 'mongoose'],
  webpack: (config) => {
    return {
      ...config,
      externals: [
        ...config.externals,
        'drizzle-kit',
        'drizzle-kit/utils',
        'pino',
        'pino-pretty',
        'mongoose',
        'sharp',
      ],
    }
  },
}

module.exports = nextConfig
