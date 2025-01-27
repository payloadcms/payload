import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import redirects from '@payloadcms/plugin-redirects'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { MainMenu } from './globals/MainMenu'
import BeforeLogin from './BeforeLogin'

export default buildConfig({
  collections: [Pages, Users],
  admin: {
    bundler: webpackBundler(),
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  cors: ['http://localhost:3000', process.env.PAYLOAD_PUBLIC_SITE_URL],
  globals: [MainMenu],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  plugins: [
    redirects({
      collections: ['pages'],
    }),
  ],
})
