import bundleAnalyzer from '@next/bundle-analyzer'

import withPayload from './packages/next/src/withPayload.js'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// eslint-disable-next-line no-restricted-exports
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
  }),
)
