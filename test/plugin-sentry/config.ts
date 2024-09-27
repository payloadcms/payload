import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sentryPlugin } from '@payloadcms/plugin-sentry'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser } from '@test-utils/credentials.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'

export default buildConfigWithDefaults({
  admin: {
    components: {
      beforeDashboard: ['/components.js#testErrors'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [Posts, Users],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  plugins: [
    sentryPlugin({
      dsn: 'https://61edebe5ee6d4d38a9d6459c7323d777@o4505289711681536.ingest.sentry.io/4505357688242176',
      options: {
        captureErrors: [400, 403, 404],
        init: {
          debug: true,
        },
        requestHandler: {
          serverName: false,
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
