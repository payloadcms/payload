import { mongooseAdapter } from '@payloadcms/db-mongodb'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/payload',
  }),
  secret: process.env.PAYLOAD_SECRET || 'test',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
