const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '**/*': ['drizzle-kit', 'drizzle-kit/utils'],
    },
    serverComponentsExternalPackages: ['drizzle-kit', 'drizzle-kit/utils', 'pino', 'pino-pretty'],
  },
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
      ignoreWarnings: [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/mongodb\/lib\/utils\.js/ },
        { file: /node_modules\/mongodb\/lib\/utils\.js/ },
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
          '@aws-sdk/credential-providers': false,
          '@mongodb-js/zstd': false,
          aws4: false,
          kerberos: false,
          'mongodb-client-encryption': false,
          snappy: false,
          'supports-color': false,
        },
      },
    }
  },
}

module.exports = nextConfig
