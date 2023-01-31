/** @type {import('next').NextConfig} */

const redirects = require('./redirects');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_CMS_URL
    ],
  },
  redirects,
}

module.exports = nextConfig
