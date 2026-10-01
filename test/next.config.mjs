import bundleAnalyzer from '@next/bundle-analyzer'

import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(
  withPayload(
    {
      cacheComponents: process.env.PAYLOAD_CACHE_COMPONENTS === 'true',
      devIndicators: {
        position: 'bottom-right',
      },
      typescript: {
        ignoreBuildErrors: true,
      },
      experimental: {
        fullySpecified: true,
        // The `typescript` dependency is aliased to `@typescript/typescript6`, which only ships a
        // `tsc6` bin. Next's CLI mode looks for `typescript/bin/tsc`, so use the compiler API instead.
        useTypeScriptCli: false,
        serverActions: {
          bodySizeLimit: '5mb',
        },
      },
      env: {
        PAYLOAD_CORE_DEV: 'true',
        ROOT_DIR: path.resolve(dirname),
      },
      async redirects() {
        return [
          {
            destination: '/admin',
            permanent: true,
            source: '/',
          },
        ]
      },
      images: {
        remotePatterns: [
          {
            hostname: 'localhost',
          },
        ],
        qualities: [5, 50, 75, 100]
      },
      webpack: (webpackConfig) => {
        webpackConfig.resolve.extensionAlias = {
          '.cjs': ['.cts', '.cjs'],
          '.js': ['.ts', '.tsx', '.js', '.jsx'],
          '.mjs': ['.mts', '.mjs'],
        }

        return webpackConfig
      },
    },
    { devBundleServerPackages: false },
  ),
)
