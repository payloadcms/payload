import dotenv from 'dotenv'
import path from 'path'

import { payloadCloud } from '../../packages/plugin-cloud/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

// NOTE: may need to create .env file for testing
dotenv.config({
  path: path.resolve(process.cwd(), './test/plugin-cloud/.env'),
})

export default buildConfigWithDefaults({
  collections: [Media, Users],
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  plugins: [payloadCloud()],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
