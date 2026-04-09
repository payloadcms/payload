import type { CollectionConfig } from 'payload'

import { relationshipsSlug } from '../shared.js'

export const Relationships: CollectionConfig = {
  slug: relationshipsSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Tenant Collections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: relationshipsSlug,
    },
  ],
}
