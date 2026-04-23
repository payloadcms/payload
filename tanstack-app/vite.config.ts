import { payloadPlugin } from '@payloadcms/tanstack-start/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

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

export default defineConfig(
  payloadPlugin({
    additionalIgnoreImporters: [
      /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
    ],
    envDir: path.resolve(__dirname, '..'),
    payloadConfigPath: path.resolve(
      __dirname,
      '..',
      'test',
      process.env.PAYLOAD_TEST_SUITE || '_community',
      'config.ts',
    ),
    scssImporters: [
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
    warmupClientFiles: [
      './src/app/__root.tsx',
      './src/app/admin.index.tsx',
      './src/app/admin.$.tsx',
    ],
  }),
)
