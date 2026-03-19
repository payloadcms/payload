import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vitest/config'

// Use process.cwd() to be safe in both CJS and ESM contexts within Vitest
const ROOT_DIR = process.cwd()
const figmaPath = path.resolve(ROOT_DIR, '../enterprise-plugins/packages/figma/src/index.ts')
const hasFigma = fs.existsSync(figmaPath)

console.log('[Dev Setup] Checking for local Figma plugin at:', figmaPath)
if (hasFigma) {
  console.log('[Dev Setup] Using local @payloadcms/figma source')
} else {
  console.log('[Dev Setup] Local Figma plugin NOT found, using node_modules')
}

export default defineConfig({
  resolve: {
    alias: {
      ...(hasFigma ? { '@payloadcms/figma': figmaPath } : {}),
    },
  },
  test: {
    watch: false, // too troublesome especially with the in memory DB setup
    // Retry failed tests up to 2 times in CI to handle flaky tests (e.g. due to timing-sensitive int tests like job queues, installation failures due to temporary network issues)
    retry: process.env.CI ? 2 : 0,
    server: {
      deps: {
        inline: [/@payloadcms\/figma/],
      },
    },
    projects: [
      {
        test: {
          include: ['packages/**/*.spec.ts'],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: {
            graphql: 'node_modules/graphql/index.js', // https://github.com/vitest-dev/vitest/issues/4605
            ...(hasFigma ? { '@payloadcms/figma': figmaPath } : {}),
          },
        },
        test: {
          include: ['test/**/*int.spec.ts'],
          name: 'int',
          environment: 'node',
          fileParallelism: false,
          hookTimeout: 90000,
          testTimeout: 90000,
          setupFiles: ['./test/vitest.setup.ts'],
        },
      },
    ],
  },
})
