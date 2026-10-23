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
        fields: [{ name: 'title', type: 'text', localized: true }],
        hierarchy: {
          joinField: { name: 'children' },
          parentFieldName: 'parent',
        },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: { autoGenerate: false },
  },
  suite: 'hierarchy-localized-joins',
})
