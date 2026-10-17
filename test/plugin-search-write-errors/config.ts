import { searchPlugin } from '@payloadcms/plugin-search'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  config: {
    collections: [
      { slug: 'users', auth: true, fields: [] },
      {
        slug: 'posts',
        fields: [{ name: 'title', type: 'text', required: true }],
        versions: { drafts: true },
      },
    ],
    plugins: [
      searchPlugin({
        beforeSync: ({ searchDoc }) => ({ ...searchDoc, dedupeKey: 'constant' }),
        collections: ['posts'],
        searchOverrides: {
          fields: ({ defaultFields }) => [
            ...defaultFields,
            { name: 'dedupeKey', type: 'text', unique: true },
          ],
        },
      }),
    ],
  },
  suite: 'plugin-search-write-errors',
})
