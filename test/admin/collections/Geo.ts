import type { CollectionConfig } from 'payload'

import { geoCollectionSlug } from '../slugs.js'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  admin: {
    components: {
      views: {
        Edit: {
          API: {
            actions: ['../components/CollectionAPIButton/index.js#CollectionAPIButton'],
          },
          Default: {
            actions: ['../components/CollectionEditButton/index.js#CollectionEditButton'],
          },
        },
        List: {
          actions: ['../components/CollectionListButton/index.js#CollectionListButton'],
        },
      },
    },
  },
  fields: [
    {
      name: 'point',
      type: 'point',
    },
  ],
}
