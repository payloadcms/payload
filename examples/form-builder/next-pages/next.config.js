/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_PAYLOAD_URL || ''].filter(Boolean),
  },
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
