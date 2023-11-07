import { mongooseAdapter } from '@payloadcms/db-mongodb'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload/config'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET,
})
