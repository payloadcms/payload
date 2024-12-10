import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Users } from './collections/Users'
import BeforeLogin from './components/BeforeLogin'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  collections: [Users],
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: slateEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
