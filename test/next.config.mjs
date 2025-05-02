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
      eslint: {
        ignoreDuringBuilds: true,
      },
      typescript: {
        ignoreBuildErrors: true,
      },
      experimental: {
        fullySpecified: true,
        serverActions: {
          bodySizeLimit: '5mb',
        },
      },
      env: {
        PAYLOAD_CORE_DEV: 'true',
        ROOT_DIR: path.resolve(dirname),
        // @todo remove in 4.0 - will behave like this by default in 4.0
        PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY: 'true',
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
        domains: ['localhost'],
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
