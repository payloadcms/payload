import bundleAnalyzer from '@next/bundle-analyzer'

import withPayload from './packages/next/src/withPayload.js'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// eslint-disable-next-line no-restricted-exports
export default withBundleAnalyzer(
  withPayload({
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },

    headers: async () => {
      return [
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
