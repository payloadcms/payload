import path from 'path'
import { buildConfig } from 'payload/config'

import { Users } from './collections/Users'
import BeforeLogin from './components/BeforeLogin'

export default buildConfig({
  collections: [Users],
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
    process.env.PAYLOAD_PUBLIC_SITE_URL || '',
  ].filter(Boolean),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
