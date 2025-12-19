import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig as createConfig } from 'payload'

export default createConfig({
  collections: [],
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
})
