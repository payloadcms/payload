import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import BeforeLogin from './components/BeforeLogin'
import { MainMenu } from './globals/MainMenu'

export default buildConfig({
  collections: [Pages, Users],
  admin: {
    bundler: webpackBundler(), // bundler-config
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
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  globals: [MainMenu],
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
