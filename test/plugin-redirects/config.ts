import redirectsPlugin from '../../packages/plugin-redirects/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { seed } from './seed'

export default buildConfigWithDefaults({
  collections: [Users, Pages],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [
    redirectsPlugin({
      collections: ['pages'],
    }),
  ],
})
