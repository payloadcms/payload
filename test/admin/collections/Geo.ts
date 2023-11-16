import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { geoCollectionSlug } from '../slugs'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  fields: [
    {
      name: 'point',
      type: 'point',
    },
  ],
}
