import dotenv from 'dotenv'
import path from 'path'

import { payloadCloud } from '../../packages/plugin-cloud/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

// NOTE: may need to create .env file for testing
dotenv.config({
  path: path.resolve(__dirname, '.env'),
})

export default buildConfigWithDefaults({
  collections: [Media, Users],
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config?.resolve?.alias,
          [path.resolve(__dirname, '../../packages/plugin-cloud/src')]: path.resolve(
            __dirname,
            '../../packages/plugin-cloud/src/admin.js',
          ),
        },
      },
    }),
  },
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
