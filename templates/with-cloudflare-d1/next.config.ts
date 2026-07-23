import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { withPayload } from '@payloadcms/next/withPayload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Payload's REST handler statically imports the OG image endpoint
// (@payloadcms/next/dist/routes/rest/og/index.js), which imports `next/og.js`
// (ImageResponse) — pulling ~2.9 MiB of @vercel/og WASM + fonts into the
// Worker bundle. @vercel/og works on Workers through OpenNext's compatibility
// patches, but the ~744 KiB gzip cost pushes the template over the free-tier
// 3 MiB limit. This template sets `admin.meta.defaultOGImageType: 'off'` in
// src/payload.config.ts, so the endpoint module is aliased to a stub that
// mirrors the disabled behavior and keeps the entire @vercel/og dependency
// chain out of the bundle.
const require = createRequire(import.meta.url)
const payloadNextRoutesPath = require.resolve('@payloadcms/next/routes')
const payloadNextDistDir = path.dirname(path.dirname(payloadNextRoutesPath))
const ogEndpointPath = path.join(payloadNextDistDir, 'routes/rest/og/index.js')
const ogStubPath = path.resolve(dirname, 'stubs/payload-og-endpoint.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // drizzle-kit/api is only used by the Payload CLI for migrations, not at
  // runtime. withPayload() externalizes it via webpack externals and
  // serverExternalPackages, but OpenNext's esbuild bundler does not fully
  // respect those. Aliasing to a stub prevents the 7.3 MiB module from
  // entering the Worker bundle.
  // See: https://github.com/payloadcms/payload/issues/16470
  turbopack: {
    resolveAlias: {
      'drizzle-kit/api': path.resolve(dirname, 'stubs/drizzle-kit-api.js'),
      [ogEndpointPath]: ogStubPath,
    },
  },

  // Your Next.js config here
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'drizzle-kit/api': path.resolve(dirname, 'stubs/drizzle-kit-api.js'),
      [ogEndpointPath]: ogStubPath,
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
