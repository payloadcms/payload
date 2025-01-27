import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import { buildConfig } from 'payload/config'
import path from 'path'
import FormBuilder from '@payloadcms/plugin-form-builder'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { MainMenu } from './globals/MainMenu'
import BeforeLogin from './components/BeforeLogin'

export default buildConfig({
  collections: [Pages, Users],
  globals: [MainMenu],
  admin: {
    bundler: webpackBundler(),
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  cors: ['http://localhost:3000', process.env.PAYLOAD_PUBLIC_SITE_URL],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  plugins: [
    FormBuilder({
      fields: {
        payment: false,
      },
    }),
  ],
})
