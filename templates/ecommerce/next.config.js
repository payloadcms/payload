/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.stripe.com https://js.stripe.com;
  child-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' https://*.stripe.com https://raw.githubusercontent.com;
  font-src 'self';
  frame-src 'self' https://checkout.stripe.com https://js.stripe.com;
  connect-src 'self' https://checkout.stripe.com;
`

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

    headers.push({
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
        },
      ],
    })

    return headers
  },
}

module.exports = nextConfig
