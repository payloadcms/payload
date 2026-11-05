import { mongooseAdapter } from '@payloadcms/db-mongodb'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseURL =
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL ||
  'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0'

/** A tiny real Payload config the runtime eval boots against the test database. */
export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      versions: false,
    },
  ],
  db: mongooseAdapter({
    ensureIndexes: true,
    url: databaseURL,
  }),
  secret: 'eval-runtime',
})
