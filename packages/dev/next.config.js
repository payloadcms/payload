const path = require('path')

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
  transpilePackages: ['mongoose', 'sharp'],
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
        'sharp',
      ],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          graphql$: path.resolve(__dirname, '../next/node_modules/graphql/index.js'),
          'graphql-http$': path.resolve(__dirname, '../next/node_modules/graphql-http/index.js'),
        },
        fallback: {
          ...config.resolve.fallback,
          '@smithy/middleware-endpoint': false,
          aws4: false,
          'mongodb-client-encryption': false,
        },
      },
    }
  },
}

module.exports = nextConfig
