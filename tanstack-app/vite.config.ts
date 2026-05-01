import { payloadPlugin } from '@payloadcms/tanstack-start/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const databaseAdapterPath = path.resolve(__dirname, '..', 'test', 'databaseAdapter.js')
if (!fs.existsSync(databaseAdapterPath)) {
  fs.writeFileSync(
    databaseAdapterPath,
    `// Auto-generated fallback for CI builds — overwritten by test harness at runtime
import { mongooseAdapter } from '@payloadcms/db-mongodb'
export const databaseAdapter = mongooseAdapter({
  ensureIndexes: true,
  url: process.env.MONGODB_URL || process.env.DATABASE_URL ||
    'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
})
`,
  )
}

const port = Number(process.env.PORT) || 3000

export default defineConfig((env) =>
  mergeConfig(
    payloadPlugin({
      additionalIgnoreImporters: [
        /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
      ],
      payloadConfigPath: path.resolve(
        __dirname,
        '..',
        'test',
        process.env.PAYLOAD_TEST_SUITE || '_community',
        'config.ts',
      ),
      reactPlugin: viteReact({
        exclude: [],
        include: /\.[jt]sx?$/,
      }),
      rscPlugin: rsc({ serverHandler: false }),
      tanstackStart,
    })(env),
    {
      css: {
        preprocessorOptions: {
          scss: {
            importers: [
              {
                findFileUrl(url: string) {
                  if (url.startsWith('~@payloadcms/ui/scss')) {
                    return new URL(
                      'file://' + path.resolve(__dirname, '../packages/ui/src/scss/styles.scss'),
                    )
                  }
                  return null
                },
              },
            ],
          },
        },
      },
      envDir: path.resolve(__dirname, '..'),
      server: {
        port,
        strictPort: true,
        warmup: {
          clientFiles: [
            './src/app/__root.tsx',
            './src/app/_payload.tsx',
            './src/app/_payload/admin.index.tsx',
            './src/app/_payload/admin.$.tsx',
          ],
        },
      },
    },
  ),
)
