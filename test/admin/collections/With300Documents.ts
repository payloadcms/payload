import type { CollectionConfig } from 'payload'

import { with300DocumentsSlug } from '../slugs.js'

export const with300Documents: CollectionConfig = {
  slug: with300DocumentsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'selfRelation',
      type: 'relationship',
      relationTo: with300DocumentsSlug,
    },
  ],
}
