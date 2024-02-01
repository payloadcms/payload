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
  reactStrictMode: false,
  // transpilePackages: ['@payloadcms/db-mongodb', 'mongoose'],
  webpack: (config) => {
    if (process.env.PAYLOAD_CONFIG_PATH) {
      config.resolve.alias['payload-config'] = process.env.PAYLOAD_CONFIG_PATH
    }

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
