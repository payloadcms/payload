import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { FirstUsers } from './collections/FirstUsers.js'
import { firstUsersSlug } from './shared.js'

export default buildConfigWithDefaults({
  config: {
    admin: { user: firstUsersSlug },
    collections: [FirstUsers],
  },
  disableAutoLogin: true,
  suite: 'auth-first-user',
})
