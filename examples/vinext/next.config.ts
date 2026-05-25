import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const nextConfigFilename = fileURLToPath(import.meta.url)
const nextConfigDirname = path.dirname(nextConfigFilename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(nextConfigDirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
