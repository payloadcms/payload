import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Users } from './src/collections/Users'
import BeforeLogin from './src/components/BeforeLogin'

export default buildConfig({
  collections: [Users],
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  secret: process.env.PAYLOAD_SECRET || '',
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
