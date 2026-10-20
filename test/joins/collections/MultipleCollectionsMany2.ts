import type { CollectionConfig } from 'payload'

import {
  multipleCollectionsMany2Slug,
  multipleCollectionsManyParentsSlug,
} from '../shared.js'

export const MultipleCollectionsMany2: CollectionConfig = {
  slug: multipleCollectionsMany2Slug,
  access: { read: () => true },
  admin: { useAsTitle: 'title' },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'parents',
      type: 'relationship',
      hasMany: true,
      relationTo: multipleCollectionsManyParentsSlug,
    },
  ],
  versions: false,
}
