import type { CollectionConfig } from 'payload'

import { fractionalIDsSlug } from '../../slugs.js'

/** Existing Mongo custom numeric IDs need not be integral. */
export const FractionalIDs: CollectionConfig = {
  slug: fractionalIDsSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'title', type: 'text' },
    {
      name: 'rows',
      type: 'array',
      fields: [
        { name: 'id', type: 'number' },
        { name: 'label', type: 'text' },
        { name: 'translation', type: 'text', localized: true },
      ],
    },
    { name: 'related', type: 'relationship', relationTo: fractionalIDsSlug },
  ],
  versions: { drafts: true },
}
