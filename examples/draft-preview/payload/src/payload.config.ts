import path from 'path'
import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import BeforeLogin from './components/BeforeLogin'
import { MainMenu } from './globals/MainMenu'

export default buildConfig({
  collections: [Pages, Users],
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  globals: [MainMenu],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
