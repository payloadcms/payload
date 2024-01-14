/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '**/*': ['drizzle-kit', 'drizzle-kit/utils'],
    },
    serverComponentsExternalPackages: ['drizzle-kit', 'drizzle-kit/utils', 'pino', 'pino-pretty'],
  },
  // transpilePackages: ['@payloadcms/db-mongodb', 'mongoose'],
  webpack: (config) => {
    return {
      ...config,
      externals: [
        ...config.externals,
        '@payloadcms/db-mongodb',
        '@payloadcms/db-postgres',
        'drizzle-kit',
        'drizzle-kit/utils',
        'pino',
        'pino-pretty',
        'mongoose',
      ],
    }
  },
}

module.exports = nextConfig
