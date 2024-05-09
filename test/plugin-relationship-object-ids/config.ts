import { relationshipsAsObjectIDPlugin } from '@payloadcms/plugin-relationship-object-ids'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { isMongoose } from '../helpers/isMongoose.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Relations } from './collections/Relations.js'
import { Uploads } from './collections/Uploads.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Relations, Posts, Uploads],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    if (!isMongoose(payload)) return
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [relationshipsAsObjectIDPlugin()],
})
