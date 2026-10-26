import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { Users } from './collections/Users.js'
import { passwordHashIterationsUsersSlug } from './shared.js'

export default buildConfigWithDefaults(
  {
    admin: { user: passwordHashIterationsUsersSlug },
    auth: { passwordHashIterations: 100000 },
    collections: [Users],
  },
  { disableAutoLogin: true },
)
