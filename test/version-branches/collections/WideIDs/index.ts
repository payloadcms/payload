import type { CollectionConfig } from 'payload'

import { fractionalIDsSlug, wideIDsSlug } from '../../slugs.js'

export const WideIDs: CollectionConfig = {
  slug: wideIDsSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'id', type: 'text', required: true },
    { name: 'indexedText', type: 'text', index: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Transparent numeric relation',
          fields: [{ name: 'relatedNumber', type: 'relationship', relationTo: fractionalIDsSlug }],
        },
        {
          name: 'details',
          fields: [{ name: 'relatedNumber', type: 'relationship', relationTo: fractionalIDsSlug }],
        },
      ],
    },
    { name: 'title', type: 'text', localized: true },
    {
      name: 'rowsWithAnOrdinarilyValidCustomDatabaseNameThatMustRemainSupported',
      type: 'array',
      dbName: 'wide_rows',
      fields: [
        {
          name: 'choice',
          type: 'select',
          enumName: 'wide_row_choice',
          options: ['first', 'second'],
        },
      ],
    },
    { name: 'related', type: 'relationship', relationTo: wideIDsSlug },
  ],
  indexes: [
    { fields: ['indexedText'] },
    { fields: ['indexedText', 'relatedNumber'] },
    { fields: ['indexedText', 'details.relatedNumber'] },
  ],
  versions: { drafts: true, maxPerDoc: 1000 },
}
