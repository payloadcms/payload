import type { CollectionConfig } from 'payload'

import {
  multipleCollectionsMany1Slug,
  multipleCollectionsManyParentsSlug,
} from '../shared.js'

export const MultipleCollectionsMany1: CollectionConfig = {
  slug: multipleCollectionsMany1Slug,
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
