import type { CollectionConfig } from 'payload'

import { categoriesSlug } from '../shared.js'

export const Categories: CollectionConfig = {
  slug: categoriesSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
