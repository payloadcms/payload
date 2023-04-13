/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_CMS_URL
    ],
  },
  allowJs: true,
}

module.exports = nextConfig
