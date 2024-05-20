import bundleAnalyzer from '@next/bundle-analyzer'

import { withPayload } from '@payloadcms/next'

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

    headers: async () => {
      const headersFromNextConfig = await nextConfig.headers()
      console.log('is it run>>>')
      return {
        ...headersFromNextConfig,
        'Accept-CH': 'Sec-CH-Prefers-Color-Scheme',
        Vary: 'Sec-CH-Prefers-Color-Scheme',
        'Critical-CH': 'Sec-CH-Prefers-Color-Scheme',
      }
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
