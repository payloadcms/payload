import type { CollectionConfig } from 'payload'

import { geoCollectionSlug } from '../slugs.js'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  fields: [
    {
      name: 'point',
      type: 'point',
    },
  ],
}
