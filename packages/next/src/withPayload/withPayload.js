/**
 * These files must remain as plain JavaScript (.js) rather than TypeScript (.ts) because they are
 * imported directly in next.config.mjs files. Since next.config files run before the build process,
 * TypeScript compilation is not available. This ensures compatibility with all templates and
 * user projects regardless of their TypeScript setup.
 */
import {
  getNextjsVersion,
  supportsTurbopackExternalizeTransitiveDependencies,
} from './withPayload.utils.js'
import { withPayloadLegacy } from './withPayloadLegacy.js'

const poweredByHeader = {
  key: 'X-Powered-By',
  value: 'Next.js, Payload',
}

/**
 * @param {import('next').NextConfig} nextConfig
 * @param {Object} [options] - Optional configuration options
 * @param {boolean} [options.devBundleServerPackages] - Whether to bundle server packages in development mode. @default false
 * */
export const withPayload = (nextConfig = {}, options = {}) => {
  const nextjsVersion = getNextjsVersion()

  const supportsTurbopackBuild = supportsTurbopackExternalizeTransitiveDependencies(nextjsVersion)

  const env = nextConfig.env || {}

  if (nextConfig.experimental?.staleTimes?.dynamic) {
    console.warn(
      'Payload detected a non-zero value for the `staleTimes.dynamic` option in your Next.js config. This will slow down page transitions and may cause stale data to load within the Admin panel. To clear this warning, remove the `staleTimes.dynamic` option from your Next.js config or set it to 0. In the future, Next.js may support scoping this option to specific routes.',
    )
    env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH = 'true'
  }

  const consoleWarn = console.warn
  const sassWarningText =
    'Future import deprecation is not yet active, so silencing it is unnecessary'
  console.warn = (...args) => {
    if (
      (typeof args[1] === 'string' && args[1].includes(sassWarningText)) ||
      (typeof args[0] === 'string' && args[0].includes(sassWarningText))
    ) {
      // This warning is a lie - without silencing import deprecation warnings, sass will spam the console with deprecation warnings
      return
    }

    consoleWarn(...args)
  }

  /** @type {import('next').NextConfig} */
  const baseConfig = {
    ...nextConfig,
    env,
    sassOptions: {
      ...(nextConfig.sassOptions || {}),
      /**
       * This prevents scss warning spam during pnpm dev that looks like this:
       * ⚠ ./test/admin/components/views/CustomMinimal/index.scss
       * Issue while running loader
       * SassWarning: Deprecation Warning on line 8, column 8 of file:///Users/alessio/Documents/GitHub/ payload/packages/ui/src/scss/styles.scss:8:8:
       * Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.
       *
       * More info and automated migrator: https://sass-lang.com/d/import
       *
       * 8 | @import 'queries';
       *
       *
       * packages/ui/src/scss/styles.scss 9:9                      @import
       * test/admin/components/views/CustomMinimal/index.scss 1:9  root stylesheet
       *
       * @todo: update all outdated scss imports to use @use instead of @import. Then, we can remove this.
       */
      silenceDeprecations: [...(nextConfig.sassOptions?.silenceDeprecations || []), 'import'],
    },
    outputFileTracingExcludes: {
      ...(nextConfig.outputFileTracingExcludes || {}),
      '**/*': [
        ...(nextConfig.outputFileTracingExcludes?.['**/*'] || []),
        'drizzle-kit',
        'drizzle-kit/api',
      ],
    },
    outputFileTracingIncludes: {
      ...(nextConfig.outputFileTracingIncludes || {}),
      '**/*': [...(nextConfig.outputFileTracingIncludes?.['**/*'] || []), '@libsql/client'],
    },
    turbopack: {
      ...(nextConfig.turbopack || {}),
    },
    // We disable the poweredByHeader here because we add it manually in the headers function below
    ...(nextConfig.poweredByHeader !== false ? { poweredByHeader: false } : {}),
    headers: async () => {
      const headersFromConfig = 'headers' in nextConfig ? await nextConfig.headers() : []

      return [
        ...(headersFromConfig || []),
        {
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
            ...(nextConfig.poweredByHeader !== false ? [poweredByHeader] : []),
          ],
          source: '/:path*',
        },
      ]
    },
    serverExternalPackages: [
      ...(nextConfig.serverExternalPackages || []),
      // WHY: without externalizing graphql, a graphql version error will be thrown
      // during runtime ("Ensure that there is only one instance of \"graphql\" in the node_modules\ndirectory.")
      'graphql',
      ...(process.env.NODE_ENV === 'development' && options.devBundleServerPackages !== true
        ? /**
           * Unless explicitly disabled by the user, by passing `devBundleServerPackages: true` to withPayload, we
           * do not bundle server-only packages during dev for two reasons:
           *
           * 1. Performance: Fewer files to compile means faster compilation speeds.
           * 2. Turbopack support: Webpack's externals are not supported by Turbopack.
           *
           * Regarding Turbopack support: Unlike webpack.externals, we cannot use serverExternalPackages to
           * externalized packages that are not resolvable from the project root. So including a package like
           * "drizzle-kit" in here would do nothing - Next.js will ignore the rule and still bundle the package -
           * because it detects that the package is not resolvable from the project root (= not directly installed
           * by the user in their own package.json).
           *
           * Instead, we can use serverExternalPackages for the entry-point packages that *are* installed directly
           * by the user (e.g. db-postgres, which then installs drizzle-kit as a dependency).
           *
           *
           *
           * We should only do this during development, not build, because externalizing these packages can hurt
           * the bundle size. Not only does it disable tree-shaking, it also risks installing duplicate copies of the
           * same package.
           *
           * Example:
           * - @payloadcms/richtext-lexical (in bundle) -> installs qs-esm (bundled because of importer)
           * - payload (not in bundle, external) -> installs qs-esm (external because of importer)
           * Result: we have two copies of qs-esm installed - one in the bundle, and one in node_modules.
           *
           * During development, these bundle size difference do not matter much, and development speed /
           * turbopack support are more important.
           */
          [
            'payload',
            '@payloadcms/db-mongodb',
            '@payloadcms/db-postgres',
            '@payloadcms/db-sqlite',
            '@payloadcms/db-vercel-postgres',
            '@payloadcms/db-d1-sqlite',
            '@payloadcms/drizzle',
            '@payloadcms/email-nodemailer',
            '@payloadcms/email-resend',
            '@payloadcms/graphql',
            '@payloadcms/payload-cloud',
            '@payloadcms/plugin-redirects',
            // TODO: Add the following packages, excluding their /client subpath exports, once Next.js supports it
            // see: https://github.com/vercel/next.js/discussions/76991
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
          /**
           * See the explanation in the serverExternalPackages section above.
           * We need to force Webpack to emit require() calls for these packages, even though they are not
           * resolvable from the project root. You would expect this to error during runtime, but Next.js seems to be able to require these just fine.
           *
           * This is the only way to get Webpack Build to work, without the bundle size caveats of externalizing the
           * entry point packages, as explained in the serverExternalPackages section above.
           */
          'drizzle-kit',
          'drizzle-kit/api',
          'sharp',
          'libsql',
          'require-in-the-middle',
          'json-schema-to-typescript',
        ],
        plugins: [
          ...(incomingWebpackConfig?.plugins || []),
          // Fix cloudflare:sockets error: https://github.com/vercel/next.js/discussions/50177
          new webpackOptions.webpack.IgnorePlugin({
            resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
          }),
        ],
        resolve: {
          ...(incomingWebpackConfig?.resolve || {}),
          alias: {
            ...(incomingWebpackConfig?.resolve?.alias || {}),
          },
          fallback: {
            ...(incomingWebpackConfig?.resolve?.fallback || {}),
            /*
             * This fixes the following warning when running next build with webpack (tested on Next.js 16.0.3 with Payload 3.64.0):
             *
             * ⚠ Compiled with warnings in 8.7s
             *
             * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/deps.js
             * Module not found: Can't resolve 'aws4' in '/Users/alessio/Documents/temp/next16p/node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib'
             *
             * Import trace for requested module:
             * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/deps.js
             * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/client-side-encryption/client_encryption.js
             * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/index.js
             * ./node_modules/.pnpm/mongoose@8.15.1/node_modules/mongoose/lib/index.js
             * ./node_modules/.pnpm/mongoose@8.15.1/node_modules/mongoose/index.js
             * ./node_modules/.pnpm/@payloadcms+db-mongodb@3.64.0_payload@3.64.0_graphql@16.12.0_typescript@5.7.3_/node_modules/@payloadcms/db-mongodb/dist/index.js
             * ./src/payload.config.ts
             * ./src/app/my-route/route.ts
             *
             **/
            aws4: false,
          },
        },
      }
    },
  }

  if (nextConfig.basePath) {
    process.env.NEXT_BASE_PATH = nextConfig.basePath
    baseConfig.env.NEXT_BASE_PATH = nextConfig.basePath
  }

  if (!supportsTurbopackBuild) {
    return withPayloadLegacy(baseConfig)
  } else {
    return {
      ...baseConfig,
      serverExternalPackages: [
        ...(baseConfig.serverExternalPackages || []),
        'drizzle-kit',
        'drizzle-kit/api',
        'sharp',
        'libsql',
        'require-in-the-middle',
        'json-schema-to-typescript',
        // Prevents turbopack build errors by the thread-stream package which is installed by pino
        'pino',
      ],
    }
  }
}

export default withPayload
