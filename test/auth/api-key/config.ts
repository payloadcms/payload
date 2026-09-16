import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { Admins } from './collections/Admins.js'
import { APIKeys } from './collections/APIKeys.js'
import { RestrictedAPIKeys } from './collections/RestrictedAPIKeys.js'
import { RestrictedRelationships } from './collections/RestrictedRelationships.js'

export default buildConfigWithDefaults({
  config: {
    admin: {
      user: Admins.slug,
    },
    collections: [Admins, APIKeys, RestrictedAPIKeys, RestrictedRelationships],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  disableAutoLogin: true,
  suite: 'auth-api-key',
})
