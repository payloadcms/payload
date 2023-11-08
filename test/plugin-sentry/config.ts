import { sentry } from '../../packages/plugin-sentry/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { testErrors } from './components'

export default buildConfigWithDefaults({
  collections: [Posts, Users],
  admin: {
    user: Users.slug,
    components: {
      beforeDashboard: [testErrors],
    },
  },
  plugins: [
    sentry({
      dsn: 'https://61edebe5ee6d4d38a9d6459c7323d777@o4505289711681536.ingest.sentry.io/4505357688242176',
      options: {
        init: {
          debug: true,
        },
        requestHandler: {
          serverName: false,
        },
        captureErrors: [400, 403, 404],
      },
    }),
  ],
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
