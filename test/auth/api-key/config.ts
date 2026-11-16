import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { Admins } from './collections/Admins.js'
import { APIKeys } from './collections/APIKeys.js'
import { RestrictedRelationships } from './collections/RestrictedRelationships.js'

export default buildConfigWithDefaults(
  {
    admin: {
      user: Admins.slug,
    },
    collections: [Admins, APIKeys, RestrictedRelationships],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  {
    disableAutoLogin: true,
  },
)
