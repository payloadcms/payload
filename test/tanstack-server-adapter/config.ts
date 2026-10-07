import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'

import { databaseAdapter } from '../databaseAdapter.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [],
  db: databaseAdapter,
  editor: lexicalEditor(),
  endpoints: [
    {
      handler: async () => {
        const { tanstackServerAdapter } = await import('@payloadcms/tanstack-start/server')

        await tanstackServerAdapter.setCookie('first-cookie', 'first-value', { path: '/' })
        await tanstackServerAdapter.setCookie('second-cookie', 'second-value', { path: '/' })

        return Response.json({ ok: true })
      },
      method: 'get',
      path: '/set-two-cookies',
    },
  ],
  secret: 'TANSTACK_SERVER_ADAPTER_TEST_SECRET',
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
