/**
 * @param {import('next').NextConfig} nextConfig
 * @param {Object} [options] - Optional configuration options
 * @param {boolean} [options.devBundleServerPackages] - Whether to bundle server packages in development mode. @default true
 *
 * @returns {import('next').NextConfig}
 * */
export const withPayload = (nextConfig = {}, options = {}) => {
  const env = nextConfig?.env || {}

  if (nextConfig.experimental?.staleTimes?.dynamic) {
    console.warn(
      'Payload detected a non-zero value for the `staleTimes.dynamic` option in your Next.js config. This will slow down page transitions and may cause stale data to load within the Admin panel. To clear this warning, remove the `staleTimes.dynamic` option from your Next.js config or set it to 0. In the future, Next.js may support scoping this option to specific routes.',
    )
    env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH = 'true'
  }

  if (process.env.PAYLOAD_PATCH_TURBOPACK_WARNINGS !== 'false') {
    const turbopackWarningText =
      'Packages that should be external need to be installed in the project directory, so they can be resolved from the output files.\nTry to install it into the project directory by running'

    const consoleWarn = console.warn
    console.warn = (...args) => {
      // Force to disable serverExternalPackages warnings: https://github.com/vercel/next.js/issues/68805
      if (
        (typeof args[1] === 'string' && args[1].includes(turbopackWarningText)) ||
        (typeof args[0] === 'string' && args[0].includes(turbopackWarningText))
      ) {
        return
      }

      consoleWarn(...args)
    }
  }

  const poweredByHeader = {
    key: 'X-Powered-By',
    value: 'Next.js, Payload',
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
    // We disable the poweredByHeader here because we add it manually in the headers function below
    ...(nextConfig?.poweredByHeader !== false ? { poweredByHeader: false } : {}),
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
            ...(nextConfig?.poweredByHeader !== false ? [poweredByHeader] : []),
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
      // Do not bundle server-only packages during dev to improve compile speed
      ...(process.env.NODE_ENV === 'development' && options.devBundleServerPackages === false
        ? [
            'payload',
            '@payloadcms/db-mongodb',
            '@payloadcms/db-postgres',
            '@payloadcms/db-sqlite',
            '@payloadcms/db-vercel-postgres',
            '@payloadcms/drizzle',
            '@payloadcms/email-nodemailer',
            '@payloadcms/email-resend',
            '@payloadcms/graphql',
            '@payloadcms/payload-cloud',
            '@payloadcms/plugin-redirects',
            // TODO: Add the following packages, excluding their /client subpath exports, once Next.js supports it
            //'@payloadcms/plugin-cloud-storage',
            //'@payloadcms/plugin-sentry',
            //'@payloadcms/plugin-stripe',
            // @payloadcms/richtext-lexical
            //'@payloadcms/storage-azure',
            //'@payloadcms/storage-gcs',
            //'@payloadcms/storage-s3',
            //'@payloadcms/storage-uploadthing',
            //'@payloadcms/storage-vercel-blob',
          ]
        : []),
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
