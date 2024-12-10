import bundleAnalyzer from '@next/bundle-analyzer'

import withPayload from '../../packages/next/src/withPayload.js'
import path from 'path'
import { fileURLToPath } from 'url'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

export default withBundleAnalyzer(
  withPayload({
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      domains: ['localhost'],
    },
    env: {
      PAYLOAD_CORE_DEV: 'true',
      ROOT_DIR: path.resolve(dirname),
    },
    webpack: (webpackConfig) => {
      webpackConfig.resolve.extensionAlias = {
        '.cjs': ['.cts', '.cjs'],
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.mjs': ['.mts', '.mjs'],
      }

      return webpackConfig
    },
  }),
)
