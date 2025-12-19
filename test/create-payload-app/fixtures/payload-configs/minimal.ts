import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
})
