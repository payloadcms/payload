const redirects = require('./redirects')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_PAYLOAD_URL],
  },
  redirects,
}

module.exports = nextConfig
