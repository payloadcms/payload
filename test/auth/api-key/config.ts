import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { APIKeys } from './collections/APIKeys.js'
import { RestrictedRelationships } from './collections/RestrictedRelationships.js'

export default buildConfigWithDefaults({
  config: {
    collections: [APIKeys, RestrictedRelationships],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  disableAutoLogin: true,
  suite: 'auth-api-key',
})
