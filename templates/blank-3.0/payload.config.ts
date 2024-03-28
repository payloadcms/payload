import { mongooseAdapter } from '@payloadcms/db-mongodb' // database-adapter-import
import { payloadCloud } from '@payloadcms/plugin-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical' // editor-import
import path from 'path'
import { buildConfig } from 'payload/config'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './src/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  editor: lexicalEditor({}),
  plugins: [payloadCloud()],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // database-adapter-config-start
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  // database-adapter-config-end
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
})
