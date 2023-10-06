/** @type {import('next').NextConfig} */
const nextConfig = {
  // this is only required for local development of the `useLivePreview` hook
  // see `./app/page.client.tsx` for more details
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
