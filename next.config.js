const { withPayload } = require('./packages/next/src/withPayload')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(
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
  }),
)
