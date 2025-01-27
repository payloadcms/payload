import searchPlugin from '../../packages/plugin-search/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { seed } from './seed'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Posts],
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
    searchPlugin({
      collections: ['pages', 'posts'],
      searchOverrides: {
        fields: [
          {
            name: 'excerpt',
            label: 'Excerpt',
            type: 'text',
            admin: {
              readOnly: true,
            },
          },
        ],
      },
      beforeSync: ({ originalDoc, searchDoc }) => ({
        ...searchDoc,
        excerpt: originalDoc?.excerpt || 'This is a fallback excerpt',
      }),
      defaultPriorities: {
        pages: 10,
        posts: ({ title }) => (title === 'Hello, world!' ? 30 : 20),
      },
    }),
  ],
})
