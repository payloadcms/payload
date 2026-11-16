import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { APIKeys } from './collections/APIKeys.js'
import { RestrictedRevealableKeys } from './collections/RestrictedRevealableKeys.js'
import { RevealableKeys } from './collections/RevealableKeys.js'
import { TenantRevealableKeys } from './collections/TenantRevealableKeys.js'
import { Users } from './collections/Users.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, APIKeys, RevealableKeys, RestrictedRevealableKeys, TenantRevealableKeys],
  localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
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
