import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { jwtUsersSlug } from '../shared.js'
import { JWTUsers } from './collections/JWTUsers.js'
import { RestrictedRelationships } from './collections/RestrictedRelationships.js'

export default buildConfigWithDefaults(
  {
    admin: { user: jwtUsersSlug },
    collections: [JWTUsers, RestrictedRelationships],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  {
    disableAutoLogin: true,
  },
)
