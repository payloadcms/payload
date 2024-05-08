import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import BeforeLogin from './components/BeforeLogin'
import { MainMenu } from './globals/MainMenu'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  collections: [Pages, Users],
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
      ],
    },
  },
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  globals: [MainMenu],
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
