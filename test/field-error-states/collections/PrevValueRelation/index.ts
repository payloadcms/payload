import type { CollectionConfig } from 'payload'

import { collectionSlugs } from '../../shared.js'

export const PrevValueRelation: CollectionConfig = {
  slug: collectionSlugs.prevValueRelation,
  fields: [
    {
      relationTo: collectionSlugs.prevValue,
      name: 'previousValueRelation',
      type: 'relationship',
    },
  ],
}
