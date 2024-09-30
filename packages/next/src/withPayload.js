/**
 * @param {import('next').NextConfig} nextConfig
 * @param {Object} [options] - Optional configuration object.
 * @param {string} [options.adminRoute='/admin'] - The route for the admin panel. This should match the routes.admin value in the Payload config.
 *
 * @returns {import('next').NextConfig}
 * */
export const withPayload = (nextConfig = {}, { adminRoute = '/admin' } = {}) => {
  const env = nextConfig?.env || {}

  if (nextConfig.experimental?.staleTimes?.dynamic) {
    console.warn(
      'Payload detected a non-zero value for the `staleTimes.dynamic` option in your Next.js config. This will slow down page transitions and may cause stale data to load within the Admin panel. To clear this warning, remove the `staleTimes.dynamic` option from your Next.js config or set it to 0. In the future, Next.js may support scoping this option to specific routes.',
    )
    env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH = 'true'
  }

  /**
   * @type {import('next').NextConfig}
   */
  const toReturn = {
    ...nextConfig,
    env,
    outputFileTracingExcludes: {
      ...(nextConfig?.outputFileTracingExcludes || {}),
      '**/*': [
        ...(nextConfig?.outputFileTracingExcludes?.['**/*'] || []),
        'drizzle-kit',
        'drizzle-kit/api',
      ],
    },
    outputFileTracingIncludes: {
      ...(nextConfig?.outputFileTracingIncludes || {}),
      '**/*': [...(nextConfig?.outputFileTracingIncludes?.['**/*'] || []), '@libsql/client'],
    },
    experimental: {
      ...(nextConfig?.experimental || {}),
      turbo: {
        ...(nextConfig?.experimental?.turbo || {}),
        resolveAlias: {
          ...(nextConfig?.experimental?.turbo?.resolveAlias || {}),
          'payload-mock-package': 'payload-mock-package',
        },
      },
    },
    headers: async () => {
      const headersFromConfig = 'headers' in nextConfig ? await nextConfig.headers() : []

      return [
        ...(headersFromConfig || []),
        {
          source: `${adminRoute}/:path*`,
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
      'drizzle-kit/api',
      'pino',
      'libsql',
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
          'drizzle-kit/api',
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

  if (nextConfig.basePath) {
    toReturn.env.NEXT_BASE_PATH = nextConfig.basePath
  }

  return toReturn
}

export default withPayload
