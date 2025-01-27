import type { CollectionConfig } from '../../../../packages/payload/src/exports/types'

import { slugs } from '../../shared'

export const PrevValueRelation: CollectionConfig = {
  slug: slugs.prevValueRelation,
  fields: [
    {
      relationTo: slugs.prevValue,
      name: 'previousValueRelation',
      type: 'relationship',
    },
  ],
}
