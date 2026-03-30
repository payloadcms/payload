import { postgresAdapter } from '@payloadcms/db-postgres'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload'

import { BmChildA } from './collections/BmChildA.js'
import { BmChildB } from './collections/BmChildB.js'
import { BmParent } from './collections/BmParent.js'
import { Categories } from './collections/Categories.js'
import { Posts } from './collections/Posts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.BENCHMARK_POSTGRES_URL ||
        'postgresql://postgres@127.0.0.1:5432/payload-benchmark',
    },
  }),
  collections: [BmChildA, BmChildB, BmParent, Categories, Posts],
  secret: 'benchmark-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
