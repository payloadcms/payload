/**
 * These files must remain as plain JavaScript (.js) rather than TypeScript (.ts) because they are
 * imported directly in next.config.mjs files. Since next.config files run before the build process,
 * TypeScript compilation is not available. This ensures compatibility with all templates and
 * user projects regardless of their TypeScript setup.
 */

import { fileURLToPath } from 'node:url'
import {
  devServerExternalPackages as devServerExternalPayloadPackages,
  serverExternalPackages as serverExternalPayloadPackages,
} from 'payload/build-config'

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
  const env = { ...nextConfig.env }
  // Adds `export const instant = false` to the admin layout and page. See `instantLoader.js` for
  // why this cannot live in the generated admin files.
  const instantLoader = nextConfig.cacheComponents
    ? typeof import.meta?.resolve === 'function'
      ? fileURLToPath(new URL('./instantLoader.js', import.meta.url))
      : require.resolve('@payloadcms/next/withPayload/instantLoader')
    : undefined
  const instantLoaderRule = '**/{layout,page}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}'

  if (nextConfig.experimental?.staleTimes?.dynamic) {
    console.warn(
      'Payload: detected a non-zero value for the `staleTimes.dynamic` option in your Next.js config. This will slow down page transitions and may cause stale data to load within the Admin panel. To clear this warning, remove the `staleTimes.dynamic` option from your Next.js config or set it to 0. In the future, Next.js may support scoping this option to specific routes.',
    )
    env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH = 'true'
  }

  if (nextConfig.cacheComponents) {
    env.PAYLOAD_CACHE_COMPONENTS_ENABLED = 'true'
  }

  const consoleWarn = console.warn

  const sassWarningTexts = [
    // This warning is a lie - without silencing import deprecation warnings, sass will spam the console with deprecation warnings
    'Future import deprecation is not yet active, so silencing it is unnecessary',
    // Sometimes happens despite silenceDeprecations
    'The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0',
  ]
  console.warn = (...args) => {
    if (
      (typeof args[1] === 'string' && sassWarningTexts.some((text) => args[1].includes(text))) ||
      (typeof args[0] === 'string' && sassWarningTexts.some((text) => args[0].includes(text)))
    ) {
      return
    }

    consoleWarn(...args)
  }

  /** @type {import('next').NextConfig} */
  const baseConfig = {
    ...nextConfig,
    devIndicators: nextConfig.devIndicators !== undefined ? nextConfig.devIndicators : false,
    env,
    experimental: {
      ...(nextConfig.experimental || {}),
    },
    sassOptions: {
      ...(nextConfig.sassOptions || {}),
      /**
       * This prevents scss warning spam during pnpm dev that looks like this:
       * ⚠ ./path/to/some/index.scss
       * Issue while running loader
       * SassWarning: Deprecation Warning: Sass @import rules are deprecated and
       * will be removed in Dart Sass 3.0.0.
       *
       * More info and automated migrator: https://sass-lang.com/d/import
       *
       * This can be triggered by any `.scss` file in a consumer's project that
       * still uses `@import`.
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
    turbopack: {
      ...(nextConfig.turbopack || {}),
      ...(instantLoader
        ? {
            rules: {
              ...nextConfig.turbopack?.rules,
              [instantLoaderRule]: [
                ...[].concat(nextConfig.turbopack?.rules?.[instantLoaderRule] ?? []),
                {
                  // Only send files that import the admin root components to the loader, so
                  // Turbopack does not run a JavaScript loader for every other layout and page.
                  condition: {
                    all: [
                      { not: 'foreign' },
                      { content: /['"]@payloadcms\/next\/(?:layouts|views)['"]/ },
                    ],
                  },
                  loaders: [instantLoader],
                },
              ],
            },
          }
        : {}),
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
      ...new Set([
        ...(nextConfig.serverExternalPackages || []),
        ...serverExternalPayloadPackages,
        // file-type v22 uses `import(specifier)` with a non-literal specifier, which Turbopack rejects
        // with "Cannot find module as expression is too dynamic"
        'file-type',
        ...(process.env.NODE_ENV === 'development' && options.devBundleServerPackages !== true
          ? devServerExternalPayloadPackages
          : []),
      ]),
    ],
    webpack: (webpackConfig, webpackOptions) => {
      const incomingWebpackConfig =
        typeof nextConfig.webpack === 'function'
          ? nextConfig.webpack(webpackConfig, webpackOptions)
          : webpackConfig

      return {
        ...incomingWebpackConfig,
        ...(instantLoader
          ? {
              module: {
                ...incomingWebpackConfig.module,
                rules: [
                  ...(incomingWebpackConfig.module?.rules || []),
                  {
                    enforce: 'pre',
                    exclude: /node_modules/,
                    test: /[/\\](layout|page)\.(?:[cm]?[jt]s|[jt]sx)$/,
                    use: [instantLoader],
                  },
                ],
              },
            }
          : {}),
        externals: [
          ...(incomingWebpackConfig?.externals || []),
          /**
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

  const trailingSlash = nextConfig.trailingSlash === true ? 'true' : 'false'
  process.env.NEXT_TRAILING_SLASH = trailingSlash
  baseConfig.env.NEXT_TRAILING_SLASH = trailingSlash

  return baseConfig
}

export default withPayload
