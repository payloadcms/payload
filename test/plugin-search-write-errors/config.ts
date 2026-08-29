import { searchPlugin } from '@payloadcms/plugin-search'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'posts',
      admin: { useAsTitle: 'title' },
      versions: { drafts: true },
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })
  },
  plugins: [
    searchPlugin({
      collections: ['posts'],
      // beforeSync gives every search doc the same `dedupeKey`. Combined with the
      // `unique: true` override below, the SECOND published post's search-doc write
      // hits an E11000 duplicate-key error inside the parent publish transaction.
      beforeSync: ({ searchDoc }) => ({ ...searchDoc, dedupeKey: 'constant' }),
      searchOverrides: {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: 'dedupeKey', type: 'text', unique: true },
        ],
      },
    }),
  ],
})
