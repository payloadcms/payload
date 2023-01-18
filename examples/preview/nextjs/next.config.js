/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_CMS_URL
    ],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'localhost',
    //     port: '3000',
    //     pathname: '/media/**',
    //   },
    // ],
  }
}

module.exports = nextConfig
