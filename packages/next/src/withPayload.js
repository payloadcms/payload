/**
 * @param {import('next').NextConfig} nextConfig
 *
 * @returns {import('next').NextConfig}
 * */
export const withPayload = (nextConfig = {}) => {
  return {
    ...nextConfig,
    experimental: {
      ...(nextConfig?.experimental || {}),
      outputFileTracingExcludes: {
        '**/*': [
          ...(nextConfig.experimental?.outputFileTracingExcludes?.['**/*'] || []),
          'drizzle-kit',
          'drizzle-kit/payload',
          'libsql',
        ],
      },
    },
    headers: async () => {
      const headersFromConfig = 'headers' in nextConfig ? await nextConfig.headers() : []

      return [
        ...(headersFromConfig || []),
        {
          source: '/:path*',
          headers: [
            {
              key: 'Accept-CH',
              value: 'Sec-CH-Prefers-Color-Scheme',
            },
            {
              key: 'Vary',
              value: 'Sec-CH-Prefers-Color-Scheme',
            },
            {
              key: 'Critical-CH',
              value: 'Sec-CH-Prefers-Color-Scheme',
            },
          ],
        },
      ]
    },
    serverExternalPackages: [
      ...(nextConfig?.serverExternalPackages || []),
      'drizzle-kit',
      'drizzle-kit/payload',
      'libsql',
      'pino',
      'pino-pretty',
      'graphql',
    ],
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
          'drizzle-kit/payload',
          'sharp',
          'libsql',
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

export default withPayload
