import path from 'path'
import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { MainMenu } from './globals/MainMenu'

export default buildConfig({
  collections: [Pages, Users],
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL, process.env.PAYLOAD_PUBLIC_SITE_URL],
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL, process.env.PAYLOAD_PUBLIC_SITE_URL],
  globals: [MainMenu],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
