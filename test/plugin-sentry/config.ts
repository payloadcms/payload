import { sentry } from '../../packages/plugin-sentry/src/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { testErrors } from './components.js'

export default buildConfigWithDefaults({
  admin: {
    components: {
      beforeDashboard: [testErrors],
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
    sentry({
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
})
