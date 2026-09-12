import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const nextConfig = {
  webpack: (webpackConfig: {
    resolve: { alias?: Record<string, string>; extensionAlias?: Record<string, string[]> }
  }) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@payload-config': path.resolve(dirname, 'src/payload.config.ts'),
    }
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  reactStrictMode: true,
  // Include the pnpm workspace store in Turbopack's filesystem boundary.
  turbopack: { root: path.resolve(dirname, '../..') },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
