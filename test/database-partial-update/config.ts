import type { CollectionConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { articlesSlug, usersSlug } from './shared.js'

const Articles: CollectionConfig = {
  slug: articlesSlug,
  dbName: 'partial_articles',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'watchers', type: 'relationship', relationTo: usersSlug, hasMany: true },
    {
      name: 'resources',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'children', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'resources', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      ],
    },
    {
      name: 'localizedResources',
      type: 'array',
      localized: true,
      fields: [{ name: 'label', type: 'text' }],
    },
  ],
  hooks: {
    afterChange: [
      async ({ context, doc, operation, req }) => {
        if (operation === 'create' && context.updateWatchers) {
          if (!req.transactionID) {
            throw new Error('Expected the hook to run in the create transaction')
          }
          await req.payload.db.updateOne({
            collection: articlesSlug,
            id: doc.id,
            data: { watchers: [context.updateWatchers] },
            req,
            returning: false,
            select: {},
          })
        }
      },
    ],
  },
}

export default buildConfigWithDefaults({
  suite: 'database-partial-update',
  config: {
    collections: [Articles, { slug: usersSlug, fields: [{ name: 'name', type: 'text' }] }],
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
  },
})
