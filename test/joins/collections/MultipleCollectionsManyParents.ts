import type { CollectionConfig } from 'payload'

import {
  multipleCollectionsMany1Slug,
  multipleCollectionsMany2Slug,
  multipleCollectionsManyParentsSlug,
} from '../shared.js'

export const MultipleCollectionsManyParents: CollectionConfig = {
  slug: multipleCollectionsManyParentsSlug,
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'children',
      type: 'join',
      collection: [multipleCollectionsMany1Slug, multipleCollectionsMany2Slug],
      on: 'parents',
    },
  ],
  versions: false,
}
