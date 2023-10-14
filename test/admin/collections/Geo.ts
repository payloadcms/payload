import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const Geo: CollectionConfig = {
  slug: 'geo',
  fields: [
    {
      name: 'point',
      type: 'point',
    },
  ],
}
