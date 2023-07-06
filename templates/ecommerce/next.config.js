/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SERVER_URL],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'localhost',
    //     port: '3000',
    //     pathname: '/media/**',
    //   },
    // ],
  },
  async headers() {
    const headers = []

    if (!process.env.NEXT_PUBLIC_IS_LIVE) {
      headers.push({
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
        source: '/:path*',
      })
    }
    return headers
  },
}

module.exports = nextConfig
