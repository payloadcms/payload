const path = require('path')

/** @type {import('next').NextConfig} */
const withPayload = (nextConfig = {}) => {
  const aliases = {
    'payload-config': path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH),
  }

  return {
    ...nextConfig,
    experimental: {
      ...(nextConfig?.experimental || {}),
      outputFileTracingExcludes: {
        '**/*': [
          ...(nextConfig.experimental?.outputFileTracingExcludes?.['**/*'] || []),
          'drizzle-kit',
          'drizzle-kit/utils',
        ],
      },
      serverComponentsExternalPackages: [
        ...(nextConfig?.experimental?.serverComponentsExternalPackages || []),
        'drizzle-kit',
        'drizzle-kit/utils',
        'pino',
        'pino-pretty',
      ],
      turbo: {
        ...(nextConfig?.experimental?.turbo || {}),
        resolveAlias: {
          ...(nextConfig?.experimental?.turbo?.resolveAlias || {}),
          ...aliases,
        },
      },
    },
    webpack: (webpackConfig, webpackOptions) => {
      const incomingWebpackConfig =
        typeof nextConfig.webpack === 'function'
          ? nextConfig.webpack(webpackConfig, webpackOptions)
          : webpackConfig

      return {
        ...incomingWebpackConfig,
        externals: [
          ...(incomingWebpackConfig?.externals || []),
          'drizzle-kit',
          'drizzle-kit/utils',
          'pino',
          'pino-pretty',
          'sharp',
        ],
        ignoreWarnings: [
          ...(incomingWebpackConfig?.ignoreWarnings || []),
          { module: /node_modules\/mongodb\/lib\/utils\.js/ },
          { file: /node_modules\/mongodb\/lib\/utils\.js/ },
          { module: /node_modules\/mongodb\/lib\/bson\.js/ },
          { file: /node_modules\/mongodb\/lib\/bson\.js/ },
        ],
        resolve: {
          ...(incomingWebpackConfig?.resolve || {}),
          alias: {
            ...(incomingWebpackConfig?.resolve?.alias || {}),
            ...aliases,
          },
          fallback: {
            ...(incomingWebpackConfig?.resolve?.fallback || {}),
            '@aws-sdk/credential-providers': false,
            '@mongodb-js/zstd': false,
            aws4: false,
            kerberos: false,
            'mongodb-client-encryption': false,
            snappy: false,
            'supports-color': false,
            'yocto-queue': false,
          },
        },
      }
    },
  }
}

module.exports = { withPayload }
