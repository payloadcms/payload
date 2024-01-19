/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '**/*': ['drizzle-kit', 'drizzle-kit/utils'],
    },
    serverComponentsExternalPackages: ['drizzle-kit', 'drizzle-kit/utils', 'pino', 'pino-pretty'],
  },
  // transpilePackages: ['@payloadcms/db-mongodb', 'mongoose'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false, // serverComponentsExternalPackages not working with pnpm workspaces: https://github.com/vercel/next.js/issues/43433
    }

    return {
      ...config,
      externals: [
        ...config.externals,
        'drizzle-kit',
        'drizzle-kit/utils',
        'pino',
        'pino-pretty',
        'mongoose',
      ],
    }
  },
}

module.exports = nextConfig
