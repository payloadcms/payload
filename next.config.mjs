import bundleAnalyzer from '@next/bundle-analyzer'

import withPayload from './packages/next/src/withPayload.js'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(
  withPayload({
    reactStrictMode: false,
    async redirects() {
      return [
        {
          destination: '/admin',
          permanent: true,
          source: '/',
        },
      ]
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
