import type { CollectionConfig } from 'payload'

import { customIdPagesSlug } from '../shared.js'

export const CustomIdPages: CollectionConfig = {
  slug: customIdPagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
