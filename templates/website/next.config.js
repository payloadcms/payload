import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SERVER_URL]
      .filter(Boolean)
      .map((url) => url.replace(/https?:\/\//, '')),
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig)
