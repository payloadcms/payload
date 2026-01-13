import type { CollectionConfig } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

const Users: CollectionConfig = {
  slug: 'users',
  fields: [],
}

export default buildConfig({
  collections: [Users],
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  editor: lexicalEditor(),
})
