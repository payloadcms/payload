const { withPayload } = require('@payloadcms/next/withPayload')
/** @type {import('next').NextConfig} */
module.exports = withPayload({
  eslint: {
    // Disabling on production builds because we're running checks on PRs via GitHub Actions.
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ hostname: 'localhost' }, { hostname: process.env.NEXT_PUBLIC_IMAGE_HOST }],
  },
  async redirects() {
    return [
      {
        source: '/password',
        destination: '/',
        permanent: true,
      },
    ]
  },
})
