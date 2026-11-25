import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Versions } from './collections/Versions.js'

export default buildConfigWithDefaults({
  config: {
    collections: [
      {
        ...Versions,
        access: {
          read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
        },
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'parent', type: 'relationship', hasMany: false, relationTo: Versions.slug },
          { name: 'children', type: 'join', collection: [Versions.slug], on: 'parent' },
        ],
        hierarchy: {
          parentFieldName: 'parent',
        },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: { autoGenerate: false },
  },
  suite: 'hierarchy-localized-joins',
})
