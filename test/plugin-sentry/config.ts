import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sentryPlugin } from '@payloadcms/plugin-sentry'
import * as Sentry from '@sentry/nextjs'
import { APIError } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'

export default buildConfigWithDefaults({
  suite: 'plugin-sentry',
  config: {
    admin: {
      components: {
        beforeDashboard: ['/TestErrors.js#TestErrors'],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: Users.slug,
    },
    collections: [Posts, Users],
    endpoints: [
      {
        handler: () => {
          throw new APIError('Test Plugin-Sentry Exception', 500)
        },
        method: 'get',
        path: '/exception',
      },
    ],
    plugins: [
      sentryPlugin({
        options: {
          captureErrors: [400, 403, 404],
          debug: true,
        },
        Sentry,
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
