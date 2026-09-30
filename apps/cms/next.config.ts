import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // `file-type` (used to serve uploads) loads `strtok3` through a dynamic import that
  // Next's file tracing cannot follow, so the standalone output would miss these files.
  outputFileTracingIncludes: {
    '/**/*': ['./node_modules/.pnpm/strtok3@*/node_modules/strtok3/lib/**/*.js'],
  },
  // Emits a self-contained server (.next/standalone) that the Docker image runs
  output: 'standalone',
  turbopack: {
    root: path.resolve(dirname),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
